import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import io from "socket.io-client";
import { Snackbar, Alert } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import ChatIcon from "@mui/icons-material/Chat";
import FolderIcon from "@mui/icons-material/Folder";
import Sidebar from "../components/videoCall/Sidebar";
import FloatingWindow from "../components/videoCall/FloatingWindow";
import VideoPanel from "../components/videoCall/VideoPanel";
import ChatPanel from "../components/videoCall/ChatPanel";
import FilePanel from "../components/videoCall/FilePanel";
import SelfVideoPiP from "../components/videoCall/SelfVideoPiP";
import server from "../utils/videoCallEnvironment";

const server_url = server;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VOICE_MS = 60 * 1000;
const SOCKET_PATH = "/video-call-socket";

var connections = {};

const peerConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

const silence = () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const dst = osc.connect(ctx.createMediaStreamDestination());
    osc.start(); ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
};
const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    return Object.assign(canvas.captureStream().getVideoTracks()[0], { enabled: false });
};

export default function MeetingRoom({ roomCode: roomCodeProp, onEndCall }) {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordTimerRef = useRef(null);
    const recordingStartRef = useRef(0);
    const cancelRecordingRef = useRef(false);

    const chatVisibleRef = useRef(false);
    const filesVisibleRef = useRef(false);
    const videoOnRef = useRef(true);
    const audioOnRef = useRef(true);

    const [videoOn, setVideoOn] = useState(true);
    const [audioOn, setAudioOn] = useState(true);
    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [videos, setVideos] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState(0);
    const [newFiles, setNewFiles] = useState(0);
    const [chatOpen, setChatOpen] = useState(true);
    const [filesOpen, setFilesOpen] = useState(false);
    const [chatMinimized, setChatMinimized] = useState(false);
    const [filesMinimized, setFilesMinimized] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSec, setRecordingSec] = useState(0);
    const [snack, setSnack] = useState({ open: false, msg: "", type: "info" });
    const [winZ, setWinZ] = useState({ chat: 100, files: 101 });
    const chatZRef = useRef(100);
    const filesZRef = useRef(101);
    const [participants, setParticipants] = useState([]);

    const username = sessionStorage.getItem("vc_username") || "Guest";
    const roomCode = roomCodeProp || window.location.pathname.split("/")[2];
    const router = useNavigate();

    useEffect(() => {
        const visible = chatOpen && !chatMinimized;
        chatVisibleRef.current = visible;
        if (visible) setNewMessages(0);
    }, [chatOpen, chatMinimized]);

    useEffect(() => {
        const visible = filesOpen && !filesMinimized;
        filesVisibleRef.current = visible;
        if (visible) setNewFiles(0);
    }, [filesOpen, filesMinimized]);

    useEffect(() => { videoOnRef.current = videoOn; }, [videoOn]);
    useEffect(() => { audioOnRef.current = audioOn; }, [audioOn]);

    const applyLocalTracks = useCallback(async () => {
        if (!localStreamRef.current) return;
        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            const pc = connections[id];
            const senders = pc.getSenders();
            localStreamRef.current.getTracks().forEach((track) => {
                const s = senders.find((x) => x.track && x.track.kind === track.kind);
                if (s) s.replaceTrack(track);
                else pc.addTrack(track, localStreamRef.current);
            });
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socketRef.current.emit("signal", id, JSON.stringify({ sdp: pc.localDescription }));
            } catch (e) { console.log("offer error", e); }
        }
    }, []);

    const toggleVideo = async () => {
        if (screen) return;
        const next = !videoOnRef.current;
        setVideoOn(next);
        try {
            if (!next) {
                localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = false));
                const hasVideo = localStreamRef.current?.getVideoTracks().length > 0;
                if (!hasVideo) {
                    const blackTrack = black();
                    for (let id in connections) {
                        if (id === socketIdRef.current) continue;
                        const pc = connections[id];
                        const s = pc.getSenders().find((x) => x.track && x.track.kind === "video");
                        if (s) await s.replaceTrack(blackTrack);
                    }
                }
            } else {
                localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = true));
                if (!localStreamRef.current?.getVideoTracks().length) {
                    try {
                        const vs = await navigator.mediaDevices.getUserMedia({ video: true });
                        localStreamRef.current.addTrack(vs.getVideoTracks()[0]);
                    } catch (e) {
                        setVideoOn(false);
                        return;
                    }
                }
            }
            await applyLocalTracks();
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        } catch (e) { console.log("toggle video error", e); }
    };

    const toggleAudio = async () => {
        const next = !audioOnRef.current;
        setAudioOn(next);
        try {
            if (!next) {
                localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
            } else {
                localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = true));
                if (!localStreamRef.current?.getAudioTracks().length) {
                    try {
                        const as = await navigator.mediaDevices.getUserMedia({ audio: true });
                        localStreamRef.current.addTrack(as.getAudioTracks()[0]);
                    } catch (e) {
                        setAudioOn(false);
                        return;
                    }
                }
            }
            await applyLocalTracks();
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        } catch (e) { console.log("toggle audio error", e); }
    };

    const toggleScreen = async () => {
        if (screen) {
            try { screenStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch (e) {}
            screenStreamRef.current = null;
            setScreen(false);
            try {
                const cam = await navigator.mediaDevices.getUserMedia({
                    video: videoOnRef.current,
                    audio: audioOnRef.current,
                });
                localStreamRef.current = cam;
                window.localStream = cam;
                setLocalStream(cam);
                await applyLocalTracks();
            } catch (e) { console.log(e); }
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: true,
            });
            screenStreamRef.current = stream;
            const screenTrack = stream.getVideoTracks()[0];
            const originalStream = localStreamRef.current;
            if (originalStream) {
                const oldVideo = originalStream.getVideoTracks()[0];
                if (oldVideo) originalStream.removeTrack(oldVideo);
                originalStream.addTrack(screenTrack);
            } else {
                localStreamRef.current = stream;
            }
            window.localStream = localStreamRef.current;
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            await applyLocalTracks();
            screenTrack.onended = () => { toggleScreen(); };
            setScreen(true);
            setSnack({ open: true, msg: "Screen sharing started.", type: "success" });
        } catch (err) {
            if (err.name !== "NotAllowedError")
                setSnack({ open: true, msg: "Could not share screen.", type: "error" });
        }
    };

    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setSnack({ open: true, msg: "Browser doesn't support camera/mic.", type: "error" });
                connectToSocket();
                return;
            }
            if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true);

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (err) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setVideoOn(false); videoOnRef.current = false;
                    setSnack({ open: true, msg: "Camera unavailable — audio only.", type: "warning" });
                } catch (e) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        setAudioOn(false); audioOnRef.current = false;
                        setSnack({ open: true, msg: "Mic unavailable — video only.", type: "warning" });
                    } catch (e2) {
                        setVideoOn(false); setAudioOn(false);
                        stream = new MediaStream([black(), silence()]);
                        setSnack({ open: true, msg: "Camera/Mic denied. You can still chat.", type: "error" });
                    }
                }
            }
            if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
            localStreamRef.current = stream;
            window.localStream = stream;
            setLocalStream(stream);
            connectToSocket();
        };
        init();
        return () => { cancelled = true; };
        // eslint-disable-next-line
    }, []);

    const connectToSocket = () => {
        socketRef.current = io.connect(server_url, {
            secure: false,
            path: SOCKET_PATH,
            transports: ["websocket", "polling"],
        });

        socketRef.current.on("signal", async (fromId, msg) => {
            const signal = JSON.parse(msg);
            if (fromId === socketIdRef.current) return;
            if (!connections[fromId]) return;
            try {
                if (signal.sdp) {
                    await connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    if (signal.sdp.type === "offer") {
                        const answer = await connections[fromId].createAnswer();
                        await connections[fromId].setLocalDescription(answer);
                        socketRef.current.emit(
                            "signal", fromId,
                            JSON.stringify({ sdp: connections[fromId].localDescription })
                        );
                    }
                }
                if (signal.ice) {
                    await connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
                }
            } catch (e) { console.log("signal error", e); }
        });

        socketRef.current.on("chat-message", (data, sender, senderId) => {
            setMessages((prev) => [...prev, { kind: "text", sender: sender || "Guest", data }]);
            if (senderId !== socketIdRef.current && !chatVisibleRef.current) {
                setNewMessages((n) => n + 1);
            }
        });

        socketRef.current.on("chat-file", (payload, sender, senderId, recipients) => {
            const isVoice =
                payload.fileType?.startsWith("audio/") &&
                payload.fileName?.startsWith("voice-");

            setMessages((prev) => [...prev, {
                kind: "file",
                sender: sender || "Guest",
                fileName: payload.fileName,
                fileType: payload.fileType,
                fileSize: payload.fileSize,
                fileData: payload.fileData,
                isVoice,
                duration: payload.duration,
                recipients: recipients || [],
            }]);

            if (senderId === socketIdRef.current) return;

            if (isVoice) {
                if (!chatVisibleRef.current) setNewMessages((n) => n + 1);
            } else {
                if (!filesVisibleRef.current) setNewFiles((n) => n + 1);
            }
        });

        socketRef.current.on("participant-name", (socketId, name) => {
            setParticipants((prev) => {
                const exists = prev.find((p) => p.socketId === socketId);
                if (exists) return prev.map((p) => (p.socketId === socketId ? { ...p, name } : p));
                return [...prev, { socketId, name }];
            });
        });

        socketRef.current.on("connect", () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit("join-call", roomCode);
            socketRef.current.emit("register-name", username);

            socketRef.current.on("user-left", (id) => {
                if (connections[id]) { try { connections[id].close(); } catch (e) {} delete connections[id]; }
                setVideos((v) => v.filter((x) => x.socketId !== id));
                setParticipants((p) => p.filter((x) => x.socketId !== id));
            });

            socketRef.current.on("user-joined", (id, clients) => {
                clients.forEach((sid) => {
                    if (connections[sid]) return;
                    const pc = new RTCPeerConnection(peerConfig);
                    connections[sid] = pc;

                    pc.onicecandidate = (e) => {
                        if (e.candidate)
                            socketRef.current.emit("signal", sid, JSON.stringify({ ice: e.candidate }));
                    };

                    pc.ontrack = (event) => {
                        const remoteStream = event.streams[0];
                        setVideos((prev) => {
                            const exists = prev.find((v) => v.socketId === sid);
                            return exists
                                ? prev.map((v) => (v.socketId === sid ? { ...v, stream: remoteStream } : v))
                                : [...prev, { socketId: sid, stream: remoteStream }];
                        });
                    };

                    const useStream = localStreamRef.current || new MediaStream([black(), silence()]);
                    if (!localStreamRef.current) {
                        localStreamRef.current = useStream;
                        window.localStream = useStream;
                        setLocalStream(useStream);
                    }
                    useStream.getTracks().forEach((t) => pc.addTrack(t, useStream));
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        const pc = connections[id2];
                        pc.createOffer()
                            .then((d) => pc.setLocalDescription(d))
                            .then(() => socketRef.current.emit("signal", id2, JSON.stringify({ sdp: pc.localDescription })))
                            .catch((e) => console.log(e));
                    }
                }
            });
        });
    };

    const sendText = (text) => {
        if (!socketRef.current?.connected) {
            setSnack({ open: true, msg: "Not connected.", type: "warning" });
            return;
        }
        socketRef.current.emit("chat-message", text, username);
    };

    const sendFile = async (file, recipients = []) => {
        if (file.size > MAX_FILE_SIZE) {
            setSnack({ open: true, msg: `Max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`, type: "error" });
            return;
        }
        if (!socketRef.current?.connected) {
            setSnack({ open: true, msg: "Not connected.", type: "warning" });
            return;
        }
        setUploadProgress(1);
        const reader = new FileReader();
        reader.onprogress = (ev) => {
            if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 90));
        };
        reader.onload = () => {
            setUploadProgress(95);
            const base64 = reader.result.split(",")[1];
            socketRef.current.emit("chat-file", {
                fileName: file.name,
                fileType: file.type || "application/octet-stream",
                fileSize: file.size,
                fileData: base64,
                recipients,
            }, username);
            setTimeout(() => setUploadProgress(0), 400);
        };
        reader.onerror = () => {
            setUploadProgress(0);
            setSnack({ open: true, msg: "Failed to read file.", type: "error" });
        };
        reader.readAsDataURL(file);
    };

    const startRecording = async () => {
        if (isRecording) return;
        if (!socketRef.current?.connected) {
            setSnack({ open: true, msg: "Not connected.", type: "warning" });
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
            const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            mediaRecorderRef.current = rec;
            recordedChunksRef.current = [];
            cancelRecordingRef.current = false;
            recordingStartRef.current = Date.now();

            rec.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
            rec.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                clearInterval(recordTimerRef.current);
                setIsRecording(false);
                setRecordingSec(0);
                if (cancelRecordingRef.current) return;
                const duration = (Date.now() - recordingStartRef.current) / 1000;
                const blob = new Blob(recordedChunksRef.current, { type: rec.mimeType || "audio/webm" });
                if (blob.size === 0) return;
                setUploadProgress(1);
                const reader = new FileReader();
                reader.onprogress = (ev) => {
                    if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 90));
                };
                reader.onload = () => {
                    setUploadProgress(95);
                    const base64 = reader.result.split(",")[1];
                    const ext = (rec.mimeType || "audio/webm").includes("ogg") ? "ogg" : "webm";
                    socketRef.current.emit("chat-file", {
                        fileName: `voice-${Date.now()}.${ext}`,
                        fileType: rec.mimeType || "audio/webm",
                        fileSize: blob.size,
                        fileData: base64,
                        duration: Math.round(duration),
                        recipients: [],
                    }, username);
                    setTimeout(() => setUploadProgress(0), 400);
                };
                reader.readAsDataURL(blob);
            };

            rec.start();
            setIsRecording(true);
            setRecordingSec(0);
            recordTimerRef.current = setInterval(() => {
                const sec = Math.floor((Date.now() - recordingStartRef.current) / 1000);
                setRecordingSec(sec);
                if (sec >= MAX_VOICE_MS / 1000) stopRecording(false);
            }, 250);
        } catch (e) {
            console.log(e);
            setSnack({ open: true, msg: "Could not access mic.", type: "error" });
        }
    };

    const stopRecording = (cancel = false) => {
        cancelRecordingRef.current = cancel;
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive")
                mediaRecorderRef.current.stop();
        } catch (e) {}
        clearInterval(recordTimerRef.current);
        setIsRecording(false);
        setRecordingSec(0);
    };

    const downloadFile = (msg) => {
        try {
            const byteChars = atob(msg.fileData);
            const bytes = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
            const blob = new Blob([bytes], { type: msg.fileType || "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = msg.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) { console.log(e); }
    };

    const endCall = () => {
        try { localStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch (e) {}
        try { screenStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch (e) {}
        try { for (let id in connections) connections[id].close(); } catch (e) {}
        try { socketRef.current?.disconnect(); } catch (e) {}
        try { stopRecording(true); } catch (e) {}
        sessionStorage.removeItem("vc_username");
        if (onEndCall) {
            onEndCall();
        } else {
            router("/");
        }
    };

    const focusChat = () => {
        chatZRef.current = Math.max(chatZRef.current, filesZRef.current) + 1;
        setWinZ((z) => ({ ...z, chat: chatZRef.current }));
    };
    const focusFiles = () => {
        filesZRef.current = Math.max(chatZRef.current, filesZRef.current) + 1;
        setWinZ((z) => ({ ...z, files: filesZRef.current }));
    };

    const filesList = messages.filter((m) => m.kind === "file" && !m.isVoice);
    const userCount = videos.length + 1;

    return (
        <div className="vc-meeting-root">
            <Sidebar
                video={videoOn}
                audio={audioOn}
                screen={screen}
                screenAvailable={screenAvailable}
                newMessages={newMessages}
                newFiles={newFiles}
                onToggleVideo={toggleVideo}
                onToggleAudio={toggleAudio}
                onToggleScreen={toggleScreen}
                onToggleChat={() => setChatOpen((c) => !c)}
                onToggleFiles={() => setFilesOpen((f) => !f)}
                chatOpen={chatOpen}
                filesOpen={filesOpen}
                onEndCall={endCall}
            />

            <FloatingWindow
                id="video"
                title="Video"
                icon={<VideocamIcon sx={{ fontSize: 16, color: "#ff9839" }} />}
                initialPos={{ x: 100, y: 80 }}
                initialSize={{ w: 480, h: 340 }}
                minWidth={320}
                minHeight={220}
                zIndex={50}
                onClose={endCall}
                accent="#ff9839"
                badge={userCount}
            >
                <VideoPanel
                    videos={videos}
                    localStream={localStream}
                    username={username}
                    videoOn={videoOn}
                    participants={participants}
                />
            </FloatingWindow>

            {chatOpen && (
                <FloatingWindow
                    id="chat"
                    title="Chat"
                    icon={<ChatIcon sx={{ fontSize: 16, color: "#8a7fff" }} />}
                    initialPos={{ x: window.innerWidth - 420, y: 80 }}
                    initialSize={{ w: 380, h: 520 }}
                    minWidth={300}
                    minHeight={300}
                    zIndex={winZ.chat}
                    onClose={() => setChatOpen(false)}
                    onFocus={focusChat}
                    accent="#8a7fff"
                    badge={newMessages}
                    badgeColor="#8a7fff"
                    onMinimizeChange={setChatMinimized}
                >
                    <ChatPanel
                        username={username}
                        messages={messages}
                        onSendText={sendText}
                        isRecording={isRecording}
                        recordingSec={recordingSec}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        uploadProgress={uploadProgress}
                    />
                </FloatingWindow>
            )}

            {filesOpen && (
                <FloatingWindow
                    id="files"
                    title="File Sharing"
                    icon={<FolderIcon sx={{ fontSize: 16, color: "#4dd0e1" }} />}
                    initialPos={{ x: 300, y: 200 }}
                    initialSize={{ w: 380, h: 500 }}
                    minWidth={320}
                    minHeight={300}
                    zIndex={winZ.files}
                    onClose={() => setFilesOpen(false)}
                    onFocus={focusFiles}
                    accent="#4dd0e1"
                    badge={newFiles}
                    badgeColor="#4dd0e1"
                    onMinimizeChange={setFilesMinimized}
                >
                    <FilePanel
                        files={filesList}
                        onDownload={downloadFile}
                        onSendFile={sendFile}
                        participants={participants}
                        mySocketId={socketIdRef.current}
                        uploadProgress={uploadProgress}
                        username={username}
                    />
                </FloatingWindow>
            )}

            {localStream && (
                <SelfVideoPiP
                    stream={localStream}
                    username={username}
                    videoOn={videoOn}
                    audioOn={audioOn}
                />
            )}

            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={snack.type} variant="filled" onClose={() => setSnack({ ...snack, open: false })}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </div>
    );
}