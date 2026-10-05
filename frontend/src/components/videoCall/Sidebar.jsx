import React, { useRef, useState } from "react";
import { IconButton, Tooltip, Badge } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ChatIcon from "@mui/icons-material/Chat";
import FolderIcon from "@mui/icons-material/Folder";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import GridViewIcon from "@mui/icons-material/GridView";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import styles from "../../styles/sidebar.module.css";

export default function Sidebar({
    video, audio, screen, screenAvailable,
    newMessages, newFiles,
    onToggleVideo, onToggleAudio, onToggleScreen,
    onToggleChat, onToggleFiles,
    chatOpen, filesOpen,
    onEndCall,
}) {
    const [pos, setPos] = useState({
        x: 16,
        y: Math.max(80, window.innerHeight / 2 - 200),
    });
    const [collapsed, setCollapsed] = useState(false);
    const dragRef = useRef({ dragging: false, offX: 0, offY: 0 });

    const onDown = (e) => {
        dragRef.current = {
            dragging: true,
            offX: e.clientX - pos.x,
            offY: e.clientY - pos.y,
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };
    const onMove = (e) => {
        if (!dragRef.current.dragging) return;
        setPos({
            x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragRef.current.offX)),
            y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragRef.current.offY)),
        });
    };
    const onUp = () => {
        dragRef.current.dragging = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
    };

    if (collapsed) {
        return (
            <div
                className={styles.collapsedPill}
                style={{ left: pos.x, top: pos.y }}
                onMouseDown={onDown}
            >
                <IconButton
                    size="small"
                    onClick={() => setCollapsed(false)}
                    className={styles.collapsedBtn}
                >
                    <GridViewIcon fontSize="small" />
                </IconButton>
            </div>
        );
    }

    const chatBadgeSx = {
        "& .MuiBadge-badge": {
            background: "#8a7fff",
            color: "white",
            fontWeight: 800,
            fontSize: "0.65rem",
            boxShadow: "0 0 0 2px rgba(18,15,35,0.95)",
        },
    };
    const filesBadgeSx = {
        "& .MuiBadge-badge": {
            background: "#4dd0e1",
            color: "#0a0a1a",
            fontWeight: 800,
            fontSize: "0.65rem",
            boxShadow: "0 0 0 2px rgba(18,15,35,0.95)",
        },
    };

    return (
        <div className={styles.sidebar} style={{ left: pos.x, top: pos.y }}>
            <div className={styles.dragHandle} onMouseDown={onDown}>
                <GridViewIcon fontSize="small" />
            </div>

            <Tooltip title="Collapse" placement="right">
                <IconButton
                    className={styles.collapseBtn}
                    size="small"
                    onClick={() => setCollapsed(true)}
                >
                    <ExpandLessIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Video" placement="right">
                <IconButton
                    className={`${styles.iconBtn} ${video ? "" : styles.off}`}
                    onClick={onToggleVideo}
                    disabled={screen}
                >
                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
            </Tooltip>

            <Tooltip title="Audio" placement="right">
                <IconButton
                    className={`${styles.iconBtn} ${audio ? "" : styles.off}`}
                    onClick={onToggleAudio}
                >
                    {audio ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
            </Tooltip>

            {screenAvailable && (
                <Tooltip title="Screen Share" placement="right">
                    <IconButton
                        className={`${styles.iconBtn} ${screen ? styles.active : ""}`}
                        onClick={onToggleScreen}
                    >
                        {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                    </IconButton>
                </Tooltip>
            )}

            <Tooltip title="Chat" placement="right">
                <IconButton
                    className={`${styles.iconBtn} ${chatOpen ? styles.active : ""}`}
                    onClick={onToggleChat}
                >
                    <Badge
                        badgeContent={newMessages}
                        max={99}
                        invisible={newMessages === 0}
                        sx={chatBadgeSx}
                    >
                        <ChatIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Tooltip title="Files" placement="right">
                <IconButton
                    className={`${styles.iconBtn} ${filesOpen ? styles.active : ""}`}
                    onClick={onToggleFiles}
                >
                    <Badge
                        badgeContent={newFiles}
                        max={99}
                        invisible={newFiles === 0}
                        sx={filesBadgeSx}
                    >
                        <FolderIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <div className={styles.spacer} />

            <Tooltip title="End Call" placement="right">
                <IconButton className={styles.endBtn} onClick={onEndCall}>
                    <CallEndIcon />
                </IconButton>
            </Tooltip>
        </div>
    );
}