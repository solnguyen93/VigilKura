import React from 'react';
import { Box, Typography, Divider, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicOutlinedIcon from '@mui/icons-material/MicOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';

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

const Landing = () => {
    const navigate = useNavigate();
    return (
    <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <IconButton size="small" onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
            <Typography variant="h4">VigilKura</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            A web app that helps parents stay aware of what their kids are saying during screen time.
        </Typography>

        <Section icon={<MicOutlinedIcon color="primary" fontSize="small" />} title="What it does">
            <Typography variant="body2" color="text.secondary">
                Start monitoring in a Chrome tab on the computer your kid is using. VigilKura listens through
                the microphone, shows a live transcript, and checks what's said against a word list you set
                for each child. If a flagged word comes up, you get a text or email. You can set a time limit
                for each session, and you're alerted if the tab is closed early. Every session is saved as a
                transcript in History so you can look back at what was said.
            </Typography>
        </Section>

        <Section icon={<TipsAndUpdatesOutlinedIcon color="primary" fontSize="small" />} title="Tips for best results">
            <Box component="ul" sx={{ pl: 2.5, mt: 0, mb: 0 }}>
                {[
                    'Use Chrome — speech recognition only works there.',
                    'To focus on your own child, have them use headphones or a headset. The mic then mainly hears them, while voices and sounds from a call, video, or game stay in the headphones.',
                    'Without headphones, the mic can also pick up people nearby or on a call, and audio from speakers — which may be flagged too.',
                    'Leave the VigilKura tab open. Closing it ends the session and alerts you.',
                ].map((item) => (
                    <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {item}
                    </Typography>
                ))}
            </Box>
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
                    <strong>VigilKura never records or stores audio.</strong> Speech is transcribed by
                    Chrome's built-in speech recognition, which sends the audio to Google's speech service
                    to turn it into text. Only that text reaches VigilKura and is stored. At the end of a
                    session, the transcript is sent to OpenAI to translate it into your chosen language.
                    Notifications are sent through Brevo (email) and Twilio (SMS). See Privacy & Terms for details.
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
                    'Speech recognition accuracy depends on your browser and microphone — some words may be missed or misheard. English only for now.',
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
};

export default Landing;
