import React from "react";
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
} from "@mui/material";

interface Feature {
    title: string;
    description: string;
}

const features: Feature[] = [
    {
        title: "Fast & Secure Transfers",
        description:
            "Clip Fish establishes a direct, peer-to-peer connection between your devices using WebRTC protocols. " +
            "This ensures that your messages and files are transferred directly, without routing through any central server.",
    },
    {
        title: "End-to-End Encryption",
        description:
            "Messages are encrypted on your device and only decrypted by the receiving device.",
    },
    {
        title: "No Installations or Signups",
        description:
            "No downloads or accounts needed. Your session is created instantly in your browser, making the process fast, anonymous, and private.",
    },
    {
        title: "User-Controlled Sessions",
        description:
            "Your session stays active until you decide to clear it or start a new session, giving you full control over your shared data.",
    },
];

const HowItWorks: React.FC = () => {
    return (
        <Box sx={{ mx: "auto", p: 2 }}>
            <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
                How Does Clip Fish Work?
            </Typography>

            <Grid container spacing={2} alignItems="stretch">
                {features.map((feature, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6 }}>
                        <Card
                            elevation={1}
                            sx={{
                                borderRadius: 4,
                                textAlign: "left",
                                height: "100%",
                            }}
                        >
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    <strong>{feature.title}</strong>
                                </Typography>
                                <Typography variant="body2">
                                    {feature.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default HowItWorks;
