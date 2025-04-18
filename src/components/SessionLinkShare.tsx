import React from "react";
import {Box, TextField, IconButton, InputAdornment, Stack, Paper} from "@mui/material";
import QRCode from "react-qr-code";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";

interface SessionLinkShareProps {
    size?: number;
    link: string;

    onCopy?: (link: string) => void;
    onShare?: (link: string) => void;
}

const SessionLinkShare: React.FC<SessionLinkShareProps> = ({size = 200, link, onCopy, onShare}) => {
    const handleCopy = () => {
        if (onCopy) {
            onCopy(link);
            return;
        }

        navigator.clipboard.writeText(link).catch(console.error);
    };

    const handleShare = () => {
        if (onShare) {
            onShare(link);
            return;
        }

        if (navigator.share) {
            navigator
                .share({url: link})
                .catch((err) => console.warn("Share failed:", err));
        } else {
            handleCopy();
            alert("Link copied to clipboard");
        }
    };

    return (
        <Box
            sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Stack
                direction="column"
                alignItems={"center"}
            >
                <Paper
                    sx={{
                        p: 1,
                        backgroundColor: "white",
                        borderRadius: 2,
                    }}
                    elevation={3}
                >
                    <QRCode value={link} size={size ?? 200} />
                </Paper>
                <TextField
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={link}
                    slotProps={{
                        htmlInput: {
                            readOnly: true,
                        },
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleCopy} edge="end" aria-label="copy link">
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={handleShare} edge="end" aria-label="share link">
                                        <ShareIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{ mt: 2 }}
                />
            </Stack>
        </Box>
    );
};

export default SessionLinkShare;
