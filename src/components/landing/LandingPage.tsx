import React from "react";
import {
    Container,
} from "@mui/material";
import HeroSection from "./HeroSection.tsx";
import UsageSteps from "./UsageSteps.tsx";
import FooterSection from "../FooterSection.tsx";

const LandingPage: React.FC = () => {
    return (
        <Container sx={{ py: 4 }}>
            <HeroSection />
            <UsageSteps />
            <FooterSection />
        </Container>
    );
};

export default LandingPage;
