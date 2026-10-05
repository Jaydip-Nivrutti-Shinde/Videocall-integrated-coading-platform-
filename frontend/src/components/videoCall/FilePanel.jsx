import React, { useRef, useState } from "react";
import { IconButton, Tooltip, LinearProgress, Checkbox } from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import MicIcon from "@mui/icons-material/Mic";
import UploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import styles from "../../styles/filePanel.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const fmt = (b) => {
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    return (b / (1024 * 1024)).toFixed(2) + " MB";
};

export default function FilePanel({
    files,
    onDownload,
    onSendFile,
    participants,
    mySocketId,
    uploadProgress,
    username,
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [showSelector, setShowSelector] = useState(false);
    const fileInputRef = useRef(null);

    const pickFile = () => fileInputRef.current?.click();

    const onFilePicked = (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        if (f.size > MAX_FILE_SIZE) {
            alert(`File too large. Max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`);
            return;
        }
        setSelectedFile(f);
        setSelectedRecipients([]);
        setShowSelector(true);
    };

    const toggleRecipient = (socketId) => {
        setSelectedRecipients((prev) =>
            prev.includes(socketId)
                ? prev.filter((id) => id !== socketId)
                : [...prev, socketId]
        );
    };

    const pickEveryone = () => setSelectedRecipients([]);

    const cancelSend = () => {
        setSelectedFile(null);
        setSelectedRecipients([]);
        setShowSelector(false);
    };

    const confirmSend = () => {
        if (!selectedFile) return;
        onSendFile(selectedFile, selectedRecipients);
        setSelectedFile(null);
        setSelectedRecipients([]);
        setShowSelector(false);
    };

    const others = (participants || []).filter((p) => p.socketId !== mySocketId);
    const everyoneSelected = selectedRecipients.length === 0;

    const recipientNamesFor = (recips) => {
        if (!recips || recips.length === 0) return "Everyone";
        return recips
            .map((sid) => {
                if (sid === mySocketId) return null;
                const p = (participants || []).find((x) => x.socketId === sid);
                return p?.name || `User ${sid.slice(0, 4)}`;
            })
            .filter(Boolean)
            .join(", ");
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.uploadBar}>
                <button className={styles.chooseBtn} onClick={pickFile}>
                    <UploadIcon sx={{ fontSize: 18 }} />
                    Choose File
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={onFilePicked}
                    style={{ display: "none" }}
                />
            </div>

            {uploadProgress > 0 && (
                <div className={styles.progressBar}>
                    <span>Sending… {uploadProgress}%</span>
                    <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{
                            borderRadius: "4px",
                            height: "4px",
                            background: "rgba(255,255,255,0.08)",
                            "& .MuiLinearProgress-bar": {
                                background: "linear-gradient(90deg, #4dd0e1, #8a7fff)",
                            },
                        }}
                    />
                </div>
            )}

            <div className={styles.list}>
                {files.length === 0 ? (
                    <div className={styles.empty}>
                        <InsertDriveFileIcon sx={{ fontSize: 44, opacity: 0.25 }} />
                        <p>No files shared yet.</p>
                        <p className={styles.hint}>Click "Choose File" to send one.</p>
                    </div>
                ) : (
                    files.map((f, i) => {
                        const isImage = f.fileType?.startsWith("image/");
                        const isVoice =
                            f.fileType?.startsWith("audio/") &&
                            f.fileName?.startsWith("voice-");
                        const isMine = f.sender === username;
                        const recipCount = f.recipients?.length || 0;

                        return (
                            <div key={i} className={styles.item}>
                                <div className={styles.icon}>
                                    {isImage ? (
                                        <ImageIcon />
                                    ) : isVoice ? (
                                        <MicIcon />
                                    ) : (
                                        <InsertDriveFileIcon />
                                    )}
                                </div>
                                <div className={styles.info}>
                                    <p className={styles.name} title={f.fileName}>
                                        {isVoice ? "Voice message" : f.fileName}
                                    </p>

                                    <div className={styles.routeRow}>
                                        <span className={styles.routeSender}>
                                            <b>{isMine ? "You" : f.sender}</b>
                                        </span>
                                        <ArrowRightAltIcon
                                            sx={{ fontSize: 16, color: "#4dd0e1", mx: 0.5 }}
                                        />
                                        <span className={styles.routeRecipients}>
                                            {recipCount === 0
                                                ? "Everyone"
                                                : recipientNamesFor(f.recipients)}
                                        </span>
                                    </div>

                                    <p className={styles.meta}>{fmt(f.fileSize)}</p>
                                </div>
                                <Tooltip title="Download">
                                    <IconButton
                                        onClick={() => onDownload(f)}
                                        className={styles.dlBtn}
                                        size="small"
                                    >
                                        <DownloadIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        );
                    })
                )}
            </div>

            {showSelector && selectedFile && (
                <div className={styles.selectorOverlay}>
                    <div className={styles.selectorCard}>
                        <div className={styles.selectorHeader}>
                            <h3>Send to</h3>
                            <IconButton size="small" onClick={cancelSend} sx={{ color: "white" }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </div>

                        <div className={styles.filePreviewRow}>
                            <InsertDriveFileIcon sx={{ fontSize: 20, color: "#4dd0e1" }} />
                            <span className={styles.previewName}>{selectedFile.name}</span>
                            <span className={styles.previewSize}>{fmt(selectedFile.size)}</span>
                        </div>

                        <div className={styles.recipientsList}>
                            <div
                                className={`${styles.recipientRow} ${
                                    everyoneSelected ? styles.selected : ""
                                }`}
                                onClick={pickEveryone}
                            >
                                <Checkbox
                                    checked={everyoneSelected}
                                    size="small"
                                    sx={{
                                        color: "rgba(255,255,255,0.4)",
                                        "&.Mui-checked": { color: "#4dd0e1" },
                                    }}
                                />
                                <div className={styles.recipientInfo}>
                                    <span className={styles.recipientName}>🌐 Everyone</span>
                                    <span className={styles.recipientSub}>
                                        All {others.length + 1} people in the call
                                    </span>
                                </div>
                            </div>

                            {others.map((p) => {
                                const checked = selectedRecipients.includes(p.socketId);
                                return (
                                    <div
                                        key={p.socketId}
                                        className={`${styles.recipientRow} ${
                                            checked ? styles.selected : ""
                                        }`}
                                        onClick={() => {
                                            if (everyoneSelected) {
                                                setSelectedRecipients([p.socketId]);
                                            } else {
                                                toggleRecipient(p.socketId);
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={checked}
                                            size="small"
                                            sx={{
                                                color: "rgba(255,255,255,0.4)",
                                                "&.Mui-checked": { color: "#4dd0e1" },
                                            }}
                                        />
                                        <div className={styles.recipientAvatar}>
                                            <PersonIcon sx={{ fontSize: 16 }} />
                                        </div>
                                        <div className={styles.recipientInfo}>
                                            <span className={styles.recipientName}>
                                                {p.name}
                                            </span>
                                            <span className={styles.recipientSub}>
                                                Tap to include
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {others.length === 0 && (
                                <p className={styles.noOthers}>
                                    No other participants yet. You're alone in the call.
                                </p>
                            )}
                        </div>

                        <div className={styles.selectorActions}>
                            <button className={styles.cancelBtn} onClick={cancelSend}>
                                Cancel
                            </button>
                            <button
                                className={styles.sendBtn}
                                onClick={confirmSend}
                                disabled={others.length > 0 && !everyoneSelected && selectedRecipients.length === 0}
                            >
                                <SendIcon sx={{ fontSize: 16 }} />
                                Send
                                {!everyoneSelected && selectedRecipients.length > 0
                                    ? ` to ${selectedRecipients.length}`
                                    : ""}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}