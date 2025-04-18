import React from "react";
import {Paper, Stack, Typography} from "@mui/material";
import Step1 from "../../assets/step1_web.svg?react";
import Step2 from "../../assets/step2_web.svg?react";
import Step3 from "../../assets/step3_web.svg?react";

const UsageSteps: React.FC = () => {
    const steps = [
        { svg: <Step1 style={{ width: "100%", height: "auto" }} />, caption: "Open Clip Fish on your PC" },
        { svg: <Step2 style={{ width: "100%", height: "auto" }} />, caption: "Scan the QR code with your phone" },
        { svg: <Step3 style={{ width: "100%", height: "auto" }} />, caption: "Instantly share text, files, and links" },
    ];

    return (
        <Paper
            sx={{
                mt: 4,
                mb: 4,
                py: 4,
                px: 6,
                borderRadius: 2,
            }}
            elevation={2}
        >
            <Typography variant="h6" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
                Getting Started
            </Typography>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={4}
                alignItems={{ xs: "center", md: "flex-start" }}
                justifyContent="space-around"
            >
                {steps.map((step, index) => (
                    <Stack
                        key={index}
                        direction="column"
                        spacing={2}
                        sx={{ width: { xs: "100%", md: 200 }, textAlign: "center" }}
                    >
                        {step.svg}
                        <Typography variant="subtitle1">{step.caption}</Typography>
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
};

export default UsageSteps;