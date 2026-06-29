import { io } from "socket.io-client";

let socket;
export function connectSocket(userId) {
  if (!userId) return null;
  socket = io(import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : "http://localhost:5000");
  socket.on("connect", () => {
    socket.emit('join', userId);
  });
  return socket;
}

export function getSocket() {
  return socket;
}
