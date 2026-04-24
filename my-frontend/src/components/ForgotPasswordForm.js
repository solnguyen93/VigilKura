import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Alert, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VigilKuraApi from '../api.js';

const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await VigilKuraApi.forgotPassword(email);
            setSubmitted(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
                <Alert severity="success">
                    If that email is registered, a reset link has been sent. Check your inbox.
                </Alert>
                <Button fullWidth variant="text" sx={{ mt: 2 }} onClick={() => navigate('/vigilkura')}>
                    Back to Sign In
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
                <Typography variant="h6">Forgot Password</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your email and we'll send you a link to reset your password.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth margin="normal" label="Email" type="email"
                    autoFocus autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
                    Send Reset Link
                </Button>
            </Box>
        </Box>
    );
};

export default ForgotPasswordForm;
