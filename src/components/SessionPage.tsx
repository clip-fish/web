// src/components/SessionPage.tsx
import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {
    Box,
    Container,
    Divider,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    Typography, useMediaQuery
} from "@mui/material";
import {v4 as uuidv4} from "uuid";
import {downloadFile} from "../utils/fileUtils.ts";
import {FileMessage, MessageStatusType, MessageType, TextMessage} from "../models/Message";
import {useMessages} from "../hooks/useMessages";
import {useSessionRepository} from "../contexts/SessionRepositoryContext";
import {useDevices} from "../hooks/useDevices";
import MessageComponent from "./MessageComponent";
import MessageInput from "./MessageInput";
import LandingPage from "./landing/LandingPage.tsx";
import ActionBar from "./ActionBar.tsx";
import SessionLinkShare from "./SessionLinkShare.tsx";
import SessionLinkShareOverlay from "./SessionLinkShareOverlay";
import {useTheme} from "@mui/material/styles";

const SessionPage: React.FC = () => {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("md"));  // <md only :contentReference[oaicite:2]{index=2}

    const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const sessionRepo = useSessionRepository();
    const [isInitialized, setIsInitialized] = useState(false);
    const messages = useMessages(sessionRepo);
    const devices = useDevices(sessionRepo);
    const [messageInput, setMessageInput] = useState<string>("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => {
        sessionRepo
            .initializeSession((url) => navigate(url, { replace: true }), urlSessionId)
            .then(() => setIsInitialized(true));
    }, [sessionRepo, navigate, urlSessionId]);

    if (!isInitialized) {
        // return <SessionLoading />;
    }

    useEffect(() => {
        // TODO can reload before messages is deleted
        if (isInitialized && devices.length === 0) window.location.reload();
    }, [devices]);

    const onSendMessagePressed = async () => {
        if (!sessionRepo.getSessionId()) return;

        for (const file of attachments) {
            const newFileMessage: FileMessage = {
                id: uuidv4(),
                type: MessageType.FILE,
                sender: sessionRepo.getDeviceId(),
                senderName: sessionRepo.getDeviceName(),
                sentAt: sessionRepo.createTimestamp(),
                status: { type: MessageStatusType.LOADED },
                blob: file,
                filename: file.name,
                fileSize: file.size,
            };
            try {
                await sessionRepo.sendMessage(newFileMessage);
            } catch (error) {
                console.error("Error sending file:", error);
            }
        }

        if (messageInput.trim()) {
            const newTextMessage: TextMessage = {
                id: uuidv4(),
                type: MessageType.TEXT,
                sender: sessionRepo.getDeviceId(),
                senderName: sessionRepo.getDeviceName(),
                sentAt: sessionRepo.createTimestamp(),
                text: messageInput,
                status: { type: MessageStatusType.LOADED },
            };
            try {
                await sessionRepo.sendMessage(newTextMessage);
            } catch (error) {
                console.error("Error sending message:", error);
            }
        }

        setMessageInput("");
        setAttachments([]);
    };

    const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.item(0);
        if (!file) return;
        setAttachments((prev) => [...prev, file]);
    };

    const onDownloadFileClicked = async (msg: FileMessage) => {
        try {
            try {
                const blob = await sessionRepo.getOrRetrieveFile(msg);
                if (blob) downloadFile(msg.filename, blob);
                else throw new Error("No file downloaded");
            } catch (e) {
                console.error("Error retrieving file:", e);
                throw e;
            }
        } catch (error) {
            console.error("Error downloading file:", error);
        }
    };

    const copyToClipboard = (text?: string) => {
        if (!text) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch((err) =>
                console.warn("Clipboard API failed, using fallback", err)
            );
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            alert("Copied to clipboard!");
        }
    };

    const handleNewSession = () => {
        // TODO fix needing to fully reload the page
        setIsInitialized(false);
        sessionRepo.newSession(url => window.location.href = url, uuidv4()).then(() => setIsInitialized(true));
    };

    const handleClearSession = () => {
        // TODO fix needing to fully reload the page
        setIsInitialized(false);
        sessionRepo.newSession(url => window.location.href = url, sessionRepo.getSessionId()).then(() => setIsInitialized(true));
    };

    if (sessionRepo.getIsLandingPage()) {
        return <LandingPage />;
    }

    return (
        <>
            <ActionBar
                isSmall={isSmall}
                onNewSession={handleNewSession}
                onClearSession={handleClearSession}
                onShowShare={() => setShareOpen(true)}
            />
            <Container sx={{ py: 2, mt: 8 }}>
                <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="space-evenly"
                    alignItems="center"
                    sx={{ mb: 2 }}
                >
                    <Paper sx={{ p: 2, flex: 1 }} elevation={3}>
                        <Typography variant="h6" gutterBottom>
                            Devices in Session
                        </Typography>
                        <List disablePadding>
                            {devices.map((device, index) => {
                                const isCurrent = sessionRepo.getDeviceId() === device.id;
                                return (
                                    <ListItem key={index} divider>
                                        <ListItemText
                                            primary={isCurrent ? `${device.name} (You)` : device.name}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Paper>

                    {!isSmall && (<SessionLinkShare link={sessionRepo.getSessionLink()} />)}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <MessageInput
                    messageInput={messageInput}
                    onMessageInputChange={setMessageInput}
                    onSendMessage={onSendMessagePressed}
                    onFileSelected={onFileSelected}
                    attachments={attachments}
                    onRemoveAttachment={(index) =>
                        setAttachments((prev) => prev.filter((_, i) => i !== index))
                    }
                />
                <Box component="ul" sx={{ listStyle: "none", p: 0 }}>
                    {messages.map((msg) => {
                        return (
                            <Box component="li" key={msg.id} sx={{ mb: 1 }}>
                                <MessageComponent
                                    message={msg}
                                    isSender={msg.sender === sessionRepo.getDeviceId()}
                                    onCopy={copyToClipboard}
                                    onDownload={onDownloadFileClicked}
                                />
                            </Box>
                        );
                    })}
                </Box>
            </Container>

            <SessionLinkShareOverlay
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              link={sessionRepo.getSessionLink()}
            />
        </>
    );
};

export default SessionPage;
