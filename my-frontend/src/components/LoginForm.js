import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Alert } from '@mui/material';
import MuiLink from '@mui/material/Link';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            navigate('/monitor');
        } catch (error) {
            setError('Invalid username or password.');
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
                fullWidth margin="normal" label="Username" name="username"
                autoComplete="username" autoFocus
                value={username} onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
                fullWidth margin="normal" label="Password" name="password"
                type="password" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                <MuiLink variant="caption" sx={{ cursor: 'pointer', color: 'text.secondary' }} onClick={() => navigate('/forgot-password')}>
                    Forgot password?
                </MuiLink>
            </Box>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }}>
                Sign In
            </Button>
        </Box>
    );
};

export default LoginForm;
