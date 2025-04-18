import { Link, Box, Typography } from "@mui/material";
import React from "react";

const FooterSection: React.FC = () => {
    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="body2">
                <Link href="mailto:support@clip.fish" underline="hover">
                    Support
                </Link>{" "}
                |{" "}
                <Link href="mailto:support@clip.fish" underline="hover">
                    Contact Us
                </Link>
            </Typography>
        </Box>
    );
};

export default FooterSection;
