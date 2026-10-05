import { Server } from "socket.io";

let connections = {};   // { roomId: [socketId, ...] }
let messages = {};      // { roomId: [ {...} ] }
let names = {};         // { roomId: { socketId: name } }

const MAX_BUFFER = 50 * 1024 * 1024; // 50 MB

export const connectVideoCallSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true,
        },
        maxHttpBufferSize: MAX_BUFFER,
        path: "/video-call-socket",
    });

    const findRoom = (socketId) => {
        for (const [roomId, sockets] of Object.entries(connections)) {
            if (sockets.includes(socketId)) return roomId;
        }
        return null;
    };

    io.on("connection", (socket) => {
        console.log("[VideoCall] Socket connected:", socket.id);

        // ---- REGISTER NAME ----
        socket.on("register-name", (name) => {
            const room = findRoom(socket.id);
            if (!room) return;
            if (!names[room]) names[room] = {};
            names[room][socket.id] = name || "Guest";

            connections[room].forEach((sid) => {
                io.to(sid).emit("participant-name", socket.id, names[room][socket.id]);
            });
        });

        socket.on("join-call", (path) => {
            if (!path) return;
            if (connections[path] === undefined) connections[path] = [];
            if (!connections[path].includes(socket.id)) connections[path].push(socket.id);

            connections[path].forEach((sid) =>
                io.to(sid).emit("user-joined", socket.id, connections[path])
            );

            if (names[path]) {
                Object.entries(names[path]).forEach(([sid, name]) => {
                    io.to(socket.id).emit("participant-name", sid, name);
                });
            }

            if (messages[path]) {
                messages[path].forEach((m) => {
                    const isPublic = !m.recipients || m.recipients.length === 0;
                    const isForMe =
                        m.type === "text" ||
                        isPublic ||
                        m.recipients.includes(socket.id) ||
                        m["socket-id-sender"] === socket.id;

                    if (!isForMe) return;

                    if (m.type === "file") {
                        io.to(socket.id).emit(
                            "chat-file",
                            {
                                fileName: m.fileName,
                                fileType: m.fileType,
                                fileSize: m.fileSize,
                                fileData: m.fileData,
                                duration: m.duration,
                            },
                            m.sender,
                            m["socket-id-sender"],
                            m.recipients || []
                        );
                    } else {
                        io.to(socket.id).emit(
                            "chat-message",
                            m.data,
                            m.sender,
                            m["socket-id-sender"]
                        );
                    }
                });
            }

            console.log(`[VideoCall] Socket ${socket.id} joined room ${path}`);
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const room = findRoom(socket.id);
            if (!room) return;
            if (!messages[room]) messages[room] = [];

            const msg = {
                type: "text",
                sender: sender || "Guest",
                data,
                "socket-id-sender": socket.id,
            };
            messages[room].push(msg);

            connections[room].forEach((sid) =>
                io.to(sid).emit("chat-message", msg.data, msg.sender, msg["socket-id-sender"])
            );
        });

        socket.on("chat-file", (payload, sender) => {
            const room = findRoom(socket.id);
            if (!room) return;
            if (!messages[room]) messages[room] = [];

            const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];
            const msg = {
                type: "file",
                sender: sender || "Guest",
                fileName: payload.fileName,
                fileType: payload.fileType,
                fileSize: payload.fileSize,
                fileData: payload.fileData,
                duration: payload.duration,
                recipients,
                "socket-id-sender": socket.id,
            };
            messages[room].push(msg);

            const targets =
                recipients.length === 0
                    ? connections[room]
                    : connections[room].filter(
                          (sid) => recipients.includes(sid) || sid === socket.id
                      );

            targets.forEach((sid) => {
                io.to(sid).emit(
                    "chat-file",
                    {
                        fileName: msg.fileName,
                        fileType: msg.fileType,
                        fileSize: msg.fileSize,
                        fileData: msg.fileData,
                        duration: msg.duration,
                    },
                    msg.sender,
                    msg["socket-id-sender"],
                    recipients
                );
            });
        });

        socket.on("disconnect", () => {
            for (const [roomId, sockets] of Object.entries(connections)) {
                if (sockets.includes(socket.id)) {
                    sockets.forEach((sid) => io.to(sid).emit("user-left", socket.id));
                    connections[roomId] = sockets.filter((id) => id !== socket.id);
                    if (names[roomId]) delete names[roomId][socket.id];
                    if (connections[roomId].length === 0) {
                        delete connections[roomId];
                        delete messages[roomId];
                        delete names[roomId];
                    }
                    break;
                }
            }
            console.log("[VideoCall] Socket disconnected:", socket.id);
        });
    });

    return io;
};