import SessionPage from "./components/SessionPage.tsx";
import { Route, Routes } from "react-router-dom";
import { SessionRepositoryProvider } from "./contexts/SessionRepositoryContext.tsx";
import { SessionRepository } from "./repositories/SessionRepository.ts";
import { MessagesRepository } from "./repositories/MessagesRepository.ts";
import { LocalStorageService } from "./services/LocalStorageService.ts";
import { MessageContentTransferService } from "./services/MessageContentTransferService.ts";
import { useMemo } from "react";
import {createTheme, CssBaseline, GlobalStyles, ThemeProvider, useMediaQuery} from "@mui/material";
import {
    makePeerConnectionService,
    makeSessionStorageService,
    makeSignalingService
} from "./servicesConfig.ts";

const sessionStorageService = makeSessionStorageService();
const localStorageService = new LocalStorageService();

const sessionRepo = new SessionRepository(
    sessionStorageService,
    localStorageService,
    (sessionId, deviceId) => {
        const signaling = makeSignalingService(sessionId, deviceId);
        const peerConn  = makePeerConnectionService(deviceId, signaling);
        const msgXfer  = new MessageContentTransferService(deviceId, peerConn);

        return new MessagesRepository(
            sessionId,
            new LocalStorageService(),
            msgXfer,
            sessionStorageService
        );
    }
);

function App() {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: prefersDarkMode ? "dark" : "light",
                    primary: { main: "#3086e3" },
                },
            }),
        [prefersDarkMode]
    );

    return (
        <>
            <ThemeProvider theme={theme}>
                <GlobalStyles
                    styles={{
                        "#root": {
                            width: "100%",
                            maxWidth: "1280px",
                            margin: "0 auto",
                            textAlign: "center",

                            fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
                            lineHeight: "1.5",
                            fontWeight: "400",
                            colorScheme: "light dark",
                            fontSynthesis: "none",
                            textRendering: "optimizeLegibility",
                            webkitFontSmoothing: "antialiased",
                            mozOsxFontSmoothing: "grayscale",
                        },
                    }}
                />
                <CssBaseline />
                <SessionRepositoryProvider repo={sessionRepo}>
                    <Routes>
                        <Route path="/" element={<SessionPage />} />
                        <Route path="/session/:sessionId" element={<SessionPage />} />
                    </Routes>
                </SessionRepositoryProvider>
            </ThemeProvider>
        </>
    );
}

export default App;
