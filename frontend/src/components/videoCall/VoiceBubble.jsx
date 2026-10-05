import React, { useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

const fmt = (s) => {
    const sec = Math.floor(s);
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
};

export default function VoiceBubble({ msg, isMine }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        const a = audioRef.current;
        if (!a) return;
        if (playing) a.pause();
        else a.play();
    };

    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        const onTime = () => { if (a.duration) setProgress((a.currentTime / a.duration) * 100); };
        const onEnd = () => { setPlaying(false); setProgress(0); };
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        a.addEventListener("timeupdate", onTime);
        a.addEventListener("ended", onEnd);
        a.addEventListener("play", onPlay);
        a.addEventListener("pause", onPause);
        return () => {
            a.removeEventListener("timeupdate", onTime);
            a.removeEventListener("ended", onEnd);
            a.removeEventListener("play", onPlay);
            a.removeEventListener("pause", onPause);
        };
    }, []);

    return (
        <div className={`voiceBubble ${isMine ? "mine" : ""}`}>
            <audio ref={audioRef} src={`data:${msg.fileType};base64,${msg.fileData}`} preload="metadata" />
            <IconButton onClick={togglePlay} className="voicePlayBtn" size="small">
                {playing ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
            </IconButton>
            <div className="voiceWave">
                {[...Array(24)].map((_, i) => {
                    const h = 6 + ((i * 37) % 20);
                    const active = (i / 24) * 100 <= progress;
                    return <span key={i} className={`voiceBar ${active ? "active" : ""}`} style={{ height: `${h}px` }} />;
                })}
            </div>
            <span className="voiceDuration">{msg.duration ? fmt(msg.duration) : "0:00"}</span>
        </div>
    );
}