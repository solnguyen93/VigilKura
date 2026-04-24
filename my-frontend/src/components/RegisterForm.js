import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Alert, Divider, Typography, Select, MenuItem, InputAdornment, FormControlLabel, Checkbox, Link } from '@mui/material';
import VigilKuraApi from '../api.js';

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

const RegisterForm = () => {
    const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '', phone: '', child: '', pin: '' });
    const [countryCode, setCountryCode] = useState('+1');
    const [smsConsent, setSmsConsent] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const { register, setUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setServerError('');
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required.';
        if (!form.username.trim()) errs.username = 'Username is required.';
        if (!form.email.trim()) errs.email = 'Email is required.';
        if (!form.password) errs.password = 'Password is required.';
        else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
        if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
        else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
        if (!form.child.trim()) errs.child = 'Child name is required.';
        if (form.pin && !/^\d{4}$/.test(form.pin)) errs.pin = 'PIN must be exactly 4 digits.';
        if (form.phone.trim() && !smsConsent) errs.smsConsent = 'Please agree to receive SMS alerts.';
        if (!ageConfirmed) errs.ageConfirmed = 'You must be 18 or older to create an account.';
        if (!termsAgreed) errs.termsAgreed = 'You must read and agree to the terms before creating an account.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        try {
            await register(form.name, form.username, form.email, form.password);
            const updates = {};
            if (form.pin) updates.pin = form.pin;
            if (form.phone.trim()) updates.phone = `${countryCode}${form.phone.trim()}`;
            if (Object.keys(updates).length) {
                await VigilKuraApi.updateUser(form.username, updates);
                if (form.pin) setUser((prev) => ({ ...prev, hasPin: true }));
            }
            await VigilKuraApi.addChild(form.child.trim());
            navigate('/monitor');
        } catch (error) {
            setServerError(error.response?.data?.message || error.message || 'Registration failed.');
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {serverError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {serverError}
                </Alert>
            )}
            <TextField
                fullWidth
                margin="normal"
                label="Name *"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                autoFocus
            />
            <TextField
                fullWidth
                margin="normal"
                label="Username *"
                name="username"
                value={form.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
            />
            <TextField
                fullWidth
                margin="normal"
                label="Email *"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
            />
            <TextField
                fullWidth
                margin="normal"
                label="Password *"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
            />
            <TextField
                fullWidth
                margin="normal"
                label="Confirm Password *"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
            />
            <TextField
                fullWidth
                margin="normal"
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                placeholder="10-digit phone number"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                variant="standard"
                                disableUnderline
                                sx={{ mr: 0.5, fontSize: '0.9rem' }}
                            >
                                {COUNTRY_CODES.map((c) => (
                                    <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                                ))}
                            </Select>
                        </InputAdornment>
                    ),
                }}
            />
            {form.phone.trim() && (
                <FormControlLabel
                    sx={{ mt: 0.5, mb: 0.5 }}
                    control={<Checkbox size="small" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} />}
                    label={
                        <Typography variant="caption" color={errors.smsConsent ? 'error' : 'text.secondary'}>
                            I agree to receive SMS alerts from VigilKura. Message & data rates may apply.
                        </Typography>
                    }
                />
            )}
            <TextField
                fullWidth
                margin="normal"
                label="Child Name *"
                name="child"
                value={form.child}
                onChange={handleChange}
                error={!!errors.child}
                helperText={errors.child}
            />
            <TextField
                fullWidth
                margin="normal"
                label="Monitor PIN (optional, 4 digits)"
                name="pin"
                type="password"
                value={form.pin}
                onChange={(e) => setForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                inputProps={{ maxLength: 4, inputMode: 'numeric' }}
                error={!!errors.pin}
                helperText={errors.pin || 'Use PIN or password to exit Kid Mode'}
            />
            <FormControlLabel
                sx={{ mt: 1.5, alignItems: 'flex-start' }}
                control={
                    <Checkbox
                        size="small"
                        checked={ageConfirmed}
                        onChange={(e) => setAgeConfirmed(e.target.checked)}
                        sx={{ pt: 0.5 }}
                    />
                }
                label={
                    <Typography variant="caption" color={errors.ageConfirmed ? 'error' : 'text.secondary'}>
                        I confirm I am 18 years of age or older.
                    </Typography>
                }
            />
            {errors.ageConfirmed && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    {errors.ageConfirmed}
                </Typography>
            )}
            <FormControlLabel
                sx={{ mt: 1, alignItems: 'flex-start' }}
                control={
                    <Checkbox
                        size="small"
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        sx={{ pt: 0.5 }}
                    />
                }
                label={
                    <Typography variant="caption" color={errors.termsAgreed ? 'error' : 'text.secondary'}>
                        I have read and agree to the{' '}
                        <Link href="/legal" target="_blank" rel="noopener">Privacy & Terms</Link>
                        {', '}and confirm I am the parent or legal guardian of the child I will be monitoring.
                    </Typography>
                }
            />
            {errors.termsAgreed && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    {errors.termsAgreed}
                </Typography>
            )}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 2 }}>
                Create Account
            </Button>
        </Box>
    );
};

export default RegisterForm;
