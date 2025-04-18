// HeroSection.tsx
import React from "react";
import {Box, Typography, Stack} from "@mui/material";
import { useSessionRepository } from "../../contexts/SessionRepositoryContext";
import Logo from "../../assets/logo_cropped_web.svg?react";
import BulletList from "./BulletList.tsx";
import SessionLinkShare from "../SessionLinkShare.tsx";

const HeroSection: React.FC = () => {
    const tagline = `Sharing Made Simple`;

    const sessionRepo = useSessionRepository();
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                mb: 4,
                p: 2,
            }}
        >
            <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Logo
                        style={{
                            marginLeft: 8,
                            width: "auto",
                            height: "auto",
                            maxHeight: 50,
                            marginBottom: 16,
                        }}
                    />
                    <Typography variant="h2" gutterBottom>
                        Clip Fish
                    </Typography>
                </Stack>
                <Typography variant="h5" sx={{ml: 4}} gutterBottom>{tagline}</Typography>
                <BulletList />
            </Box>
            {(<SessionLinkShare size={250} link={sessionRepo.getSessionLink()} />)}
        </Box>
    );
};

export default HeroSection;
