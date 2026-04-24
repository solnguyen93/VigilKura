import React from 'react';
import { Box, Typography, Divider, Paper } from '@mui/material';
import MicOutlinedIcon from '@mui/icons-material/MicOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';

// Reusable section layout with icon and title
const Section = ({ icon, title, children }) => (
    <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {icon}
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>{title}</Typography>
        </Box>
        {children}
    </Box>
);

const Landing = () => (
    <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, p: 3 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>VigilKura</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            A simple tool to help parents stay aware of what their kids are saying during screen time.
        </Typography>

        <Section icon={<MicOutlinedIcon color="primary" fontSize="small" />} title="What it does">
            <Typography variant="body2" color="text.secondary">
                While monitoring, VigilKura listens through your device's microphone and checks for words
                from your custom list. If something is detected, you'll get an alert — via the app, email,
                or SMS. You can also set screen time limits with reminders. Everything is logged in History
                so you can review sessions later.
            </Typography>
        </Section>

        <Section icon={<StorageOutlinedIcon color="primary" fontSize="small" />} title="What we store">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                We store the minimum needed to make the app work:
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, mt: 0, mb: 0 }}>
                {[
                    'Your name, email, and phone number (if provided)',
                    'Your word list and notification settings',
                    'Session timestamps and duration',
                    'Flagged words and the sentence they appeared in',
                    'Text transcripts of monitoring sessions',
                ].map((item) => (
                    <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {item}
                    </Typography>
                ))}
            </Box>
            <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="body2" color="text.secondary">
                    <strong>No audio is ever recorded or uploaded.</strong> Speech is transcribed locally
                    on your device using your browser's built-in speech recognition. Only the resulting
                    text is stored. Notifications are sent through Gmail and Twilio (SMS).
                </Typography>
            </Paper>
        </Section>

        <Section icon={<DeleteOutlineIcon color="primary" fontSize="small" />} title="Your data, your control">
            <Typography variant="body2" color="text.secondary">
                You can delete your account at any time from your Profile page. When you do, everything
                is permanently removed — your sessions, transcripts, detections, children, and settings.
                Nothing is kept.
            </Typography>
        </Section>

        <Divider sx={{ mb: 3 }} />

        <Section icon={<GavelOutlinedIcon color="primary" fontSize="small" />} title="A few important things">
            <Box component="ul" sx={{ pl: 2.5, mt: 0, mb: 0 }}>
                {[
                    'VigilKura is intended for parents or legal guardians monitoring their own minor children on devices they control.',
                    'Monitoring someone without their knowledge may violate laws in your area. You are responsible for using this legally.',
                    'Speech recognition accuracy depends on your browser and microphone — some words may be missed or misheard.',
                    'VigilKura is not a substitute for active parental involvement.',
                ].map((item) => (
                    <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                        {item}
                    </Typography>
                ))}
            </Box>
        </Section>

        <Typography variant="caption" color="text.disabled">
            VigilKura is provided as-is. The developer is not liable for missed detections, false alerts, or how this tool is used.
        </Typography>
    </Box>
);

export default Landing;
