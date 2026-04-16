// src/context/SocketContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Tomamos la URL exacta del .env (http://localhost:4000)
    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    if (!socketUrl) {
      console.error("Falta VITE_SOCKET_URL en el .env");
      return;
    }

    // Instalación 100% estándar, sin configuraciones extrañas
    const socketInstance = io(socketUrl);

    socketInstance.on("connect", () => {
      console.log("🟢 Conectado al servidor de WebSockets directamente!");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("🔴 Desconectado del servidor de WebSockets");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
