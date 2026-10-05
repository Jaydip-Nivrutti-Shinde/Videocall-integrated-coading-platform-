import React, { useRef, useState, useEffect } from "react";
import { IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MinimizeIcon from "@mui/icons-material/Remove";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import styles from "../../styles/floatingWindow.module.css";

export default function FloatingWindow({
    id,
    title,
    icon,
    children,
    initialPos = { x: 200, y: 120 },
    initialSize = { w: 400, h: 480 },
    minWidth = 280,
    minHeight = 240,
    zIndex = 100,
    onClose,
    onFocus,
    accent = "#ff9839",
    badge = 0,
    badgeColor,
    onMinimizeChange,
}) {
    const [pos, setPos] = useState(initialPos);
    const [size, setSize] = useState(initialSize);
    const [minimized, setMinimized] = useState(false);
    const [maximized, setMaximized] = useState(false);

    const dragRef = useRef({ dragging: false, offX: 0, offY: 0 });
    const resizeRef = useRef({ resizing: false, startX: 0, startY: 0, startW: 0, startH: 0 });
    const miniDragRef = useRef({ dragging: false, offX: 0, offY: 0, moved: false });

    useEffect(() => {
        onMinimizeChange?.(minimized);
        // eslint-disable-next-line
    }, [minimized]);

    const onHeaderDown = (e) => {
        if (maximized) return;
        if (e.target.closest("button")) return;
        dragRef.current = {
            dragging: true,
            offX: e.clientX - pos.x,
            offY: e.clientY - pos.y,
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        onFocus?.();
    };

    const onMove = (e) => {
        if (!dragRef.current.dragging) return;
        const nx = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragRef.current.offX));
        const ny = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragRef.current.offY));
        setPos({ x: nx, y: ny });
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
        const w = Math.max(minWidth, startW + (e.clientX - startX));
        const h = Math.max(minHeight, startH + (e.clientY - startY));
        setSize({ w, h });
    };

    const onResizeUp = () => {
        resizeRef.current.resizing = false;
        document.removeEventListener("mousemove", onResizeMove);
        document.removeEventListener("mouseup", onResizeUp);
    };

    const onMiniDown = (e) => {
        miniDragRef.current = {
            dragging: true,
            offX: e.clientX - pos.x,
            offY: e.clientY - pos.y,
            moved: false,
        };
        document.addEventListener("mousemove", onMiniMove);
        document.addEventListener("mouseup", onMiniUp);
    };

    const onMiniMove = (e) => {
        if (!miniDragRef.current.dragging) return;
        const dx = e.clientX - (pos.x + miniDragRef.current.offX);
        const dy = e.clientY - (pos.y + miniDragRef.current.offY);
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) miniDragRef.current.moved = true;

        setPos({
            x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - miniDragRef.current.offX)),
            y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - miniDragRef.current.offY)),
        });
    };

    const onMiniUp = () => {
        const wasDragged = miniDragRef.current.moved;
        miniDragRef.current.dragging = false;
        document.removeEventListener("mousemove", onMiniMove);
        document.removeEventListener("mouseup", onMiniUp);
        if (!wasDragged) {
            setMinimized(false);
            onFocus?.();
        }
    };

    const badgeBg = badgeColor || accent;

    if (minimized) {
        return (
            <div
                className={styles.miniBtnWrapper}
                style={{ left: pos.x, top: pos.y, zIndex }}
                onMouseDown={onMiniDown}
                title={`${title} — tap to restore, drag to move`}
            >
                {badge > 0 && (
                    <div className={styles.miniBadge} style={{ background: badgeBg }}>
                        {badge > 99 ? "99+" : badge}
                    </div>
                )}
                <div className={styles.miniBtn} style={{ borderColor: accent }}>
                    <div className={styles.miniIcon} style={{ color: accent }}>
                        {icon}
                    </div>
                    <span className={styles.miniLabel}>{title}</span>
                </div>
            </div>
        );
    }

    const style = maximized
        ? {
              left: "90px",
              top: "20px",
              width: "calc(100vw - 120px)",
              height: "calc(100vh - 60px)",
              zIndex: zIndex + 50,
              borderColor: accent,
          }
        : {
              left: pos.x,
              top: pos.y,
              width: size.w,
              height: size.h,
              zIndex,
              borderColor: accent,
          };

    return (
        <div
            className={styles.window}
            style={style}
            onMouseDown={onFocus}
            data-window-id={id}
        >
            <div className={styles.header} onMouseDown={onHeaderDown}>
                <div className={styles.title}>
                    {icon}
                    <span>{title}</span>
                    {badge > 0 && (
                        <span
                            className={styles.headerBadge}
                            style={{ background: badgeBg }}
                        >
                            {badge > 99 ? "99+" : badge}
                        </span>
                    )}
                </div>
                <div className={styles.actions}>
                    <Tooltip title="Minimize">
                        <IconButton size="small" onClick={() => setMinimized(true)}>
                            <MinimizeIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={maximized ? "Restore" : "Maximize"}>
                        <IconButton size="small" onClick={() => setMaximized((m) => !m)}>
                            <CropSquareIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {onClose && (
                        <Tooltip title="Close">
                            <IconButton size="small" onClick={onClose} sx={{ color: "#ff5757" }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </div>
            </div>

            <div className={styles.body}>
                {children}
                <div className={styles.resizeHandle} onMouseDown={onResizeDown}>
                    <svg width="14" height="14" viewBox="0 0 14 14">
                        <path d="M13 1L1 13M13 6L6 13M13 13L13 13"
                            stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                    </svg>
                </div>
            </div>
        </div>
    );
}