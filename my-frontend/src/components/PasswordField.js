import React, { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// TextField for passwords with an eye button to show/hide what's typed
// Accepts the same props as TextField (type is managed here)
const PasswordField = (props) => {
    const [visible, setVisible] = useState(false);

    return (
        <TextField
            {...props}
            type={visible ? 'text' : 'password'}
            InputProps={{
                ...props.InputProps,
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton
                            aria-label={visible ? 'Hide password' : 'Show password'}
                            onClick={() => setVisible((v) => !v)}
                            // Keep focus in the input when toggling
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                        >
                            {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default PasswordField;
