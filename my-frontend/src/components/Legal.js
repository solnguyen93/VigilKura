import React from 'react';
import { Box, Typography, Chip, Divider, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MicOutlinedIcon from '@mui/icons-material/MicOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

// Reusable section layout matching the Landing page style
const Section = ({ icon, title, children }) => (
    <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {icon}
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>{title}</Typography>
        </Box>
        {children}
    </Box>
);

// Reusable bullet list used throughout
const BulletList = ({ items }) => (
    <Box component="ul" sx={{ pl: 2.5, mt: 0, mb: 0 }}>
        {items.map((item) => (
            <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {item}
            </Typography>
        ))}
    </Box>
);

const Legal = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <IconButton size="small" onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
                <Typography variant="h4">Privacy & Terms</Typography>
                <Chip label="Beta" size="small" color="warning" variant="outlined" />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Last updated: April 2026 · A full legally reviewed version will replace this before public launch.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Privacy: what we collect */}
            <Section icon={<LockOutlinedIcon color="primary" fontSize="small" />} title="Your data">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    We only collect what the app needs to function:
                </Typography>
                <BulletList items={[
                    'Your name, email, and phone number (if provided)',
                    'Your word list, screen time settings, and notification preferences',
                    'Session history — timestamps, duration, flagged words, and transcripts',
                ]} />
                <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="body2" color="text.secondary">
                        We don't sell or share your data with anyone. We don't collect payment info.
                        Children are identified only by the name you give them — nothing else.
                    </Typography>
                </Paper>
            </Section>

            {/* Privacy: microphone and audio */}
            <Section icon={<MicOutlinedIcon color="primary" fontSize="small" />} title="Microphone & audio">
                <BulletList items={[
                    'The app uses your microphone during active sessions to transcribe speech in real time.',
                    'This is handled entirely by your browser — no audio is ever recorded or sent to our servers.',
                    'Only the resulting text transcript is saved.',
                    'SMS alerts are only sent if you opted in with a phone number.',
                ]} />
            </Section>

            {/* Privacy: data deletion */}
            <Section icon={<DeleteOutlineIcon color="primary" fontSize="small" />} title="Deleting your data">
                <Typography variant="body2" color="text.secondary">
                    You can delete your account anytime from your Profile page.
                    This removes everything immediately — sessions, transcripts, detections, children, and settings.
                    Nothing is kept.
                </Typography>
            </Section>

            <Divider sx={{ mb: 3 }} />

            {/* Terms: permitted use and audio laws */}
            <Section icon={<GavelOutlinedIcon color="primary" fontSize="small" />} title="Using this responsibly">
                <BulletList items={[
                    'VigilKura is for parents and legal guardians (18+) monitoring their own minor children.',
                    'You must own or have authority over the device being used.',
                    'Don\'t use this to monitor anyone who isn\'t your child.',
                    'Federally, parents can generally consent on behalf of a minor (one-party consent).',
                    'Some states like California and Illinois require all-party consent — even for parents.',
                    'It\'s your responsibility to know what\'s legal where you live.',
                ]} />
            </Section>

            {/* Terms: liability */}
            <Section icon={<ScienceOutlinedIcon color="primary" fontSize="small" />} title="Beta & limitations">
                <BulletList items={[
                    'VigilKura is in beta — things may change, break, or be reset as we build toward launch.',
                    'Speech recognition isn\'t perfect. Words may be missed or misheard.',
                    'This app supports parental supervision, it doesn\'t replace it.',
                    'VigilKura is provided as-is. We\'re not responsible for missed detections, false alerts, or how this tool is used.',
                ]} />
            </Section>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.disabled">
                Questions? Contact the developer. Full Privacy Policy and Terms of Service will replace this page before public launch.
            </Typography>
        </Box>
    );
};

export default Legal;
