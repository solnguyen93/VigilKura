import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Container, Typography, Button, Box, Alert, Link as MuiLink, Paper, Chip } from '@mui/material';

const VigilKura = () => {
    const { user, msg } = useAuth();
    const navigate = useNavigate();
    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {
        if (user) navigate('/monitor');
    }, [user, navigate]);

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: '20px', mt: '20px', textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4" component="h1">Welcome to VigilKura</Typography>
                    <Chip label="Beta" size="small" color="warning" variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    This is an early beta. Features may change and bugs may occur.
                </Typography>
                {msg.message && (
                    <Alert severity={msg.type} sx={{ mt: '20px' }}>{msg.message}</Alert>
                )}
                <Box mt={2}>
                    {showRegister ? (
                        <>
                            <RegisterForm />
                            <Box mt={2}>
                                Already have an account?{' '}
                                <MuiLink component="button" variant="body2" onClick={() => setShowRegister(false)}>
                                    Sign In
                                </MuiLink>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: 1 }}>
                                <Typography variant="body2">Try the demo account or create your own.</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Username:</strong> testuser</Typography>
                                <Typography variant="body2"><strong>Password:</strong> password</Typography>
                                <Typography variant="body2"><strong>PIN:</strong> 0000</Typography>
                            </Box>
                            <LoginForm />
                            <Box mt={2}>
                                <Button variant="outlined" onClick={() => setShowRegister(true)}>
                                    Create New Account
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default VigilKura;
