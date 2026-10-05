import React, { useRef, useState, useEffect } from "react";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import PushPinIcon from "@mui/icons-material/PushPin";
import GridViewIcon from "@mui/icons-material/GridView";
import styles from "../../styles/videoPanel.module.css";

export default function VideoPanel({ videos, localStream, username, videoOn, participants = [] }) {
    const [pinned, setPinned] = useState(null);

    const localRef = useRef(null);
    const localGridRef = useRef(null);
    const spotlightRef = useRef(null);

    const nameOf = (socketId) => {
        if (socketId === "local") return `${username} (You)`;
        const p = participants.find((x) => x.socketId === socketId);
        return p?.name || `User ${socketId.slice(0, 4)}`;
    };

    useEffect(() => {
        if (pinned === "local" && localRef.current && localStream) {
            localRef.current.srcObject = localStream;
        }
        if (pinned === null && localGridRef.current && localStream) {
            localGridRef.current.srcObject = localStream;
        }
    }, [pinned, localStream, videoOn]);

    useEffect(() => {
        if (pinned && pinned !== "local") {
            const v = videos.find((x) => x.socketId === pinned);
            if (v && spotlightRef.current) spotlightRef.current.srcObject = v.stream;
        }
    }, [pinned, videos]);

    const isSpotlight = pinned !== null;
    const others = videos.filter((v) => v.socketId !== (pinned === "local" ? null : pinned));

    const RemoteTile = ({ v, isThumb = false }) => (
        <div
            className={`${styles.tile} ${isThumb ? styles.thumb : ""}`}
            onClick={() => !isThumb && setPinned(v.socketId)}
            title={isThumb ? "" : "Click to pin"}
        >
            <video
                ref={(ref) => {
                    if (ref && v.stream) ref.srcObject = v.stream;
                }}
                autoPlay
                playsInline
            ></video>
            <div className={styles.tileLabel}>{nameOf(v.socketId)}</div>
        </div>
    );

    return (
        <div className={styles.container}>
            {!isSpotlight ? (
                <>
                    {videos.length === 0 && !localStream ? (
                        <div className={styles.empty}>
                            <div className={styles.pulse}></div>
                            <p>Waiting for others…</p>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {localStream && (
                                <div
                                    className={styles.tile}
                                    onClick={() => setPinned("local")}
                                    title="Click to pin your video"
                                >
                                    <video
                                        ref={localGridRef}
                                        autoPlay
                                        muted
                                        playsInline
                                    ></video>
                                    <div className={styles.tileLabel}>{username} (You)</div>
                                    {!videoOn && (
                                        <div className={styles.camOff}>
                                            <VideocamOffIcon sx={{ fontSize: 36 }} />
                                        </div>
                                    )}
                                </div>
                            )}
                            {videos.map((v) => (
                                <RemoteTile key={v.socketId} v={v} />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.spotlightWrap}>
                    <div className={styles.spotlightMain} onClick={() => setPinned(null)}>
                        {pinned === "local" ? (
                            <>
                                <video ref={localRef} autoPlay muted playsInline></video>
                                {!videoOn && (
                                    <div className={styles.camOff}>
                                        <VideocamOffIcon sx={{ fontSize: 44 }} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <video ref={spotlightRef} autoPlay playsInline></video>
                        )}
                        <div className={styles.spotlightLabel}>
                            <PushPinIcon sx={{ fontSize: 14 }} />
                            {nameOf(pinned)}
                        </div>
                        <button
                            className={styles.backBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setPinned(null);
                            }}
                        >
                            <GridViewIcon fontSize="small" />
                        </button>
                    </div>

                    <div className={styles.strip}>
                        {pinned !== "local" && localStream && (
                            <div
                                className={styles.thumb}
                                onClick={() => setPinned("local")}
                            >
                                <video
                                    ref={(ref) => {
                                        if (ref && localStream) ref.srcObject = localStream;
                                    }}
                                    autoPlay
                                    muted
                                    playsInline
                                ></video>
                                <div className={styles.tileLabel}>{username} (You)</div>
                            </div>
                        )}
                        {others.map((v) => (
                            <RemoteTile key={v.socketId} v={v} isThumb />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}