import React, { useState, useEffect } from 'react';
import VigilKuraApi from '../api.js';
import { useNavigate, useParams } from 'react-router-dom';
import useDataFetching from '../hooks/useDataFetching';
import { useAuth } from '../AuthContext';
import {
    Box, Typography, Button, Divider, Chip, Alert,
    TextField, IconButton, Collapse,
    Select, MenuItem, InputAdornment, FormControlLabel, Checkbox, FormControl,
} from '@mui/material';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

const LANGUAGES = [
    'English', 'Spanish', 'Vietnamese', 'Chinese (Simplified)',
    'Tagalog', 'Korean', 'Japanese', 'French', 'Portuguese', 'Hindi', 'Arabic',
];

const COUNTRY_CODES = [
    { code: '+1', label: '🇺🇸 +1' },
    { code: '+44', label: '🇬🇧 +44' },
    { code: '+61', label: '🇦🇺 +61' },
    { code: '+52', label: '🇲🇽 +52' },
    { code: '+63', label: '🇵🇭 +63' },
    { code: '+84', label: '🇻🇳 +84' },
    { code: '+82', label: '🇰🇷 +82' },
    { code: '+81', label: '🇯🇵 +81' },
    { code: '+86', label: '🇨🇳 +86' },
    { code: '+91', label: '🇮🇳 +91' },
];


