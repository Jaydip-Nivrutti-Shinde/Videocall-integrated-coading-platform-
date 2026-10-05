import React, { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Tooltip, IconButton,
} from "@mui/material";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LoginIcon from "@mui/icons-material/Login";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import styles from "../../styles/videoCallButton.module.css";

const genCode = () => Math.random().toString(36).substring(2, 8);

const inputSx = {
    marginTop: "12px",
    "& .MuiOutlinedInput-root": {
        color: "white", borderRadius: "12px",
        "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
        "&.Mui-focused fieldset": { borderColor: "#ff9839" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#ff9839" },
};

export default function VideoCallButton({ username, onStartMeeting }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState("menu");
    const [name, setName] = useState(username || "");
    const [joinCode, setJoinCode] = useState("");

    const resetAndClose = () => {
        setOpen(false);
        setTimeout(() => { setStep("menu"); setJoinCode(""); }, 250);
    };

    const handleCreate = () => {
        if (!name.trim()) return;
        const code = genCode();
        sessionStorage.setItem("vc_username", name.trim());
        onStartMeeting?.(code);
        resetAndClose();
    };

    const handleJoin = () => {
        if (!name.trim() || !joinCode.trim()) return;
        sessionStorage.setItem("vc_username", name.trim());
        onStartMeeting?.(joinCode.trim().toLowerCase());
        resetAndClose();
    };

    return (
        <>
            <Tooltip title="Start or join a video call" placement="left">
                <button
                    className={styles.fab}
                    onClick={() => setOpen(true)}
                    aria-label="Video call"
                >
                    <VideoCallIcon sx={{ fontSize: 30 }} />
                </button>
            </Tooltip>

            <Dialog
                open={open}
                onClose={resetAndClose}
                PaperProps={{
                    sx: {
                        background: "rgba(20, 16, 43, 0.96)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "20px",
                        color: "white",
                        minWidth: { xs: "300px", sm: "380px" },
                        padding: "8px",
                    },
                }}
            >
                {step === "menu" && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.3rem", textAlign: "center", paddingBottom: "4px" }}>
                            🎥 Video Call
                        </DialogTitle>
                        <DialogContent>
                            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "20px" }}>
                                What would you like to do?
                            </p>
                            <button onClick={() => setStep("create")} className={styles.menuOption}>
                                <div className={`${styles.menuIcon} ${styles.createIcon}`}>
                                    <AddCircleOutlineIcon sx={{ fontSize: 28 }} />
                                </div>
                                <div className={styles.menuText}>
                                    <h4>Create Meeting</h4>
                                    <p>Start a new call and invite others</p>
                                </div>
                            </button>
                            <button onClick={() => setStep("join")} className={styles.menuOption}>
                                <div className={`${styles.menuIcon} ${styles.joinIcon}`}>
                                    <LoginIcon sx={{ fontSize: 28 }} />
                                </div>
                                <div className={styles.menuText}>
                                    <h4>Join Meeting</h4>
                                    <p>Enter a code to join an existing call</p>
                                </div>
                            </button>
                        </DialogContent>
                    </>
                )}

                {step === "create" && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            <IconButton size="small" onClick={() => setStep("menu")} sx={{ color: "rgba(255,255,255,0.6)" }}>
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                            Create Meeting
                        </DialogTitle>
                        <DialogContent>
                            <TextField autoFocus fullWidth label="Your Name" value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                variant="outlined" sx={inputSx} />
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", marginTop: "10px" }}>
                                A random code will be generated for you to share.
                            </p>
                        </DialogContent>
                        <DialogActions sx={{ padding: "16px" }}>
                            <Button onClick={resetAndClose} sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}>Cancel</Button>
                            <Button variant="contained" onClick={handleCreate} disabled={!name.trim()}
                                sx={{
                                    background: "linear-gradient(135deg, #ff9839, #ff5e9c)",
                                    textTransform: "none", fontWeight: 600, padding: "10px 28px", borderRadius: "10px",
                                    "&:hover": { background: "linear-gradient(135deg, #ff8a1f, #ff4d92)" },
                                    "&.Mui-disabled": { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" },
                                }}>
                                Create
                            </Button>
                        </DialogActions>
                    </>
                )}

                {step === "join" && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            <IconButton size="small" onClick={() => setStep("menu")} sx={{ color: "rgba(255,255,255,0.6)" }}>
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                            Join Meeting
                        </DialogTitle>
                        <DialogContent>
                            <TextField autoFocus fullWidth label="Your Name" value={name}
                                onChange={(e) => setName(e.target.value)}
                                variant="outlined" sx={inputSx} />
                            <TextField fullWidth label="Meeting Code" value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                variant="outlined" sx={inputSx} />
                        </DialogContent>
                        <DialogActions sx={{ padding: "16px" }}>
                            <Button onClick={resetAndClose} sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}>Cancel</Button>
                            <Button variant="contained" onClick={handleJoin}
                                disabled={!name.trim() || !joinCode.trim()}
                                sx={{
                                    background: "linear-gradient(135deg, #ff9839, #ff5e9c)",
                                    textTransform: "none", fontWeight: 600, padding: "10px 28px", borderRadius: "10px",
                                    "&:hover": { background: "linear-gradient(135deg, #ff8a1f, #ff4d92)" },
                                    "&.Mui-disabled": { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" },
                                }}>
                                Join
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
}