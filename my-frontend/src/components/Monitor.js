import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import VigilKuraApi, { BASE_URL } from '../api.js';
import { DEFAULT_BAD_WORDS } from './Settings.js';
import {
    Box,
    Button,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Modal,
    TextField,
    Alert,
    Collapse,
    Chip,
    Divider,
    CircularProgress,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Play a 4-note ascending chime using the Web Audio API
const playChime = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.35;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        osc.start(start);
        osc.stop(start + 0.8);
    });
};

// Return the matched bad word in the text, or null if none found
// Uses \b word boundaries for ASCII; plain match for non-ASCII (e.g. Vietnamese)
const containsBadWord = (text, wordList) => {
    const lower = text.normalize('NFC').toLowerCase();
    return (
        wordList.find((word) => {
            const normalized = word.normalize('NFC');
            const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const isAscii = /^[\x00-\x7F]+$/.test(normalized);
            const pattern = isAscii ? new RegExp(`\\b${escaped}\\b`, 'i') : new RegExp(escaped, 'i');
            return pattern.test(lower);
        }) || null
    );
};

// Format seconds as "1h 30m 05s" — used for both the live timer and session headers
const formatTime = (secs, pad = false) => {
    if (!secs) return pad ? '0s' : '< 1s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const ms = pad ? String(m).padStart(2, '0') : m;
    const ss = pad ? String(s).padStart(2, '0') : s;
    if (h > 0) return `${h}h ${ms}m ${ss}s`;
    if (m > 0) return `${m}m ${ss}s`;
    return `${s}s`;
};

// Format an ISO timestamp into a short readable string
const formatDate = (ts) =>
    new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

// Wrap the flagged word in red text inside a transcript chunk
const highlightWord = (text, word) => {
    if (!word) return text;
    const escaped = word.normalize('NFC').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.normalize('NFC').split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
            <span key={i} style={{ color: '#d32f2f', fontWeight: 700 }}>
                {part}
            </span>
        ) : (
            part
        ),
    );
};

// Resolve notification channel from two boolean settings (email + sms)
const getNotifyChannel = (email, sms) => {
    if (email && sms) return 'both';
    if (email) return 'email';
    if (sms) return 'phone';
    return null;
};

