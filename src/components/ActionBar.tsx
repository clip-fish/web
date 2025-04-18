// src/components/ActionBar.tsx
import React, { useState } from "react";
import { AppBar, Toolbar, IconButton, Button, Menu, MenuItem, useTheme, Box, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import Logo from "../assets/logo_cropped_web.svg?react";
import ShareIcon from "@mui/icons-material/Share";

interface ActionBarProps {
    isSmall?: boolean;

    onNewSession: () => void;
    onClearSession: () => void;
    onShowShare?: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ isSmall, onNewSession, onClearSession, onShowShare }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleShareSession = () => {
        if (onShowShare) onShowShare();
    };

    const handleNewSession = () => {
        onNewSession();
        handleMenuClose();
    };

    const handleClearSession = () => {
        onClearSession();
        handleMenuClose();
    };

    return (
        <AppBar position="fixed" color={"default"}>
            <Toolbar>
                <Box display="flex" alignItems="center" flexGrow={1}>
                    <Logo style={{
                        // height: 40,
                        marginRight: theme.spacing(2),
                        marginLeft: theme.spacing(2),
                        width: "auto",
                        height: "auto",
                        maxHeight: 40,
                    }} />
                    <Typography variant="h4">Clip Fish</Typography>
                </Box>
                {isSmall ? (
                    <>
                        <IconButton color="inherit" onClick={handleMenuOpen}>
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            transformOrigin={{ vertical: "top", horizontal: "right" }}
                        >
                            <MenuItem onClick={handleShareSession}>
                                <ShareIcon sx={{ marginRight: theme.spacing(1) }} />
                                Share Session
                            </MenuItem>
                            <MenuItem onClick={handleNewSession}>
                                <AddIcon sx={{ marginRight: theme.spacing(1) }} />
                                New Session
                            </MenuItem>
                            <MenuItem onClick={handleClearSession}>
                                <ClearIcon sx={{ marginRight: theme.spacing(1) }} />
                                Clear Session
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Box>
                        <Button color="inherit" startIcon={<AddIcon />} onClick={handleNewSession}>
                            New Session
                        </Button>
                        <Button color="inherit" startIcon={<ClearIcon />} onClick={handleClearSession}>
                            Clear Session
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default ActionBar;
