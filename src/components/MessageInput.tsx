// src/components/MessageInput.tsx
import React, { ChangeEvent, FC, useRef } from "react";
import {TextField, IconButton, Tooltip, InputAdornment, Box, Stack, Chip} from "@mui/material";
import { AttachFile, ContentPaste, Send as SendIcon } from "@mui/icons-material";

interface MessageInputProps {
    messageInput: string;
    onMessageInputChange: (newInput: string) => void;
    onSendMessage: () => void;
    onFileSelected: (event: ChangeEvent<HTMLInputElement>) => void;
    attachments: File[];
    onRemoveAttachment: (index: number) => void;
}

const MessageInput: FC<MessageInputProps> = ({
     messageInput,
     onMessageInputChange,
     onSendMessage,
     onFileSelected,
     attachments,
     onRemoveAttachment,
 }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onAttachFileClicked = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePasteFromClipboard = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            onMessageInputChange(messageInput + clipboardText);
        } catch (error) {
            console.error("Failed to read clipboard contents: ", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    return (
        <Box className="message-input-container" sx={{ display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TextField
                    variant="outlined"
                    value={messageInput}
                    onChange={(e) => onMessageInputChange(e.target.value)}
                    placeholder="Type a message..."
                    multiline
                    onKeyDown={handleKeyDown}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Paste from Clipboard">
                                        <IconButton onClick={handlePasteFromClipboard}>
                                            <ContentPaste />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Attach File">
                                        <IconButton onClick={onAttachFileClicked} sx={{ ml: 1 }}>
                                            <AttachFile />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Box sx={{ width: 16 }} />
                <Tooltip title="Send Message">
                    <IconButton onClick={onSendMessage}>
                        <SendIcon />
                    </IconButton>
                </Tooltip>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={onFileSelected}
                />
            </Box>
            {attachments.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    {attachments.map((file, index) => (
                        <Chip
                            key={index}
                            label={file.name}
                            onDelete={() => onRemoveAttachment(index)}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default MessageInput;
