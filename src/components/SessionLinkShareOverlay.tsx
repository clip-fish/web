// src/components/SessionLinkShareOverlay.tsx
import React from "react";
import {Modal, Box, IconButton, Paper} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SessionLinkShare from "./SessionLinkShare";

interface Props {
    open: boolean;
    onClose: () => void;
    link: string;
}

const SessionLinkShareOverlay: React.FC<Props> = ({ open, onClose, link }) => (
    <Modal open={open} onClose={onClose}>
        <Box
            sx={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                bgcolor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Box
                sx={{ position: "relative" }}
            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                    }}
                >
                    <CloseIcon fontSize={"large"}/>
                </IconButton>

                <Paper sx={{ px: 2, py: 4, borderRadius: 4 }}>
                    <SessionLinkShare link={link} />
                </Paper>
            </Box>
        </Box>
    </Modal>
);

export default SessionLinkShareOverlay;
