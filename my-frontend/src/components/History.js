import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import VigilKuraApi from '../api.js';
import {
    Box, Typography, Paper, List, ListItem, ListItemText,
    Collapse, Chip, Divider, CircularProgress, IconButton, Tabs, Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Format seconds into a human-readable duration string (e.g. "2h 5m 30s")
const formatDuration = (secs) => {
    if (!secs) return '< 1s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

// Format an ISO timestamp into a readable date/time string
const formatDate = (ts) =>
    new Date(ts).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// Filter a sessions array down to those that started within the given time period
const filterByPeriod = (sessions, period) => {
    const d = new Date();
    if (period === 'today') {
        return sessions.filter((s) => {
            const t = new Date(s.started_at);
            return t.getFullYear() === d.getFullYear() &&
                t.getMonth() === d.getMonth() &&
                t.getDate() === d.getDate();
        });
    }
    if (period === 'week') {
        const weekAgo = new Date(d); weekAgo.setDate(d.getDate() - 7);
        return sessions.filter((s) => new Date(s.started_at) >= weekAgo);
    }
    if (period === 'month') {
        const monthAgo = new Date(d); monthAgo.setMonth(d.getMonth() - 1);
        return sessions.filter((s) => new Date(s.started_at) >= monthAgo);
    }
    return sessions;
};

// Expandable row for a single session — lazy-loads detections and transcripts on first open
// Wrap the flagged word in red within a transcript chunk
const highlightWord = (text, word) => {
    if (!word) return text;
    const escaped = word.normalize('NFC').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.normalize('NFC').split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase()
            ? <span key={i} style={{ color: '#d32f2f', fontWeight: 700 }}>{part}</span>
            : part
    );
};

const SessionRow = ({ session }) => {
    const [open, setOpen] = useState(false);
    const [detections, setDetections] = useState(null);   // null = not yet loaded
    const [transcripts, setTranscripts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const firstIncidentRef = useRef(null);
    const hasTranslation = !!session.translated_transcript;

    // Fetch detections and transcripts the first time the row is expanded
    const handleToggle = async () => {
        if (!open && detections === null) {
            setLoading(true);
            try {
                const [dets, trans] = await Promise.all([
                    VigilKuraApi.getDetections(session.id),
                    VigilKuraApi.getTranscripts(session.id),
                ]);
                setDetections(dets);
                setTranscripts(trans);
            } catch {
                setDetections([]);
                setTranscripts([]);
            } finally {
                setLoading(false);
            }
        }
        setOpen((v) => !v);
    };

    // Auto-scroll to first incident once transcript data is loaded
    useEffect(() => {
        if (open && firstIncidentRef.current) {
            setTimeout(() => firstIncidentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
    }, [open, detections]);

    return (
        <Paper variant="outlined" sx={{ mb: 1.5 }}>
            <ListItem
                button
                onClick={handleToggle}
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(session.started_at)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Duration: {formatDuration(session.duration_seconds)}
                        {!session.ended_at && ' · still active'}
                        {session.child_name && ` · ${session.child_name}`}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={`${session.detection_count} incident${session.detection_count !== 1 ? 's' : ''}`}
                        size="small"
                        color={session.detection_count > 0 ? 'error' : 'success'}
                        variant={session.detection_count > 0 ? 'filled' : 'outlined'}
                    />
                    {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </Box>
            </ListItem>

            <Collapse in={open}>
                <Divider />
                <Box sx={{ p: 2 }}>
                    {/* Translate toggle — only shown when translated transcript is available */}
                    {hasTranslation && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                            <Chip
                                size="small"
                                label={showTranslation ? 'Show original' : 'Translate'}
                                onClick={() => setShowTranslation((v) => !v)}
                                variant={showTranslation ? 'filled' : 'outlined'}
                                color="primary"
                            />
                        </Box>
                    )}

                    {loading && <CircularProgress size={20} />}

                    {/* Transcript — shown directly, bad words highlighted inline, auto-scrolls to first incident */}
                    {!loading && transcripts && (
                        <Box sx={{ maxHeight: 300, overflowY: 'auto', bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
                            {transcripts.length === 0 && (
                                <Typography variant="body2" color="text.secondary">No transcript available.</Typography>
                            )}
                            {transcripts.map((t, i) => {
                                // Find any detection that occurred within 2s of this transcript chunk
                                const matchedDetection = (detections || []).find((d) =>
                                    Math.abs(new Date(d.detected_at).getTime() - new Date(t.recorded_at).getTime()) < 2000
                                );
                                const isFirstIncident = matchedDetection && (detections || []).indexOf(matchedDetection) === 0;
                                const raw = session.translated_transcript?.[i];
                                const translatedText = typeof raw === 'string' ? raw : raw?.translatedText || raw?.text || null;
                                const displayText = showTranslation && translatedText ? translatedText : t.text;
                                return (
                                    <Box
                                        key={t.id}
                                        ref={isFirstIncident ? firstIncidentRef : null}
                                        sx={{ mb: 1 }}
                                    >
                                        <Typography variant="caption" color="text.disabled">
                                            {new Date(t.recorded_at).toLocaleTimeString()}
                                        </Typography>
                                        <Typography variant="body2">
                                            {/* Highlight flagged word in red, show plain text otherwise */}
                                            {matchedDetection && !showTranslation
                                                ? highlightWord(displayText, matchedDetection.word)
                                                : displayText}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

const PERIODS = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
];

const History = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('today');
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/vigilkura'); return; }
        VigilKuraApi.getChildren().then(setChildren).catch(() => {});
    }, [user, navigate]);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        VigilKuraApi.getSessions(user.username, selectedChild?.id || null)
            .then(setSessions)
            .catch(() => setSessions([]))
            .finally(() => setLoading(false));
    }, [user, navigate, selectedChild]);

    // Re-filter whenever sessions data or the selected period changes
    const filtered = useMemo(() => filterByPeriod(sessions || [], period), [sessions, period]);
    const totalIncidents = filtered.reduce((sum, s) => sum + s.detection_count, 0);

    return (
        <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconButton onClick={() => navigate(-1)} size="small"><ArrowBackIcon /></IconButton>
                <Typography variant="h4">History</Typography>
            </Box>

            {/* Child filter */}
            {children.length > 1 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                        label="All"
                        variant={!selectedChild ? 'filled' : 'outlined'}
                        color={!selectedChild ? 'primary' : 'default'}
                        onClick={() => setSelectedChild(null)}
                    />
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
            )}

            {/* Period tabs */}
            <Tabs value={period} onChange={(_, v) => setPeriod(v)} sx={{ mb: 2 }}>
                {PERIODS.map((p) => (
                    <Tab key={p.value} value={p.value} label={p.label} />
                ))}
            </Tabs>

            {/* Stats — only show when there are sessions in the current period */}
            {!loading && filtered.length > 0 && (
                <Paper variant="outlined" sx={{ display: 'flex', gap: 4, p: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Sessions</Typography>
                        <Typography variant="h6">{filtered.length}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Incidents</Typography>
                        <Typography variant="h6" color={totalIncidents > 0 ? 'error' : 'text.primary'}>
                            {totalIncidents}
                        </Typography>
                    </Box>
                    {filtered.length > 0 && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">Avg per session</Typography>
                            <Typography variant="h6">
                                {(totalIncidents / filtered.length).toFixed(1)}
                            </Typography>
                        </Box>
                    )}
                </Paper>
            )}

            {loading && <CircularProgress />}

            {!loading && filtered.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                    {sessions && sessions.length > 0
                        ? 'No sessions in this period.'
                        : 'No sessions yet. Start monitoring to see history here.'}
                </Typography>
            )}

            {!loading && filtered.length > 0 && (
                <List disablePadding>
                    {filtered.map((s) => (
                        <SessionRow key={s.id} session={s} />
                    ))}
                </List>
            )}
        </Box>
    );
};

export default History;
