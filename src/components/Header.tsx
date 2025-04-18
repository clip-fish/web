// Header.tsx
import React from "react";
import { AppBar, Toolbar, Typography, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Logo from "../assets/logo_cropped_web.svg?react";

const Header: React.FC = () => {
    return (
        <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar sx={{ justifyContent: "center" }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <RouterLink
                        to="/"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                            color: "inherit"
                        }}
                    >
                        <Logo
                            style={{
                                width: "auto",
                                height: "40px",
                            }}
                        />
                        <Typography variant="h3" sx={{ ml: 1, color: "inherit" }}>
                            Clip Fish
                        </Typography>
                    </RouterLink>
                </Stack>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