// Inline editable field — shows as text, click to edit
const InlineField = ({ label, value, onSave, inputProps = {}, transform, placeholder, validate }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [hovered, setHovered] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { setDraft(value === '—' ? '' : value); }, [value]);

    const handleSave = () => {
        if (validate) {
            const err = validate(draft);
            if (err) { setError(err); return; }
        }
        setError('');
        onSave(draft);
        setEditing(false);
    };

    const handleCancel = () => {
        setDraft(value);
        setEditing(false);
        setError('');
    };

    return (
        <Box sx={{ mb: 2, minHeight: 36 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>{label}</Typography>
                {editing ? (
                    <>
                        <TextField
                            size="small"
                            value={draft}
                            placeholder={placeholder}
                            onChange={(e) => { setDraft(transform ? transform(e.target.value) : e.target.value); setError(''); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                            inputProps={inputProps}
                            error={!!error}
                            autoFocus
                            sx={{ flex: 1 }}
                        />
                        <IconButton size="small" color="primary" onClick={handleSave}><CheckIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={handleCancel}><CloseIcon fontSize="small" /></IconButton>
                    </>
                ) : (
                    <Box
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onClick={() => setEditing(true)}
                        sx={{
                            cursor: 'text',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            borderBottom: '2px dashed',
                            borderColor: hovered ? 'primary.main' : 'transparent',
                            transition: 'border-color 0.15s ease',
                            flex: 1,
                        }}
                    >
                        <Typography variant="body1">{value}</Typography>
                    </Box>
                )}
            </Box>
            {error && <Typography variant="caption" color="error" sx={{ ml: '108px', display: 'block' }}>{error}</Typography>}
        </Box>
    );
};

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: authUser, setUser, logout } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
    const [phoneEditing, setPhoneEditing] = useState(false);
    const [phoneDraft, setPhoneDraft] = useState('');
    const [phoneCountryDraft, setPhoneCountryDraft] = useState('+1');
    const [smsConsent, setSmsConsent] = useState(false);
    const [profileMsg, setProfileMsg] = useState(null);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMsg, setPasswordMsg] = useState(null);

    const [currentPin, setCurrentPin] = useState('');
    const [pinMsg, setPinMsg] = useState(null);
    const [hasPin, setHasPin] = useState(false);

    const [preferredLanguage, setPreferredLanguage] = useState('English');

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [children, setChildren] = useState([]);
    const [newChildName, setNewChildName] = useState('');
    const [childError, setChildError] = useState('');
    const [confirmDeleteChild, setConfirmDeleteChild] = useState(null);
    const [editingChild, setEditingChild] = useState(null);
    const [editChildName, setEditChildName] = useState('');

    // Fetch user profile and children in parallel on mount
    // Phone is stored as a combined string — split into country code + digits for display
    const { loading } = useDataFetching(async () => {
        const [data, kids] = await Promise.all([
            VigilKuraApi.getUserByUsername(username),
            VigilKuraApi.getChildren(),
        ]);
        setName(data.name);
        setEmail(data.email);
        const rawPhone = data.phone || '';
        const matchedCode = COUNTRY_CODES.map((c) => c.code).find((c) => rawPhone.startsWith(c));
        if (matchedCode) {
            setPhoneCountryCode(matchedCode);
            setPhone(rawPhone.slice(matchedCode.length));
        } else {
            setPhone(rawPhone);
        }
        setHasPin(data.hasPin);
        setCurrentPin(data.pin || '');
        setPreferredLanguage(data.settings?.preferredLanguage || 'English');
        setChildren(kids);
        return data;
    });

    if (loading) return <p>Loading...</p>;

    // Add a new child and append them to the local list
    const handleAddChild = async () => {
        const name = newChildName.trim();
        if (!name) { setChildError('Please enter a name.'); return; }
        try {
            const child = await VigilKuraApi.addChild(name);
            setChildren((prev) => [...prev, child]);
            setNewChildName('');
            setChildError('');
        } catch (err) {
            setChildError(err.response?.data?.message || 'Failed to add.');
        }
    };

    // Rename a child inline and update the local list
    const handleRenameChild = async (id) => {
        const name = editChildName.trim();
        if (!name) return;
        try {
            const updated = await VigilKuraApi.renameChild(id, name);
            setChildren((prev) => prev.map((c) => c.id === id ? { ...c, name: updated.name } : c));
            setEditingChild(null);
        } catch (err) {
            setChildError(err.response?.data?.message || 'Failed to rename.');
        }
    };

    // Remove a child after the inline confirmation step
    const handleRemoveChild = async (id) => {
        try {
            await VigilKuraApi.removeChild(id);
            setChildren((prev) => prev.filter((c) => c.id !== id));
            setConfirmDeleteChild(null);
        } catch (err) {
            setChildError(err.response?.data?.message || 'Failed to remove.');
        }
    };

    // Validators
    const validateName = (val) => !val.trim() ? 'Name cannot be empty.' : '';
    const validateEmail = (val) => {
        if (!val.trim()) return 'Email cannot be empty.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
        return '';
    };
    // Sync fresh token from update response — keeps localStorage JWT in sync with latest user state
    const syncToken = (updated) => {
        if (updated.token) localStorage.setItem('token', updated.token);
    };

    const handleSaveName = async (val) => {
        try {
            const updated = await VigilKuraApi.updateUser(username, { name: val.trim() });
            syncToken(updated);
            setName(updated.name);
            setUser((prev) => ({ ...prev, name: updated.name }));
            setProfileMsg({ text: 'Name updated.', error: false });
        } catch {
            setProfileMsg({ text: 'Failed to update name.', error: true });
        }
    };

    const handleSaveEmail = async (val) => {
        try {
            const updated = await VigilKuraApi.updateUser(username, { email: val.trim() });
            syncToken(updated);
            setEmail(updated.email);
            setUser((prev) => ({ ...prev, email: updated.email }));
            setProfileMsg({ text: 'Email updated.', error: false });
        } catch (err) {
            setProfileMsg({ text: err.response?.data?.message || 'Failed to update email.', error: true });
        }
    };

    // Save phone number — requires SMS consent checkbox if a number is provided
    // Combines country code + digits and passes null to clear if left blank
    const handleSavePhone = async () => {
        const digits = phoneDraft.replace(/\D/g, '');
        if (digits && !smsConsent) {
            setProfileMsg({ text: 'Please agree to receive SMS alerts before saving a phone number.', error: true });
            return;
        }
        const full = digits ? `${phoneCountryDraft}${digits}` : '';
        try {
            await VigilKuraApi.updateUser(username, { phone: full || null });
            setPhoneCountryCode(phoneCountryDraft);
            setPhone(digits);
            setPhoneEditing(false);
            setSmsConsent(false);
            setProfileMsg({ text: 'Phone updated.', error: false });
        } catch {
            setProfileMsg({ text: 'Failed to update phone.', error: true });
        }
    };

    // Change password — verifies current password first, then saves the new one
    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMsg({ text: 'All fields are required.', error: true }); return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ text: 'New passwords do not match.', error: true }); return;
        }
        if (newPassword.length < 6) {
            setPasswordMsg({ text: 'Password must be at least 6 characters.', error: true }); return;
        }
        try {
            await VigilKuraApi.login(username, currentPassword);
            await VigilKuraApi.updateUser(username, { password: newPassword });
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setShowPasswordForm(false);
            setPasswordMsg({ text: 'Password updated.', error: false });
        } catch (err) {
            const msg = err.response?.data?.message;
            setPasswordMsg({ text: msg || 'Current password is incorrect.', error: true });
        }
    };

    // Set or remove the Monitor PIN — passing an empty value removes it
    const handleSavePin = async (val) => {
        const cleaned = (val === '—' ? '' : val).trim();
        if (cleaned && !/^\d{4}$/.test(cleaned)) {
            setPinMsg({ text: 'PIN must be exactly 4 digits.', error: true }); return;
        }
        try {
            const updated = await VigilKuraApi.updateUser(username, cleaned ? { pin: cleaned } : { removePin: true });
            syncToken(updated);
            setCurrentPin(cleaned);
            setHasPin(updated.hasPin);
            setUser((prev) => ({ ...prev, hasPin: updated.hasPin }));
            setPinMsg({ text: cleaned ? 'PIN updated.' : 'PIN removed.', error: false });
        } catch (err) {
            setPinMsg({ text: err.response?.data?.message || 'Failed to update PIN.', error: true });
        }
    };

    // Save the parent's preferred translate language — used for AI summary and transcript translation
    const handleSaveLanguage = async (lang) => {
        setPreferredLanguage(lang);
        try {
            await VigilKuraApi.updateUser(username, { settings: { preferredLanguage: lang } });
        } catch {
            setProfileMsg({ text: 'Failed to save language preference.', error: true });
        }
    };

    // Permanently delete the account — logs out and redirects to home on success
    const handleDelete = async () => {
        try {
            await VigilKuraApi.deleteUser(username);
            logout();
            navigate('/');
        } catch (error) {
            setShowDeleteConfirm(false);
            setProfileMsg({ text: error.response?.data?.message || 'Failed to delete account.', error: true });
        }
    };

    return (
        <Box sx={{ maxWidth: 480, mx: 'auto', mt: 4, p: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <IconButton onClick={() => navigate(-1)} size="small"><ArrowBackIcon /></IconButton>
                <Typography variant="h5">{name}</Typography>
                <Typography variant="body2" color="text.secondary">@{username}</Typography>
                {authUser?.isAdmin && <Chip label="Admin" size="small" color="primary" />}
            </Box>

            {profileMsg && (
                <Alert severity={profileMsg.error ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => setProfileMsg(null)}>
                    {profileMsg.text}
                </Alert>
            )}

            {/* Inline editable fields */}
            <InlineField label="Name" value={name} onSave={handleSaveName} validate={validateName} />
            <InlineField label="Email" value={email} onSave={handleSaveEmail} validate={validateEmail} />
            {/* Phone Number — custom inline editor with country code */}
            <Box sx={{ mb: 2, minHeight: 36 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>Phone Number</Typography>
                    {phoneEditing ? (
                        <>
                            <TextField
                                size="small"
                                value={phoneDraft}
                                onChange={(e) => setPhoneDraft(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSavePhone(); if (e.key === 'Escape') setPhoneEditing(false); }}
                                placeholder="10-digit phone number"
                                autoFocus
                                sx={{ flex: 1 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Select
                                                value={phoneCountryDraft}
                                                onChange={(e) => setPhoneCountryDraft(e.target.value)}
                                                variant="standard"
                                                disableUnderline
                                                sx={{ fontSize: '0.85rem', mr: 0.5 }}
                                            >
                                                {COUNTRY_CODES.map((c) => (
                                                    <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <IconButton size="small" color="primary" onClick={handleSavePhone}><CheckIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => setPhoneEditing(false)}><CloseIcon fontSize="small" /></IconButton>
                        </>
                    ) : (
                        <Box
                            onClick={() => { setPhoneDraft(phone); setPhoneCountryDraft(phoneCountryCode); setPhoneEditing(true); }}
                            sx={{
                                cursor: 'text', px: 1, py: 0.5, borderRadius: 1,
                                borderBottom: '2px dashed', borderColor: 'transparent',
                                transition: 'border-color 0.15s ease', flex: 1,
                                '&:hover': { borderColor: 'primary.main' },
                            }}
                        >
                            <Typography variant="body1">
                                {phone ? `${phoneCountryCode}${phone}` : '—'}
                            </Typography>
                        </Box>
                    )}
                </Box>
                {phoneEditing && (
                    <FormControlLabel
                        sx={{ mt: 1, ml: 0 }}
                        control={<Checkbox size="small" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} />}
                        label={
                            <Typography variant="caption" color="text.secondary">
                                I agree to receive SMS alerts from VigilKura. Message & data rates may apply.
                            </Typography>
                        }
                    />
                )}
            </Box>

            {/* Translate Language — AI transcripts will be translated into this language */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>Translate Into</Typography>
                    <FormControl size="small" sx={{ flex: 1 }}>
                        <Select
                            value={preferredLanguage}
                            onChange={(e) => handleSaveLanguage(e.target.value)}
                        >
                            {LANGUAGES.map((lang) => (
                                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Typography variant="caption" color="text.disabled" sx={{ ml: '108px', display: 'block', mt: 0.5 }}>
                    Applies to new sessions only.
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Monitor PIN */}
            <InlineField
                label="Monitor PIN"
                value={hasPin ? currentPin : '—'}
                onSave={handleSavePin}
                inputProps={{ maxLength: 4, inputMode: 'numeric' }}
                transform={(v) => v.replace(/\D/g, '').slice(0, 4)}
                placeholder="Leave blank to use password instead"
            />
            {pinMsg && (
                <Alert severity={pinMsg.error ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => setPinMsg(null)}>
                    {pinMsg.text}
                </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Change Password */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Password</Typography>
                    {!showPasswordForm && (
                        <Button size="small" onClick={() => { setShowPasswordForm(true); setPasswordMsg(null); }}>Change</Button>
                    )}
                </Box>
                {passwordMsg && !showPasswordForm && (
                    <Alert severity={passwordMsg.error ? 'error' : 'success'} sx={{ mt: 1 }} onClose={() => setPasswordMsg(null)}>
                        {passwordMsg.text}
                    </Alert>
                )}
                <Collapse in={showPasswordForm}>
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSavePassword(); }} sx={{ mt: 1.5 }}>
                        {passwordMsg && (
                            <Alert severity={passwordMsg.error ? 'error' : 'success'} sx={{ mb: 1.5 }} onClose={() => setPasswordMsg(null)}>
                                {passwordMsg.text}
                            </Alert>
                        )}
                        <TextField fullWidth size="small" label="Current Password" type="password"
                            autoComplete="current-password"
                            value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} sx={{ mb: 1.5 }} />
                        <TextField fullWidth size="small" label="New Password" type="password"
                            autoComplete="new-password"
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} sx={{ mb: 1.5 }} />
                        <TextField fullWidth size="small" label="Confirm New Password" type="password"
                            autoComplete="new-password"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 1.5 }} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" size="small" type="submit">Save</Button>
                            <Button variant="outlined" size="small" type="button" onClick={() => { setShowPasswordForm(false); setPasswordMsg(null); }}>Cancel</Button>
                        </Box>
                    </Box>
                </Collapse>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Children */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Children</Typography>
                {children.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No children added yet.</Typography>
                )}
                {children.map((child, i) => (
                    <Box key={child.id}>
                        {i > 0 && <Divider />}
                        <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                            {editingChild === child.id ? (
                                <>
                                    <TextField
                                        size="small" value={editChildName} autoFocus
                                        onChange={(e) => setEditChildName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleRenameChild(child.id); if (e.key === 'Escape') setEditingChild(null); }}
                                        sx={{ flex: 1 }}
                                    />
                                    <IconButton size="small" color="primary" onClick={() => handleRenameChild(child.id)}><CheckIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => setEditingChild(null)}><CloseIcon fontSize="small" /></IconButton>
                                </>
                            ) : (
                                <>
                                    <Typography
                                        variant="body1" sx={{ flex: 1, cursor: 'text' }}
                                        onClick={() => { setEditingChild(child.id); setEditChildName(child.name); }}
                                    >
                                        {child.name}
                                    </Typography>
                                    {confirmDeleteChild === child.id ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" color="text.secondary">Remove?</Typography>
                                            <Button size="small" color="error" variant="contained" onClick={() => handleRemoveChild(child.id)}>Yes</Button>
                                            <Button size="small" onClick={() => setConfirmDeleteChild(null)}>No</Button>
                                        </Box>
                                    ) : (
                                        <IconButton size="small" onClick={() => setConfirmDeleteChild(child.id)}>
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>
                ))}
                {childError && <Typography variant="caption" color="error">{childError}</Typography>}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField
                        size="small" placeholder="Name" value={newChildName}
                        onChange={(e) => { setNewChildName(e.target.value); setChildError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChild()}
                        sx={{ flex: 1 }}
                    />
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddChild}>Add</Button>
                </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Delete account */}
            {!showDeleteConfirm ? (
                <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setShowDeleteConfirm(true)}>
                    Delete Account
                </Button>
            ) : (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>Are you sure? This cannot be undone.</Typography>
                    <Button variant="contained" color="error" size="small" onClick={handleDelete} sx={{ mr: 1 }}>Yes, delete</Button>
                    <Button variant="outlined" size="small" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                </Box>
            )}
        </Box>
    );
};

export default Profile;
