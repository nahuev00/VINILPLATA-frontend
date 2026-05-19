// src/hooks/useOrdersPage.ts
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "@/services/orderService";
import { useDebounce } from "@/hooks/useDebounce";
import { useSocket } from "@/context/SocketContext";

export type PaymentFilter = "ALL" | "PAID" | "UNPAID";
export const ALL_STATUSES = [
  "EN_PRODUCCION",
  "EN_EMPAQUETADO",
  "EN_ENVIOS",
  "TERMINADO",
  "ENTREGADO",
  "CANCELADO",
];

export const useOrdersPage = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "EN_PRODUCCION",
    "EN_EMPAQUETADO",
    "EN_ENVIOS",
    "TERMINADO",
  ]);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ["orders", debouncedSearch],
    queryFn: () => getOrders({ page: 1, limit: 100, search: debouncedSearch }),
  });

  useEffect(() => {
    if (!socket) return;
    const handleOrdersUpdate = () =>
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    socket.on("ordersUpdated", handleOrdersUpdate);
    return () => {
      socket.off("ordersUpdated", handleOrdersUpdate);
    };
  }, [socket, queryClient]);

  const orders = ordersRes?.data || [];

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      if (!statusFilter.includes(order.status)) return false;
      if (paymentFilter === "PAID" && !order.isPaid) return false;
      if (paymentFilter === "UNPAID" && order.isPaid) return false;
      return true;
    });
  }, [orders, statusFilter, paymentFilter]);

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter.length !== ALL_STATUSES.length) count += 1;
    if (paymentFilter !== "ALL") count += 1;
    return count;
  };

  return {
    orders: filteredOrders,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    toggleStatus,
    paymentFilter,
    setPaymentFilter,
    getActiveFiltersCount,
  };
};
