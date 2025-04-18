import { styled } from "@mui/material/styles";
import {Card} from "@mui/material";

interface MessageBubbleProps {
    isSender: boolean;
}

export const MessageBubble = styled(Card, {
    shouldForwardProp: (prop) => prop !== "isSender",
})<MessageBubbleProps>(({ theme, isSender }) => {
    return {
        listStyle: "none",
        padding: "12px 24px",
        marginBottom: theme.spacing(1),
        borderRadius: "16px",
        background: isSender ? theme.palette.primary.main : undefined,
        color: isSender ? "#fff" : theme.palette.text.primary,
    };
});
