import { io } from "socket.io-client";

const socket = io("/", {
  transports: ["polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export default socket;