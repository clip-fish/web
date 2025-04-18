// src/components/FooterSection.tsx
import React from "react";
import {Box, IconButton, Link, Tooltip, Typography} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/X";
import DonateIcon from "@mui/icons-material/MonetizationOn";

interface FooterLink {
    href: string;
    label: string;
    tooltip: string;
    icon: React.ReactNode;
}

const makeXIntent = ({
     text,
     url,
     via,
     hashtags,
 }: {
    text: string;
    url: string;
    via?: string;
    hashtags?: string;
}) => {
    const params = new URLSearchParams();
    params.set("text", text);
    params.set("url", url);
    if (via) params.set("via", via);
    if (hashtags) params.set("hashtags", hashtags);
    return `https://x.com/intent/tweet?${params.toString()}`;
};

const tweetLink = makeXIntent({
    text: "Check out Clip Fish – Sharing Made Simple",
    url: "https://clip.fish",
});

const footerLinks: FooterLink[] = [
    {
        href: "https://github.com/clip-fish/web",
        label: "GitHub",
        tooltip: "Clip Fish on GitHub",
        icon: <GitHubIcon/>,
    },
    {
        href: tweetLink,
        label: "Twitter",
        tooltip: "Tweet about Clip Fish",
        icon: <TwitterIcon/>,
    },
    {
        href: "https://github.com/sponsors/clip-fish",
        label: "Donate",
        tooltip: "Support Clip Fish development",
        icon: <DonateIcon/>,
    },
];

const FooterSection: React.FC = () => {
    return (
        <Box
            component="footer"
            sx={{
                my: 6,
                pt: 3,
                borderTop: 1,
                borderColor: "divider",
                textAlign: "center",
            }}
        >
            <Box>
                {footerLinks.map((link) => (
                    <Tooltip key={link.href} title={link.tooltip} arrow>
                        <Link
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={link.label}
                            sx={{mx: 1}}
                        >
                            <IconButton size="large">{link.icon}</IconButton>
                        </Link>
                    </Tooltip>
                ))}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{display: "block", mt: 1}}>
                &copy; {new Date().getFullYear() + " Clip Fish •  "}
                <Link href="/LICENSE" underline="hover">MIT License</Link>
            </Typography>
        </Box>
    );
};

export default FooterSection;