// Transcript section for Last Session
// Auto-scrolls to the first incident when detections are available
const LastSessionTranscript = ({ transcripts, detections, translatedTranscript, showTranslation, onToggleTranslation }) => {
    const firstIncidentRef = useRef(null);

    useEffect(() => {
        if (firstIncidentRef.current) {
            setTimeout(() => firstIncidentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
    }, [detections]);

    return (
        <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    Session transcript
                </Typography>
                {translatedTranscript && (
                    <Chip
                        size="small"
                        label={showTranslation ? 'Show original' : 'Translate'}
                        onClick={onToggleTranslation}
                        variant={showTranslation ? 'filled' : 'outlined'}
                        color="primary"
                    />
                )}
            </Box>
            <Box sx={{ maxHeight: 200, overflowY: 'auto', bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
                {transcripts.map((t, i) => {
                    const matchedDetection = (detections || []).find(
                        (d) => Math.abs(new Date(d.detected_at).getTime() - new Date(t.recorded_at).getTime()) < 2000,
                    );
                    const isFirstIncident = matchedDetection && (detections || []).indexOf(matchedDetection) === 0;
                    const raw = translatedTranscript?.[i];
                    const translatedText = typeof raw === 'string' ? raw : raw?.translatedText || raw?.text || null;
                    const displayText = showTranslation && translatedText ? translatedText : t.text;
                    return (
                        <Box key={t.id} ref={isFirstIncident ? firstIncidentRef : null} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.disabled">
                                {new Date(t.recorded_at).toLocaleTimeString()}
                            </Typography>
                            <Typography variant="body2">
                                {matchedDetection && !showTranslation ? highlightWord(displayText, matchedDetection.word) : displayText}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

const Monitor = () => {
    const { user, kidMode, setKidMode } = useAuth();
    const navigate = useNavigate();

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [sessionSeconds, setSessionSeconds] = useState(0);

    const [alerts, setAlerts] = useState([]);
    const [showAllDetected, setShowAllDetected] = useState(false);

    const [lastSession, setLastSession] = useState(null);
    const [lastSessionShowTranslation, setLastSessionShowTranslation] = useState(false);
    const [loadingLastSession, setLoadingLastSession] = useState(false);

    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);

    const [supported, setSupported] = useState(true);

    const [showWarningBanner, setShowWarningBanner] = useState(false);
    const [showTimeUpBanner, setShowTimeUpBanner] = useState(false);
    const [warningMinutesLeft, setWarningMinutesLeft] = useState(0);

    const [wordAlert, setWordAlert] = useState(null);

    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [forgotPin, setForgotPin] = useState(false);
    const [password, setPassword] = useState('');

    const [devInput, setDevInput] = useState('');

    // Prefix localStorage keys per user so different accounts don't share data
    const lsKey = (key) => `${user?.username}:${key}`;

    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const sessionIdRef = useRef(null);
    const wordAlertTimerRef = useRef(null);
    const sessionStartRef = useRef(null);

    // Refs so the speech recognition callback always has up-to-date settings
    const wordDetectionEnabledRef = useRef(false);
    const wordListRef = useRef([]);
    const wordAlertPopupRef = useRef(false);
    const wordChimeRef = useRef(false);
    const wordNotifyChannelRef = useRef(null);
    const lastNotifTimeRef = useRef(null);
    const notifCooldownRef = useRef(5);

    // Fetch detections + transcripts for a session and store in lastSession state
    const fetchLastSession = useCallback(async (id) => {
        setLoadingLastSession(true);
        try {
            const [dets, trans] = await Promise.all([VigilKuraApi.getDetections(id), VigilKuraApi.getTranscripts(id)]);
            const savedMeta = JSON.parse(localStorage.getItem(lsKey('lastSessionMeta')) || '{}');
            const savedTranslation = JSON.parse(localStorage.getItem(lsKey('lastSessionTranslation')) || 'null');
            const savedTranslatedLanguage = localStorage.getItem(lsKey('lastSessionTranslatedLanguage')) || null;
            setLastSession({
                detections: dets,
                transcripts: trans,
                childName: savedMeta.childName || null,
                startedAt: savedMeta.startedAt || null,
                duration: savedMeta.duration || null,
                translated_transcript: savedTranslation,
                translated_language: savedTranslatedLanguage,
            });
        } catch {
            setLastSession({ detections: [], transcripts: [], childName: null, startedAt: null, duration: null });
        } finally {
            setLoadingLastSession(false);
        }
    }, []);

    // On mount: check speech recognition support, load children, restore last session
    useEffect(() => {
        if (!user) {
            navigate('/vigilkura');
            return;
        }
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setSupported(false);
        }
        VigilKuraApi.getChildren()
            .then((kids) => {
                setChildren(kids);
                if (kids.length > 0) {
                    const savedId = localStorage.getItem(lsKey('selectedChildId'));
                    const match = savedId ? kids.find((c) => String(c.id) === savedId) : null;
                    setSelectedChild(match || kids[0]);
                }
            })
            .catch(() => {});

        const savedSessionId = localStorage.getItem(lsKey('lastSessionId'));
        if (savedSessionId) fetchLastSession(savedSessionId);

        return () => clearInterval(timerRef.current);
    }, [user, navigate, fetchLastSession]);

    // Block browser back button and warn on tab close while in Kid Mode
    useEffect(() => {
        if (!kidMode) return;
        const handlePopState = () => window.history.pushState(null, '', window.location.href);
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
            if (sessionIdRef.current) {
                const params = new URLSearchParams({
                    username: user.username,
                    childName: selectedChild?.name || '',
                    notify: wordNotifyChannelRef.current || '',
                });
                navigator.sendBeacon(`${BASE_URL}/sessions/${sessionIdRef.current}/abandoned`, params);
            }
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [kidMode]);

    // Handle a final speech recognition result — save transcript and check for bad words
    const processTranscript = (text) => {
        const trimmed = text.trim();
        if (!trimmed || !sessionIdRef.current) return;
        setTranscript(trimmed);
        VigilKuraApi.addTranscript(sessionIdRef.current, trimmed).catch(console.error);
        if (!wordDetectionEnabledRef.current) return;

        const badWord = containsBadWord(trimmed, wordListRef.current);
        if (!badWord) return;

        const alertTime = new Date().toLocaleTimeString();
        setAlerts((prev) => [{ id: Date.now(), word: badWord, context: trimmed, time: alertTime }, ...prev]);
        if (wordAlertPopupRef.current) {
            setWordAlert({ word: badWord, context: trimmed, time: alertTime });
            clearTimeout(wordAlertTimerRef.current);
            wordAlertTimerRef.current = setTimeout(() => setWordAlert(null), 5000);
        }
        if (wordChimeRef.current) playChime();
        const now = Date.now();
        const cooldownMs = (notifCooldownRef.current ?? 5) * 60 * 1000;
        const canNotify = !lastNotifTimeRef.current || now - lastNotifTimeRef.current >= cooldownMs;
        if (canNotify && wordNotifyChannelRef.current) lastNotifTimeRef.current = now;
        VigilKuraApi.addDetection(sessionIdRef.current, user.username, badWord, trimmed, selectedChild?.name, canNotify ? wordNotifyChannelRef.current : null).catch(
            console.error,
        );
    };

    // Start the screen time countdown timer
    const startScreenTimeTimer = (settings) => {
        const limitSecs = settings.durationEnabled ? (settings.durationHours || 0) * 3600 + (settings.durationMinutes || 0) * 60 : 0;
        const warnSecs = settings.warningEnabled && limitSecs > 0 ? limitSecs - (settings.warningMinutes || 5) * 60 : 0;

        setWarningMinutesLeft(settings.warningMinutes || 5);
        setShowWarningBanner(false);
        setShowTimeUpBanner(false);

        timerRef.current = setInterval(() => {
            setSessionSeconds((s) => {
                const next = s + 1;

                if (limitSecs > 0 && warnSecs > 0 && next === warnSecs) {
                    setShowWarningBanner(true);
                    setTimeout(() => setShowWarningBanner(false), 5000);
                    if (Notification.permission === 'granted') {
                        new Notification('VigilKura', { body: 'Screen time is almost up!' });
                    }
                }

                if (limitSecs > 0 && next === limitSecs) {
                    if (settings.timeUpAlert !== false) setShowTimeUpBanner(true);
                    if (settings.timeUpChime) playChime();
                    if (Notification.permission === 'granted') {
                        new Notification('VigilKura', { body: "Time's up!" });
                    }
                    const channel = getNotifyChannel(settings.timeUpEmail, settings.timeUpSms);
                    if (channel) {
                        VigilKuraApi.notifyTimeUp(user.username, selectedChild?.name, channel).catch(console.error);
                    }
                }

                return next;
            });
        }, 1000);
    };

    const startListening = async () => {
        try {
            const session = await VigilKuraApi.startSession(user.username, selectedChild?.id || null);
            sessionIdRef.current = session.id;
        } catch (error) {
            console.error('Failed to start session:', error);
        }

        sessionStartRef.current = new Date().toISOString();

        // Clear previous last session data
        setLastSession(null);
        setLastSessionShowTranslation(false);
        setAlerts([]);
        localStorage.removeItem(lsKey('lastSessionId'));
        localStorage.removeItem(lsKey('lastSessionMeta'));
        localStorage.removeItem(lsKey('lastSessionTranslation'));
        localStorage.removeItem(lsKey('lastSessionTranslatedLanguage'));

        // Capture settings once at session start — used inside the speech recognition callback
        const childSettings = selectedChild?.settings || {};
        const wordList = childSettings.wordList?.length > 0 ? childSettings.wordList : DEFAULT_BAD_WORDS;
        const wordDetectionEnabled = childSettings.wordDetectionEnabled !== false;
        const capturedWordAlertPopup = childSettings.wordAlertPopup !== false;
        const capturedWordChime = childSettings.wordChime || false;
        const wordNotifyChannel = getNotifyChannel(childSettings.wordEmail, childSettings.wordSms);

        wordDetectionEnabledRef.current = wordDetectionEnabled;
        wordListRef.current = wordList;
        wordAlertPopupRef.current = capturedWordAlertPopup;
        wordChimeRef.current = capturedWordChime;
        wordNotifyChannelRef.current = wordNotifyChannel;
        notifCooldownRef.current = childSettings.notifCooldown ?? 5;
        lastNotifTimeRef.current = null;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += text;
                    if (sessionIdRef.current && text.trim()) {
                        VigilKuraApi.addTranscript(sessionIdRef.current, text.trim()).catch(console.error);
                    }
                    if (wordDetectionEnabled) {
                        const badWord = containsBadWord(text, wordList);
                        if (badWord) {
                            const trimmed = text.trim();
                            const alertTime = new Date().toLocaleTimeString();
                            setAlerts((prev) => [{ id: Date.now(), word: badWord, context: trimmed, time: alertTime }, ...prev]);
                            if (capturedWordAlertPopup) {
                                setWordAlert({ word: badWord, context: trimmed, time: alertTime });
                                clearTimeout(wordAlertTimerRef.current);
                                wordAlertTimerRef.current = setTimeout(() => setWordAlert(null), 5000);
                            }
                            if (capturedWordChime) playChime();
                            if (sessionIdRef.current) {
                                const now = Date.now();
                                const cooldownMs = (notifCooldownRef.current ?? 5) * 60 * 1000;
                                const canNotify = !lastNotifTimeRef.current || now - lastNotifTimeRef.current >= cooldownMs;
                                if (canNotify && wordNotifyChannel) lastNotifTimeRef.current = now;
                                VigilKuraApi.addDetection(
                                    sessionIdRef.current,
                                    user.username,
                                    badWord,
                                    trimmed,
                                    selectedChild?.name,
                                    canNotify ? wordNotifyChannel : null,
                                ).catch(console.error);
                            }
                        }
                    }
                } else {
                    interimTranscript += text;
                }
            }
            setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event) => console.error('Speech recognition error:', event.error);
        recognition.onend = () => {
            if (recognitionRef.current) recognition.start();
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setKidMode(true);
        setSessionSeconds(0);
        setShowAllDetected(false);
        startScreenTimeTimer(childSettings);
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        if (sessionIdRef.current) {
            const meta = {
                sessionId: sessionIdRef.current,
                childName: selectedChild?.name || null,
                startedAt: sessionStartRef.current,
                duration: sessionSeconds,
            };
            localStorage.setItem(lsKey('lastSessionId'), sessionIdRef.current);
            localStorage.setItem(lsKey('lastSessionMeta'), JSON.stringify(meta));

            // End the session — OpenAI translation runs server-side, updates lastSession when done
            VigilKuraApi.endSession(sessionIdRef.current)
                .then((session) => {
                    const translation = session?.translated_transcript || null;
                    const translatedLanguage = session?.translated_language || null;
                    if (translation) {
                        localStorage.setItem(lsKey('lastSessionTranslation'), JSON.stringify(translation));
                        localStorage.setItem(lsKey('lastSessionTranslatedLanguage'), translatedLanguage);
                    } else {
                        localStorage.removeItem(lsKey('lastSessionTranslation'));
                        localStorage.removeItem(lsKey('lastSessionTranslatedLanguage'));
                    }
                    setLastSession((prev) =>
                        prev ? { ...prev, translated_transcript: translation, translated_language: translatedLanguage } : prev,
                    );
                })
                .catch(console.error);

            // Fetch detections + transcripts immediately (runs in parallel with endSession/OpenAI)
            fetchLastSession(sessionIdRef.current);
            sessionIdRef.current = null;
        }

        setIsListening(false);
        setKidMode(false);
        setTranscript('');
        setPin('');
        setPinError('');
        setShowWarningBanner(false);
        setShowTimeUpBanner(false);
        clearInterval(timerRef.current);
        timerRef.current = null;
        setSessionSeconds(0);
        clearTimeout(wordAlertTimerRef.current);
        wordAlertTimerRef.current = null;
        setWordAlert(null);
    };

    const handleStopClick = () => {
        setShowPinModal(true);
        setPinError('');
        setPin('');
        setPassword('');
        setForgotPin(!user.hasPin);
    };

    const handlePinSubmit = async () => {
        try {
            await VigilKuraApi.verifyPin(user.username, pin);
            setShowPinModal(false);
            stopListening();
        } catch {
            setPinError('Incorrect PIN. Try again.');
            setPin('');
        }
    };

    const handlePasswordSubmit = async () => {
        try {
            await VigilKuraApi.login(user.username, password);
            setShowPinModal(false);
            stopListening();
        } catch {
            setPinError('Incorrect password. Try again.');
            setPassword('');
        }
    };

    if (!supported) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="error">
                    Speech recognition is not supported in this browser. Please use Chrome.
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                maxWidth: 700,
                mx: 'auto',
                mt: 4,
                p: 2,
                ...(kidMode && {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    maxWidth: '100%',
                    bgcolor: 'background.default',
                    zIndex: 1200,
                    overflow: 'auto',
                    p: 4,
                }),
            }}
        >
            <Typography variant="h4" sx={{ mb: 1 }}>
                {kidMode ? 'Monitoring Active' : 'Language Monitor'}
            </Typography>

            {/* Stats bar — shown during active session */}
            {isListening && (
                <Paper variant="outlined" sx={{ display: 'flex', gap: 4, p: 2, mb: 3, alignItems: 'center' }}>
                    {selectedChild && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Monitoring
                            </Typography>
                            <Typography variant="h6">{selectedChild.name}</Typography>
                        </Box>
                    )}
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Session Time
                        </Typography>
                        <Typography variant="h6">{formatTime(sessionSeconds, true)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Incidents
                        </Typography>
                        <Typography variant="h6" color={alerts.length > 0 ? 'error' : 'text.primary'}>
                            {alerts.length}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Status
                        </Typography>
                        <Typography variant="h6" color={alerts.length > 0 ? 'error.main' : 'success.main'}>
                            {alerts.length > 0 ? `⚠️ ${alerts.length} incident${alerts.length > 1 ? 's' : ''}` : '✓ All clear'}
                        </Typography>
                    </Box>
                </Paper>
            )}

            {/* Screen time warning banner */}
            <Collapse in={showWarningBanner && isListening}>
                <Alert severity="warning" onClose={() => setShowWarningBanner(false)} sx={{ mb: 2 }}>
                    ⚠️ {warningMinutesLeft} minute{warningMinutesLeft !== 1 ? 's' : ''} of screen time left!
                </Alert>
            </Collapse>

            {/* Time's up banner */}
            <Collapse in={showTimeUpBanner && isListening}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    🔴 Screen time is up! Please stop the session.
                </Alert>
            </Collapse>

            {/* Word detection pop-up banner — word is blurred, auto-dismisses after 5s */}
            <Collapse in={!!wordAlert && isListening}>
                <Alert severity="warning" onClose={() => setWordAlert(null)} sx={{ mb: 2 }}>
                    ⚠️ Bad language detected at {wordAlert?.time}:{' '}
                    <Box component="span" sx={{ display: 'inline-block', filter: 'blur(4px)', verticalAlign: 'middle', userSelect: 'none' }}>
                        {wordAlert?.word}
                    </Box>
                </Alert>
            </Collapse>

            {/* Child selector — only shown when there are multiple children */}
            {!isListening && children.length > 1 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Who are you monitoring?
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {children.map((child) => (
                            <Chip
                                key={child.id}
                                label={child.name}
                                variant={selectedChild?.id === child.id ? 'filled' : 'outlined'}
                                color={selectedChild?.id === child.id ? 'primary' : 'default'}
                                onClick={() => {
                                    setSelectedChild(child);
                                    localStorage.setItem(lsKey('selectedChildId'), String(child.id));
                                }}
                            />
                        ))}
                    </Box>
                    {!selectedChild && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            Select a child to start monitoring.
                        </Typography>
                    )}
                </Box>
            )}

            {/* Mic control buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                {!isListening ? (
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<MicIcon />}
                        onClick={startListening}
                        disabled={children.length > 1 && !selectedChild}
                    >
                        Start Monitoring
                    </Button>
                ) : (
                    <Button variant="contained" color="error" size="large" startIcon={<MicOffIcon />} onClick={handleStopClick}>
                        Stop Monitoring
                    </Button>
                )}
                {isListening && (
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                        ● Listening...
                    </Typography>
                )}
                {/* Dev-only test input — simulates speech without the mic */}
                {isListening && process.env.NODE_ENV === 'development' && user?.isAdmin && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <TextField
                            size="small"
                            placeholder="Test input (dev only)"
                            value={devInput}
                            onChange={(e) => setDevInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && devInput.trim()) {
                                    processTranscript(devInput.trim());
                                    setDevInput('');
                                }
                            }}
                            sx={{ flex: 1 }}
                        />
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                if (devInput.trim()) {
                                    processTranscript(devInput.trim());
                                    setDevInput('');
                                }
                            }}
                        >
                            Send
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Detections — hidden from child during monitoring (Kid Mode) */}
            {!kidMode && (
                <>
                    {/* Live detections during an active session */}
                    {isListening && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6">Detected ({alerts.length})</Typography>
                                {alerts.length > 0 && (
                                    <Button
                                        size="small"
                                        startIcon={showAllDetected ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        onClick={() => setShowAllDetected((v) => !v)}
                                    >
                                        {showAllDetected ? 'Hide' : `Show (${alerts.length})`}
                                    </Button>
                                )}
                            </Box>
                            {alerts.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    No bad language detected yet.
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    {alerts.map((alert) => (
                                        <ListItem key={alert.id} disablePadding sx={{ mb: 1 }}>
                                            <Paper sx={{ p: 1.5, width: '100%', borderLeft: '4px solid', borderColor: 'error.main' }}>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
                                                            Bad language detected at {alert.time}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                display: 'block',
                                                                filter: showAllDetected ? 'none' : 'blur(6px)',
                                                                transition: 'filter 0.2s ease',
                                                                userSelect: showAllDetected ? 'text' : 'none',
                                                            }}
                                                        >
                                                            <strong>"{alert.word}"</strong> — "{alert.context}"
                                                        </Box>
                                                    }
                                                />
                                            </Paper>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </>
                    )}

                    {/* Last session results */}
                    {!isListening && (
                        <>
                            {loadingLastSession && <CircularProgress size={24} sx={{ mt: 1 }} />}

                            {!loadingLastSession && lastSession && (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                        <Typography variant="h6">Last Session</Typography>
                                        <Chip
                                            label={`${lastSession.detections.length} incident${lastSession.detections.length !== 1 ? 's' : ''}`}
                                            size="small"
                                            color={lastSession.detections.length > 0 ? 'error' : 'success'}
                                            variant={lastSession.detections.length > 0 ? 'filled' : 'outlined'}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                        {lastSession.startedAt && formatDate(lastSession.startedAt)}
                                        {lastSession.duration != null && ` · ${formatTime(lastSession.duration)}`}
                                        {lastSession.childName && ` · ${lastSession.childName}`}
                                    </Typography>

                                    {lastSession.detections.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            No incidents last session.
                                        </Typography>
                                    ) : (
                                        <Box>
                                            {lastSession.detections.map((d) => {
                                                const detTime = new Date(d.detected_at).getTime();
                                                const nearby = lastSession.transcripts.filter((t) => {
                                                    const tTime = new Date(t.recorded_at).getTime();
                                                    return tTime >= detTime - 30000 && tTime <= detTime + 30000;
                                                });
                                                return (
                                                    <Box key={d.id} sx={{ mb: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                            <Chip label={`"${d.word}"`} size="small" color="error" variant="filled" />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(d.detected_at).toLocaleTimeString()}
                                                            </Typography>
                                                        </Box>
                                                        {nearby.length > 0 ? (
                                                            <Box sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'error.light', ml: 0.5 }}>
                                                                {nearby.map((t) => {
                                                                    const isAtDetection =
                                                                        Math.abs(new Date(t.recorded_at).getTime() - detTime) < 2000;
                                                                    return (
                                                                        <Typography
                                                                            key={t.id}
                                                                            variant="body2"
                                                                            sx={
                                                                                isAtDetection
                                                                                    ? { fontWeight: 600, color: 'error.main' }
                                                                                    : { color: 'text.secondary' }
                                                                            }
                                                                        >
                                                                            {t.text}
                                                                        </Typography>
                                                                    );
                                                                })}
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                                                                "{d.context}"
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}

                                    {lastSession.transcripts.length > 0 && (
                                        <LastSessionTranscript
                                            transcripts={lastSession.transcripts}
                                            detections={lastSession.detections}
                                            translatedTranscript={lastSession.translated_transcript}
                                            showTranslation={lastSessionShowTranslation}
                                            onToggleTranslation={() => setLastSessionShowTranslation((v) => !v)}
                                        />
                                    )}
                                </>
                            )}

                            {!loadingLastSession && !lastSession && (
                                <Typography variant="body2" color="text.secondary">
                                    No sessions yet. Start monitoring to see results here.
                                </Typography>
                            )}
                        </>
                    )}
                </>
            )}

            {/* PIN / Password modal to stop monitoring */}
            <Modal open={showPinModal} onClose={() => setShowPinModal(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        width: 300,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {forgotPin ? 'Enter password to stop' : 'Enter PIN to stop'}
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            forgotPin ? handlePasswordSubmit() : handlePinSubmit();
                        }}
                    >
                        {!forgotPin ? (
                            <TextField
                                fullWidth
                                type="password"
                                label="PIN"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setPinError('');
                                }}
                                inputProps={{ maxLength: 4, pattern: '[0-9]*', inputMode: 'numeric' }}
                                error={!!pinError}
                                helperText={pinError}
                                autoFocus
                                sx={{ mb: 2 }}
                            />
                        ) : (
                            <TextField
                                fullWidth
                                type="password"
                                label="Password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPinError('');
                                }}
                                error={!!pinError}
                                helperText={pinError}
                                autoFocus
                                sx={{ mb: 2 }}
                            />
                        )}
                    </Box>
                    <Button variant="contained" fullWidth onClick={forgotPin ? handlePasswordSubmit : handlePinSubmit} sx={{ mb: 1 }}>
                        Confirm
                    </Button>
                    {user.hasPin && (
                        <Button
                            size="small"
                            color="inherit"
                            onClick={() => {
                                setForgotPin((v) => !v);
                                setPinError('');
                                setPin('');
                                setPassword('');
                            }}
                        >
                            {forgotPin ? 'Back to PIN' : 'Forgot PIN?'}
                        </Button>
                    )}
                </Box>
            </Modal>
        </Box>
    );
};

export default Monitor;
