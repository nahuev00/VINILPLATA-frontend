// src/hooks/useRealtimeOrders.ts
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "@/services/orderService";
import { useSocket } from "@/context/SocketContext";

export const useRealtimeOrders = (queryKeyName: string, userId?: number) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // 1. Armamos la key dinámica (Ej: ["orders-station", 5] o ["orders-packaging"])
  const queryKey = userId ? [queryKeyName, userId] : [queryKeyName];

  // 2. Traemos los datos
  const query = useQuery({
    queryKey,
    queryFn: () => getOrders({ page: 1, limit: 100 }),
  });

  // 3. Conectamos el WebSocket de forma automática
  useEffect(() => {
    if (!socket) return;

    const handleOrdersUpdate = () => {
      console.log(`🔄 Socket: Actualizando caché de ${queryKeyName}`);
      queryClient.invalidateQueries({ queryKey });
    };

    socket.on("ordersUpdated", handleOrdersUpdate);

    return () => {
      socket.off("ordersUpdated", handleOrdersUpdate);
    };
  }, [socket, queryClient, queryKeyName, userId]);

  return query;
};
