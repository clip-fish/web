import React from "react";
import {Box, CircularProgress, IconButton, Paper, Typography} from "@mui/material";
import {ContentCopy, FileDownload, Refresh} from "@mui/icons-material";
import {FileMessage, Message, MessageStatusType, MessageType, TextMessage} from "../models/Message";
import {MessageBubble} from "./MessageBubble";
import {useTheme} from "@mui/material/styles";

interface MessageComponentProps {
    message: Message;
    isSender: boolean;
    onCopy?: (text?: string) => void;
    onDownload?: (msg: FileMessage) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
   message,
   isSender,
   onCopy,
   onDownload,
}) => {
    const theme = useTheme();

    const header = (
        <Box
            sx={{
                fontSize: "0.85em",
                color: theme.palette.text.secondary,
                mt: 1,
                textAlign: isSender ? "right" : "left",
            }}
        >
            {isSender
                ? `Sent at ${message.sentAt.toDate().toLocaleTimeString()}`
                : `From ${message.senderName} at ${message.sentAt.toDate().toLocaleTimeString()}`}
        </Box>
    );

    const renderCopyButton = (textMsg: TextMessage, onCopy: (text?: string) => void) => (
        <Paper
            elevation={8}
            sx={{
                display: "inline-block",
                borderRadius: "50%",
                mx: 0.3,
                flexShrink: 0,
            }}
        >
            <IconButton
                onClick={() => onCopy(textMsg.text)}
                sx={{
                    bgcolor: isSender ? 'primary.main' : undefined,
                    color: isSender ? 'primary.contrastText' : 'text.primary',
                    p: 1,
                    '&:hover': {
                        bgcolor: isSender ? 'primary.dark' : 'action.hover',
                    },
                }}
            >
                <ContentCopy />
            </IconButton>
        </Paper>
    );

    const renderDownloadButton = (isSender: boolean, fileMsg: FileMessage, onDownload: (msg: FileMessage) => void) => (
        <Paper
            elevation={8}
            sx={{
                display: "inline-block",
                borderRadius: "50%",
                mx: 0.3,
                flexShrink: 0,
            }}
        >
            <IconButton
                disabled={fileMsg.status.type === MessageStatusType.LOADING}
                onClick={() => onDownload(fileMsg)}
                sx={{
                    //TODO
                    bgcolor: fileMsg.status.type === MessageStatusType.ERROR ? ('error.dark') : (isSender ? 'primary.main' : undefined),
                    color: isSender ? 'primary.contrastText' : 'text.primary',
                    p: 1,
                    '&:hover': {
                        bgcolor: isSender ? 'primary.dark' : 'action.hover',
                    },
                }}
            >
                {fileMsg.status.type === MessageStatusType.ERROR ? <Refresh/> : <FileDownload />}
            </IconButton>
        </Paper>
    );

    // TODO show x on hover???
    const renderProgressIndicator = (progressValue: number) => (
        <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
            <CircularProgress
                variant={progressValue >= 0 ? "determinate" : "indeterminate"}
                value={progressValue}
                size={40}
                thickness={4}
            />
            {progressValue >= 0 && (
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography
                        variant="caption"
                        component="div"
                        color="text.secondary"
                    >{`${Math.round(progressValue)}%`}</Typography>
                </Box>
            )}
        </Box>
    );

    let content;
    if (message.type === MessageType.TEXT) {
        const textMsg = message as TextMessage;
        content = (
            <>
                {isSender && onCopy && renderCopyButton(textMsg, onCopy)}
                <MessageBubble
                    isSender={isSender}
                    elevation={8}
                    sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "pre-wrap",
                        textAlign: "left",
                        maxWidth: "100%",
                    }}
                >
                    {textMsg.text ??
                        (textMsg.status.type === MessageStatusType.LOADING
                            ? (textMsg.status.progress > -1
                                ? `${textMsg.status.progress}% loaded`
                                : "Loading...")
                            : "Error loading message")}
                </MessageBubble>
                {!isSender && onCopy && renderCopyButton(textMsg, onCopy)}
            </>
        );
    } else if (message.type === MessageType.FILE) {
        const fileMsg = message as FileMessage;
        const isLoading = fileMsg.status.type === MessageStatusType.LOADING;
        const progressValue = fileMsg.status.type === MessageStatusType.LOADING ? fileMsg.status.progress : -1;

        content = (
            <>
                {!isLoading && isSender && onDownload && (renderDownloadButton(isSender, fileMsg, onDownload))}
                {isLoading && isSender && renderProgressIndicator(progressValue)}
                <MessageBubble
                    isSender={isSender}
                    elevation={8}
                    sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "pre-wrap",
                        textAlign: "left",
                        maxWidth: "100%",
                    }}
                >
                    {`${fileMsg.filename} (${(fileMsg.fileSize / 1000000)?.toFixed(2)} MB)`}
                </MessageBubble>
                {!isLoading && !isSender && onDownload && (renderDownloadButton(isSender, fileMsg, onDownload))}
                {isLoading && !isSender && renderProgressIndicator(progressValue)}
            </>
        );
    } else {
        content = <Box>Unsupported message type</Box>;
    }

    return (
        <Box
            sx={{
                p: theme.spacing(1),
                my: theme.spacing(0.5),
                display: "flex",
                flexDirection: "column",
                alignItems: isSender ? "flex-end" : "flex-start",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    maxWidth: "80%",
                    justifyContent: isSender ? "flex-end" : "flex-start",
                }}
            >
                {content}
            </Box>
            {header}
        </Box>
    );
};

export default MessageComponent;
