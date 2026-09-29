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
import FamilyRestroomOutlinedIcon from '@mui/icons-material/FamilyRestroomOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import RecordVoiceOverOutlinedIcon from '@mui/icons-material/RecordVoiceOverOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

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

// Highlighted note box
const Note = ({ children }) => (
    <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover' }}>
        <Typography variant="body2" color="text.secondary">{children}</Typography>
    </Paper>
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
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Last updated: September 2026
            </Typography>

            {/* Plain-language summary */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="body2">
                    <strong>In short:</strong> VigilKura is for parents and guardians to monitor <strong>their own
                    child</strong> on a computer the family owns. It turns speech into text, checks it for words you
                    flag, and alerts you. It never records audio. Transcripts are stored in your account and pass
                    through a few services that make the app work (listed below). You can delete everything at any time.
                </Typography>
            </Paper>

            <Divider sx={{ mb: 3 }} />

            {/* Terms: who it's for */}
            <Section icon={<FamilyRestroomOutlinedIcon color="primary" fontSize="small" />} title="Who VigilKura is for">
                <BulletList items={[
                    'Parents and legal guardians, 18 or older, monitoring their own minor child.',
                    'Use it on a computer you own or are responsible for — for example while your child is gaming, on a video call, doing schoolwork, or anything else online.',
                    'Don\'t use it to monitor anyone who isn\'t your child, including other adults, other people\'s children, or anyone without their knowledge where that\'s illegal.',
                    'We recommend telling your child that VigilKura is on. The live transcript is shown on screen during monitoring so they can see what\'s being captured.',
                ]} />
            </Section>

            {/* Terms: other people's voices and consent */}
            <Section icon={<RecordVoiceOverOutlinedIcon color="primary" fontSize="small" />} title="Other people's voices & consent">
                <BulletList items={[
                    'The microphone can pick up anyone nearby, and anyone on a call if their voice plays through speakers — such as friends, siblings, or other players.',
                    'Recording or transcribing a conversation can require consent. Some states, including California, Florida, Illinois, Maryland, Massachusetts, Pennsylvania, and Washington, require the consent of everyone in the conversation.',
                    'Make sure the people around your child know monitoring is on. Having your child use headphones keeps VigilKura focused on your child\'s own voice.',
                    'You are responsible for knowing and following the laws where you live.',
                ]} />
            </Section>

            <Divider sx={{ mb: 3 }} />

            {/* Privacy: what we collect */}
            <Section icon={<LockOutlinedIcon color="primary" fontSize="small" />} title="What we collect">
                <BulletList items={[
                    'Your account: name, username, email, password (hashed), and your phone number and monitor PIN (hashed) if you add them.',
                    'Your children: only the name you give each child, plus their word list, time limit, and alert settings.',
                    'Monitoring sessions: start and end times, text transcripts of what was said, and any flagged words with the sentence they appeared in.',
                ]} />
                <Note>
                    We don't sell your data or use it for advertising. We don't collect payment information,
                    location, contacts, or anything from the device beyond the microphone during a session.
                </Note>
            </Section>

            {/* Privacy: microphone and audio */}
            <Section icon={<MicOutlinedIcon color="primary" fontSize="small" />} title="Microphone & audio">
                <BulletList items={[
                    'The microphone is used only while monitoring is on, after you allow it in Chrome.',
                    'Speech is turned into text by Chrome\'s built-in speech recognition, which sends the audio to Google\'s speech service.',
                    'VigilKura never records audio, and audio never reaches VigilKura\'s servers — only the resulting text is saved.',
                ]} />
            </Section>

            {/* Privacy: third-party services */}
            <Section icon={<CloudOutlinedIcon color="primary" fontSize="small" />} title="Services that handle your data">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    VigilKura relies on these services to work. Each only receives what it needs:
                </Typography>
                <BulletList items={[
                    'Google (through Chrome) — audio during monitoring, to turn speech into text.',
                    'OpenAI — the session transcript text when a session ends, to translate it into your chosen language.',
                    'Twilio — your phone number and the alert message, only if you turn on text alerts.',
                    'Google (Gmail) — your email address and the alert or password-reset message, when an email is sent.',
                    'Render and Neon — host the app and store the database.',
                ]} />
            </Section>

            {/* Privacy: demo account */}
            <Section icon={<PersonOutlineIcon color="primary" fontSize="small" />} title="The demo account">
                <BulletList items={[
                    'The demo account is shared by everyone who tries it. Anything said or typed while using it can be seen by other visitors in its history.',
                    'Don\'t say or type anything private while using the demo. Create your own account for real use.',
                    'The demo account never sends email or text alerts, and its profile can\'t be changed.',
                ]} />
            </Section>

            {/* Privacy: data deletion */}
            <Section icon={<DeleteOutlineIcon color="primary" fontSize="small" />} title="Keeping & deleting your data">
                <Typography variant="body2" color="text.secondary">
                    Your data is kept until you delete your account. You can do that anytime from your Profile page.
                    It permanently removes everything right away — your account, children, settings, sessions,
                    transcripts, and flagged words. Nothing is kept by VigilKura.
                </Typography>
            </Section>

            <Divider sx={{ mb: 3 }} />

            {/* Terms: limitations and liability */}
            <Section icon={<ScienceOutlinedIcon color="primary" fontSize="small" />} title="Limitations">
                <BulletList items={[
                    'VigilKura is in beta — features may change, break, or be reset.',
                    'Speech recognition isn\'t perfect and currently understands English only. Words can be missed or misheard, and alerts can be wrong.',
                    'Kid Mode locks the VigilKura browser tab, not the computer. Your child can still use other apps and tabs. Reloading the tab picks monitoring back up; closing it alerts you.',
                    'VigilKura supports parental supervision — it doesn\'t replace it.',
                ]} />
            </Section>

            <Section icon={<GavelOutlinedIcon color="primary" fontSize="small" />} title="No warranty">
                <Typography variant="body2" color="text.secondary">
                    VigilKura is provided as-is, without warranties of any kind. The developer isn't responsible for
                    missed detections, false alerts, alerts that fail to send, or how the app is used.
                </Typography>
            </Section>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.disabled">
                Questions? Contact the developer. By creating an account, you agree to these terms.
            </Typography>
        </Box>
    );
};

export default Legal;
