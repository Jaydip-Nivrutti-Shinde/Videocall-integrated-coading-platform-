import React, { useEffect, useRef, useState } from "react";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicOffIcon from "@mui/icons-material/MicOff";
import styles from "../../styles/selfPip.module.css";

export default function SelfVideoPiP({ stream, username, videoOn, audioOn }) {
    const [pos, setPos] = useState({ x: window.innerWidth - 240, y: 20 });
    const [size, setSize] = useState({ w: 220, h: 150 });
    const videoRef = useRef(null);
    const dragRef = useRef({ dragging: false, offX: 0, offY: 0 });
    const resizeRef = useRef({ resizing: false, startX: 0, startY: 0, startW: 0, startH: 0 });

    useEffect(() => {
        if (videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [stream]);

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

    const onResizeDown = (e) => {
        e.stopPropagation();
        resizeRef.current = {
            resizing: true,
            startX: e.clientX,
            startY: e.clientY,
            startW: size.w,
            startH: size.h,
        };
        document.addEventListener("mousemove", onResizeMove);
        document.addEventListener("mouseup", onResizeUp);
    };
    const onResizeMove = (e) => {
        if (!resizeRef.current.resizing) return;
        const { startX, startY, startW, startH } = resizeRef.current;
        const w = Math.max(140, startW + (e.clientX - startX));
        const h = Math.max(90, startH + (e.clientY - startY));
        setSize({ w, h });
    };
    const onResizeUp = () => {
        resizeRef.current.resizing = false;
        document.removeEventListener("mousemove", onResizeMove);
        document.removeEventListener("mouseup", onResizeUp);
    };

    return (
        <div
            className={styles.pip}
            style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
            onMouseDown={onDown}
        >
            <video ref={videoRef} autoPlay muted playsInline></video>
            {!videoOn && (
                <div className={styles.camOff}>
                    <VideocamOffIcon sx={{ fontSize: 32 }} />
                </div>
            )}
            <div className={styles.label}>{username}</div>
            {!audioOn && (
                <div className={styles.muteBadge}>
                    <MicOffIcon sx={{ fontSize: 12 }} />
                </div>
            )}
            <div className={styles.resizeHandle} onMouseDown={onResizeDown}>
                <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M11 1L1 11M11 5L5 11M11 11L11 11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" />
                </svg>
            </div>
        </div>
    );
}