import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TextField, Button, Box, Alert, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VigilKuraApi from '../api.js';

const ResetPasswordForm = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            await VigilKuraApi.resetPassword(token, password);
            setDone(true);
        } catch (err) {
            setError(err?.response?.data?.message || 'Reset link is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
                <Alert severity="error">Invalid reset link.</Alert>
                <Button fullWidth variant="text" sx={{ mt: 2 }} onClick={() => navigate('/vigilkura')}>
                    Back to Sign In
                </Button>
            </Box>
        );
    }

    if (done) {
        return (
            <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
                <Alert severity="success">Password updated. You can now sign in.</Alert>
                <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/vigilkura')}>
                    Sign In
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconButton size="small" onClick={() => navigate('/vigilkura')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">Reset Password</Typography>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth margin="normal" label="New Password" type="password"
                    autoFocus autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <TextField
                    fullWidth margin="normal" label="Confirm Password" type="password"
                    autoComplete="new-password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
                    Set New Password
                </Button>
            </Box>
        </Box>
    );
};

export default ResetPasswordForm;
