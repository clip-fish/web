import React from "react";
import {List, ListItem, ListItemIcon, ListItemText, Typography} from "@mui/material";
import BulletIcon from "../../assets/logo_cropped_web.svg?react";

const BulletList: React.FC = () => {
    const bullets = [
        "Stop emailing or texting yourself.",
        "Connect your devices in seconds to share files, links, and messages.",
        "No installs. No signups. Just scan and send.",
    ];

    return (
        <List sx={{ width: "100%", p: 2 }}>
            {bullets.map((text, index) => (
                <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                        <BulletIcon style={{ width: "auto", height: 8 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary={<Typography variant="subtitle1">{text}</Typography>}
                    />
                </ListItem>
            ))}
        </List>
    );
};

export default BulletList;