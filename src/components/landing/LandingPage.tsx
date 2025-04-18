import React from "react";
import {
    Container, Divider, Link, Typography,
} from "@mui/material";
import FooterSection from "../FooterSection.tsx";
import HeroSection from "./HeroSection.tsx";
import UsageSteps from "./UsageSteps.tsx";
import HowItWorks from "./HowItWorks.tsx";
import FAQSection from "./FAQSection.tsx";

const LandingPage: React.FC = () => {
    return (
        <Container sx={{ py: 4 }}>
            <HeroSection />
            <UsageSteps />
            <HowItWorks />
            <FAQSection />
            <Divider sx={{ my: 3 }} />
            <Typography variant="body1">
                For any other inquiries or further assistance, please email us at{" "}
                <Link href="mailto:support@clip.fish">support@clip.fish</Link>.
            </Typography>
            <FooterSection />
        </Container>
    );
};

export default LandingPage;
