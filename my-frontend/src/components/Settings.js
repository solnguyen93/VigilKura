import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import VigilKuraApi from '../api.js';
import { Box, Typography, TextField, Button, Chip, Divider, FormControlLabel, Switch, Paper, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';

// Default list of words that trigger an alert when detected in speech
export const DEFAULT_BAD_WORDS = [
    'damn', 'hell', 'crap', 'ass', 'shit', 'fuck', 'bitch', 'bastard',
    'piss', 'dick', 'cock', 'pussy', 'cunt', 'asshole', 'bullshit',
    'motherfucker', 'faggot', 'nigger', 'slut', 'whore', 'retard',
];

// Normalize raw settings from the database into a full settings object with defaults
// Using !== false for booleans that default to ON (wordDetectionEnabled, wordAlertPopup, timeUpAlert)
const loadSettings = (settings = {}) => ({
    wordList: settings.wordList || [...DEFAULT_BAD_WORDS],
    // Word detection notification settings — on by default
    wordDetectionEnabled: settings.wordDetectionEnabled !== false,
    wordAlertPopup: settings.wordAlertPopup !== false,
    wordChime: settings.wordChime || false,
    wordEmail: settings.wordEmail || false,
    wordSms: settings.wordSms || false,
    notifCooldown: settings.notifCooldown ?? 5,
    // Screen time settings
    durationEnabled: settings.durationEnabled || false,
    durationHours: settings.durationHours ?? 0,
    durationMinutes: settings.durationMinutes ?? 0,
    warningEnabled: settings.warningEnabled || false,
    warningMinutes: settings.warningMinutes ?? 5,
    screenTimeAction: settings.screenTimeAction || 'notify',
    // Screen time notification settings — alert on by default
    timeUpAlert: settings.timeUpAlert !== false,
    timeUpChime: settings.timeUpChime || false,
    timeUpEmail: settings.timeUpEmail || false,
    timeUpSms: settings.timeUpSms || false,
});

const Settings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Child selector state
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);

    // Word list state
    const [wordList, setWordList] = useState([...DEFAULT_BAD_WORDS]);
    const [newWord, setNewWord] = useState('');
    const [newWordError, setNewWordError] = useState('');
    const [showWords, setShowWords] = useState(false);
    const [hoveredWord, setHoveredWord] = useState(null);

    // Word detection notification settings
    const [wordDetectionEnabled, setWordDetectionEnabled] = useState(true);
    const [wordAlertPopup, setWordAlertPopup] = useState(true);
    const [wordChime, setWordChime] = useState(false);
    const [wordEmail, setWordEmail] = useState(false);
    const [wordSms, setWordSms] = useState(false);
    const [notifCooldown, setNotifCooldown] = useState(5);

    // Screen time settings
    const [durationEnabled, setDurationEnabled] = useState(false);
    const [durationHours, setDurationHours] = useState(0);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const [warningEnabled, setWarningEnabled] = useState(false);
    const [warningMinutes, setWarningMinutes] = useState(5);
    const [screenTimeAction, setScreenTimeAction] = useState('notify');

    // Screen time notification settings
    const [timeUpAlert, setTimeUpAlert] = useState(true);
    const [timeUpChime, setTimeUpChime] = useState(false);
    const [timeUpEmail, setTimeUpEmail] = useState(false);
    const [timeUpSms, setTimeUpSms] = useState(false);

    // Save state and refs
    const [saveMsg, setSaveMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const autoSaveTimer = useRef(null);
    const isLoadingRef = useRef(false); // Prevents auto-save from firing during initial settings load

    // User's phone number — fetched on load to gate SMS notification options
    const [userPhone, setUserPhone] = useState('');

    // Persist settings to the backend for the selected child
    const doSave = useCallback(async (settings, child) => {
        if (!child) return;
        setSaving(true);
        try {
            const updated = await VigilKuraApi.updateChildSettings(child.id, settings);
            // Merge updated settings back into local children state
            const merged = { ...child, settings: updated.settings };
            setChildren((prev) => prev.map((c) => (c.id === child.id ? merged : c)));
        } catch (err) {
            setSaveMsg(err.response?.data?.message || 'Error saving.');
        } finally {
            setSaving(false);
        }
    }, []);

    // Debounce saves so rapid state changes don't fire multiple API calls
    const scheduleAutoSave = useCallback((settings, child) => {
        if (isLoadingRef.current) return;
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => doSave(settings, child), 800);
    }, [doSave]);

    // Apply a full settings object to all local state variables
    const applySettings = (s) => {
        setWordList(s.wordList);
        setWordDetectionEnabled(s.wordDetectionEnabled);
        setWordAlertPopup(s.wordAlertPopup);
        setWordChime(s.wordChime);
        setWordEmail(s.wordEmail);
        setWordSms(s.wordSms);
        setNotifCooldown(s.notifCooldown);
        setDurationEnabled(s.durationEnabled);
        setDurationHours(s.durationHours);
        setDurationMinutes(s.durationMinutes);
        setWarningEnabled(s.warningEnabled);
        setWarningMinutes(s.warningMinutes);
        setScreenTimeAction(s.screenTimeAction);
        setTimeUpAlert(s.timeUpAlert !== false);
        setTimeUpChime(s.timeUpChime || false);
        setTimeUpEmail(s.timeUpEmail || false);
        setTimeUpSms(s.timeUpSms || false);
    };

    // Fetch children and user's phone number on mount
    useEffect(() => {
        if (!user) { navigate('/vigilkura'); return; }
        Promise.all([
            VigilKuraApi.getChildren(),
            VigilKuraApi.getUserByUsername(user.username),
        ]).then(([kids, userData]) => {
            setUserPhone(userData.phone || '');
            setChildren(kids);
            // Default to first child if available
            if (kids.length > 0) {
                setSelectedChild(kids[0]);
                applySettings(loadSettings(kids[0].settings));
            }
        }).catch(() => {});
    }, [user, navigate]);

    // Load settings when selected child changes
    useEffect(() => {
        if (!selectedChild) return;
        // Set flag to suppress auto-save during programmatic state updates
        isLoadingRef.current = true;
        applySettings(loadSettings(selectedChild.settings));
        setSaveMsg('');
        setTimeout(() => { isLoadingRef.current = false; }, 0);
    }, [selectedChild]);

    // Auto-save whenever any setting changes
    useEffect(() => {
        const settings = {
            wordList,
            wordDetectionEnabled, wordAlertPopup, wordChime, wordEmail, wordSms, notifCooldown,
            durationEnabled, durationHours, durationMinutes,
            warningEnabled, warningMinutes, screenTimeAction,
            timeUpAlert, timeUpChime, timeUpEmail, timeUpSms,
        };
        scheduleAutoSave(settings, selectedChild);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wordList, wordDetectionEnabled, wordAlertPopup, wordChime, wordEmail, wordSms, notifCooldown, durationEnabled, durationHours, durationMinutes, warningEnabled, warningMinutes, screenTimeAction, timeUpAlert, timeUpChime, timeUpEmail, timeUpSms]);

    // Add a custom word to the word list
    const handleAddWord = () => {
        const word = newWord.trim().toLowerCase();
        if (!word) return;
        if (wordList.includes(word)) { setNewWordError('Already in your list.'); return; }
        setWordList((prev) => [...prev, word]);
        setNewWord('');
        setNewWordError('');
    };

    // Remove a single word from the word list
    const handleRemoveWord = (word) => setWordList((prev) => prev.filter((w) => w !== word));

    // Reset word list back to the default set
    const handleReset = () => setWordList([...DEFAULT_BAD_WORDS]);

    // Track how many defaults were removed and how many custom words were added
    const removedCount = DEFAULT_BAD_WORDS.filter((w) => !wordList.includes(w)).length;
    const addedCount = wordList.filter((w) => !DEFAULT_BAD_WORDS.includes(w)).length;

    // Shown when SMS is enabled but no phone number is on file
    // Clicking the link navigates to the user's profile to add one
    const SmsPhoneWarning = () => (
        <Alert severity="warning" sx={{ mt: 0.5, mb: 1 }} icon={false}>
            No phone number on file.{' '}
            <Typography
                component="span"
                variant="inherit"
                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => navigate(`/user/${user.username}`)}
            >
                Add one in your profile
            </Typography>
            {' '}to receive SMS alerts.
        </Alert>
    );

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <IconButton onClick={() => navigate(-1)} size="small"><ArrowBackIcon /></IconButton>
                <Typography variant="h4">Monitor Settings</Typography>
            </Box>

            {/* Prompt to add a child if none exist */}
            {children.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add a child in your profile to manage their settings.
                </Typography>
            )}

            {/* Child selector — only shown when there are multiple children */}
            {children.length > 1 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Editing settings for
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {children.map((child) => (
                            <Chip
                                key={child.id}
                                label={child.name}
                                variant={selectedChild?.id === child.id ? 'filled' : 'outlined'}
                                color={selectedChild?.id === child.id ? 'primary' : 'default'}
                                onClick={() => setSelectedChild(child)}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Save error message */}
            {saveMsg && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveMsg('')}>
                    {saveMsg}
                </Alert>
            )}

            {/* Word Detection */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">Word Detection</Typography>
                    <Switch checked={wordDetectionEnabled} onChange={(e) => setWordDetectionEnabled(e.target.checked)} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: wordDetectionEnabled ? 2 : 0 }}>
                    Alert when flagged words are detected in speech.
                </Typography>

                {/* Expanded word detection settings — shown when enabled */}
                {wordDetectionEnabled && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        {/* Word list section */}
                        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Word List</Typography>
                        <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: showWords ? 'divider' : 'warning.main', bgcolor: showWords ? 'transparent' : 'warning.50', p: 1.5, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showWords ? 2 : 0 }}>
                                <Box>
                                    {/* Hidden state — warn that the list contains explicit language */}
                                    {!showWords && (
                                        <>
                                            <Typography variant="subtitle2">⚠️ Contains explicit language</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                This list contains profanity. Toggle to view and edit.
                                            </Typography>
                                        </>
                                    )}
                                    {/* Visible state — show diff summary and reset option */}
                                    {showWords && (
                                        <>
                                            {(removedCount > 0 || addedCount > 0) && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    {removedCount > 0 && `${removedCount} default word${removedCount > 1 ? 's' : ''} removed. `}
                                                    {addedCount > 0 && `${addedCount} custom word${addedCount > 1 ? 's' : ''} added.`}
                                                </Typography>
                                            )}
                                            <Button size="small" startIcon={<RestartAltIcon />} onClick={handleReset} disabled={wordList.join() === DEFAULT_BAD_WORDS.join()}>
                                                Reset to default
                                            </Button>
                                        </>
                                    )}
                                </Box>
                                {/* Toggle word list visibility */}
                                <Button
                                    size="small"
                                    variant={showWords ? 'outlined' : 'contained'}
                                    color={showWords ? 'inherit' : 'warning'}
                                    startIcon={showWords ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    onClick={() => setShowWords((v) => !v)}
                                >
                                    {showWords ? 'Hide' : 'Show words'}
                                </Button>
                            </Box>

                            {/* Word chips — hover to reveal the delete button */}
                            {showWords && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {wordList.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">No words in list. Add some below or reset to default.</Typography>
                                    ) : (
                                        wordList.map((word) => (
                                            <Chip
                                                key={word} label={word} size="small"
                                                // Custom words are highlighted in primary color
                                                color={DEFAULT_BAD_WORDS.includes(word) ? 'default' : 'primary'}
                                                variant={DEFAULT_BAD_WORDS.includes(word) ? 'outlined' : 'filled'}
                                                // Delete icon only appears on hover
                                                onDelete={hoveredWord === word ? () => handleRemoveWord(word) : undefined}
                                                onMouseEnter={() => setHoveredWord(word)}
                                                onMouseLeave={() => setHoveredWord(null)}
                                                sx={{ transition: 'all 0.15s ease' }}
                                            />
                                        ))
                                    )}
                                </Box>
                            )}
                        </Box>

                        {/* Add word input — only visible when word list is expanded */}
                        {showWords && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                                <TextField
                                    size="small" label="Add a word" value={newWord}
                                    onChange={(e) => { setNewWord(e.target.value); setNewWordError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                                    error={!!newWordError} helperText={newWordError}
                                    sx={{ flex: 1 }}
                                />
                                <Button variant="contained" onClick={handleAddWord} startIcon={<AddIcon />}>Add</Button>
                            </Box>
                        )}

                        {/* Notification options for word detection events */}
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>When bad word is detected</Typography>
                        <FormControlLabel control={<Switch checked={wordAlertPopup} onChange={(e) => setWordAlertPopup(e.target.checked)} size="small" />} label="Show pop-up alert (word blurred)" sx={{ display: 'block', mb: 0.5 }} />
                        <FormControlLabel control={<Switch checked={wordChime} onChange={(e) => setWordChime(e.target.checked)} size="small" />} label="Play gentle chime" sx={{ display: 'block', mb: 0.5 }} />
                        <FormControlLabel control={<Switch checked={wordEmail} onChange={(e) => setWordEmail(e.target.checked)} size="small" />} label="Send email notification" sx={{ display: 'block', mb: 0.5 }} />
                        <FormControlLabel control={<Switch checked={wordSms} onChange={(e) => setWordSms(e.target.checked)} size="small" />} label="Send SMS notification" sx={{ display: 'block', mb: 0.5 }} />
                        {/* Warn if SMS is enabled but no phone number is on file */}
                        {wordSms && !userPhone && <SmsPhoneWarning />}
                        {(wordEmail || wordSms) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <TextField
                                    label="Minimum minutes between alerts"
                                    type="number"
                                    size="small"
                                    value={notifCooldown}
                                    onChange={(e) => setNotifCooldown(Math.max(0, parseInt(e.target.value) || 0))}
                                    inputProps={{ min: 0 }}
                                    helperText="If multiple incidents occur back to back, only the first alert is sent until this time has passed"
                                    sx={{ width: 240 }}
                                />
                            </Box>
                        )}
                    </Paper>
                )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Screen Time Limit */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">Screen Time Limit</Typography>
                    <Switch checked={durationEnabled} onChange={(e) => setDurationEnabled(e.target.checked)} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: durationEnabled ? 2 : 0 }}>
                    Set a daily screen time limit. When reached, the parent is notified.
                </Typography>

                {/* Expanded screen time settings — shown when enabled */}
                {durationEnabled && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        {/* Daily limit duration inputs */}
                        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Daily limit</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                            <TextField
                                size="small" type="number" label="Hours" value={durationHours}
                                onChange={(e) => setDurationHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                inputProps={{ min: 0, max: 23 }} sx={{ width: 90 }}
                            />
                            <TextField
                                size="small" type="number" label="Minutes" value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                inputProps={{ min: 0, max: 59 }} sx={{ width: 90 }}
                            />
                        </Box>

                        {/* Warning toggle — requests browser notification permission when enabled */}
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Warning</Typography>
                        <FormControlLabel
                            control={<Switch checked={warningEnabled} onChange={async (e) => {
                                const enabled = e.target.checked;
                                if (enabled && 'Notification' in window && Notification.permission === 'default') {
                                    await Notification.requestPermission();
                                }
                                setWarningEnabled(enabled);
                            }} size="small" />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    {warningEnabled ? (
                                        <>
                                            <TextField
                                                size="small" type="number" value={warningMinutes}
                                                onChange={(e) => setWarningMinutes(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
                                                inputProps={{ min: 1, max: 60 }} sx={{ width: 70 }}
                                                onClick={(e) => e.preventDefault()}
                                            />
                                            <Typography variant="body2">min before time is up</Typography>
                                        </>
                                    ) : (
                                        <Typography variant="body2">Warn before time is up</Typography>
                                    )}
                                </Box>
                            }
                            sx={{ mb: 2.5, alignItems: 'center' }}
                        />

                        {/* Notification options for when the time limit is reached */}
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>When time is up</Typography>
                        <FormControlLabel control={<Switch checked={timeUpAlert} onChange={(e) => setTimeUpAlert(e.target.checked)} size="small" />} label="Show pop-up alert" sx={{ display: 'block', mb: 0.5 }} />
                        <FormControlLabel control={<Switch checked={timeUpChime} onChange={(e) => setTimeUpChime(e.target.checked)} size="small" />} label="Play gentle chime" sx={{ display: 'block', mb: 0.5 }} />
                        <FormControlLabel control={<Switch checked={timeUpEmail} onChange={(e) => setTimeUpEmail(e.target.checked)} size="small" />} label="Send email notification" sx={{ display: 'block', mb: 0.5 }} />
                        <FormControlLabel control={<Switch checked={timeUpSms} onChange={(e) => setTimeUpSms(e.target.checked)} size="small" />} label="Send SMS notification" sx={{ display: 'block', mb: 0.5 }} />
                        {/* Warn if SMS is enabled but no phone number is on file */}
                        {timeUpSms && !userPhone && <SmsPhoneWarning />}
                        <FormControlLabel control={<Switch disabled size="small" />} label={<>Block screen <Typography component="span" variant="caption" color="text.secondary">(coming soon)</Typography></>} sx={{ display: 'block', mb: 0.5 }} />
                    </Paper>
                )}
            </Box>

        </Box>
    );
};

export default Settings;
