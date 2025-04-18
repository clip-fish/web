// src/components/SessionLoading.tsx
import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const SessionLoading: React.FC = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100vh"
        >
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
                Loading session...
            </Typography>
        </Box>
    );
};

export default SessionLoading;
