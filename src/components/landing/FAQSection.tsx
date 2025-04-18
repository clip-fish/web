// FAQSection.tsx
import React from "react";
import {
    Container,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Link,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface FAQ {
    question: string;
    answer: string;
}

const faqs: FAQ[] = [
    {
        question: "Why won’t some messages load?",
        answer: "Ensure both devices have the page open and try refreshing both pages. " +
            "If the issue persists, please contact us at support@clip.fish.",
    },
    {
        question: "Do I need to install any software or sign up to use Clip Fish?",
        answer: "No. Clip Fish is completely web-based. Just open the site, scan the QR code, and start sharing.",
    },
    {
        question: "Is Clip Fish free to use?",
        answer: "Yes, Clip Fish is completely free with no hidden costs or subscriptions.",
    },
    {
        question: "Where is my message data stored?",
        answer: "Your actual message content is stored locally in the browser and is never uploaded to a central server. " +
            "Only session metadata is stored on our servers.",
    },
    {
        question: "What file sizes can I share?",
        answer: "Clip Fish is designed for quick sharing of files, links, and text. " +
            "While there’s no strict file size limit, very large files may be subject to browser or network constraints.",
    },
    {
        question: "What happens if my device loses connection?",
        answer:
            "If a device disconnects, simply reconnect by revisiting your session URL or scanning the QR code again.",
    },
    {
        question: "How long does a session stay active?",
        answer: "Your session remains active indefinitely until you choose to clear it or start a new session. " +
            "This way, you have full control over when your data is removed.",
    },
];

const FAQSection: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h5" gutterBottom>
                Frequently Asked Questions
            </Typography>
            {faqs.map((faq, index) => (
                <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" textAlign={"left"}>
                            {faq.answer.includes("support@clip.fish") ? (
                                <>
                                    {faq.answer.split("support@clip.fish")[0]}
                                    <Link href="mailto:support@clip.fish">
                                        support@clip.fish
                                    </Link>
                                    {faq.answer.split("support@clip.fish")[1]}
                                </>
                            ) : (
                                faq.answer
                            )}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Container>
    );
};

export default FAQSection;
