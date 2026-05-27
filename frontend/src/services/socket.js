import { io } from "socket.io-client";

const SOCKET_URL =

  import.meta.env.VITE_SOCKET_URL ||

  "http://127.0.0.1:5000";

const socket = io(
  SOCKET_URL,
  {
    transports: ["websocket"],

    autoConnect: true,

    reconnection: true,

    reconnectionAttempts: Infinity,

    reconnectionDelay: 1000,
  }
);

export default socket;