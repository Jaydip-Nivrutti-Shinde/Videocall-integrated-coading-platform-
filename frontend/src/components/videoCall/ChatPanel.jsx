import React, { useEffect, useRef, useState } from "react";
import { IconButton, Tooltip, LinearProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import MicRecorderIcon from "@mui/icons-material/GraphicEq";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import VoiceBubble from "./VoiceBubble";
import styles from "../../styles/chatPanel.module.css";

export default function ChatPanel({
    username,
    messages,
    onSendText,
    isRecording,
    recordingSec,
    onStartRecording,
    onStopRecording,
    uploadProgress,
}) {
    const [text, setText] = useState("");
    const endRef = useRef(null);

    const chatItems = messages.filter(
        (m) => m.kind === "text" || (m.kind === "file" && m.isVoice)
    );

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatItems.length]);

    const send = () => {
        const t = text.trim();
        if (!t) return;
        onSendText(t);
        setText("");
    };

    const fmtRec = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div className={styles.chat}>
            <div className={styles.messages}>
                {chatItems.length === 0 ? (
                    <p className={styles.empty}>No messages yet. Say hi 👋</p>
                ) : (
                    chatItems.map((m, i) => {
                        const isMine = m.sender === username;

                        if (m.kind === "file" && m.isVoice) {
                            return (
                                <div
                                    key={i}
                                    className={`${styles.bubbleWrap} ${
                                        isMine ? styles.mine : styles.theirs
                                    }`}
                                >
                                    <div className={styles.sender}>
                                        {isMine ? "You" : m.sender}
                                    </div>
                                    <VoiceBubble msg={m} isMine={isMine} />
                                </div>
                            );
                        }

                        return (
                            <div
                                key={i}
                                className={`${styles.bubbleWrap} ${
                                    isMine ? styles.mine : styles.theirs
                                }`}
                            >
                                <div className={styles.sender}>
                                    {isMine ? "You" : m.sender}
                                </div>
                                <div
                                    className={`${styles.bubble} ${
                                        isMine ? styles.mine : ""
                                    }`}
                                >
                                    {m.data}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={endRef} />
            </div>

            {uploadProgress > 0 && (
                <div className={styles.progress}>
                    <span>Uploading… {uploadProgress}%</span>
                    <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{
                            borderRadius: "4px",
                            height: "4px",
                            background: "rgba(255,255,255,0.08)",
                            "& .MuiLinearProgress-bar": {
                                background: "linear-gradient(90deg, #ff9839, #ff5e9c)",
                            },
                        }}
                    />
                </div>
            )}

            {isRecording ? (
                <div className={styles.recordingBar}>
                    <span className={styles.recDot}></span>
                    <span>Recording {fmtRec(recordingSec)}</span>
                    <IconButton
                        onClick={() => onStopRecording(false)}
                        className={styles.sendRecBtn}
                        size="small"
                    >
                        <SendIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        onClick={() => onStopRecording(true)}
                        className={styles.cancelRecBtn}
                        size="small"
                    >
                        <StopCircleIcon fontSize="small" />
                    </IconButton>
                </div>
            ) : (
                <div className={styles.inputRow}>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())
                        }
                        placeholder="Type a message..."
                        className={styles.input}
                    />

                    {text.trim() ? (
                        <IconButton onClick={send} className={styles.sendBtn} size="small">
                            <SendIcon fontSize="small" />
                        </IconButton>
                    ) : (
                        <Tooltip title="Record voice">
                            <IconButton
                                onClick={onStartRecording}
                                className={styles.recBtn}
                                size="small"
                            >
                                <MicRecorderIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </div>
            )}
        </div>
    );
}