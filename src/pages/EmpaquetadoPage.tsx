// src/pages/EmpaquetadoPage.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  PackageCheck,
  LogOut,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Box,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import {
  getOrders,
  updateOrderItem,
  updateOrder,
} from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const EmpaquetadoPage = () => {
  const { user, logoutUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ["orders-packaging"],
    queryFn: () => getOrders({ page: 1, limit: 100 }),
    refetchInterval: 10000,
  });

  const updateBulkMut = useMutation({
    mutationFn: async ({ order }: { order: any }) => {
      // 1. Pasar todos los ítems de esta orden al nuevo estado EMPAQUETADO
      const itemPromises = order.items.map((item: any) =>
        updateOrderItem(item.id, { status: "EMPAQUETADO" }),
      );
      await Promise.all(itemPromises);

      // 2. Cambiar la orden general a TERMINADO (Lista para despachos)
      await updateOrder(order.id, { status: "TERMINADO" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-packaging"] });
      toast.success("¡Orden empaquetada y enviada a Despachos!");
    },
    onError: () => toast.error("Error al empaquetar la orden"),
  });

  if (isLoading)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Cargando módulo de empaquetado...
      </div>
    );

  const allOrders = ordersRes?.data || [];

  // Filtramos solo las órdenes que no están ya terminadas ni entregadas
  // Y que tengan al menos UN ítem en estado REALIZADO
  const ordersToPackage = allOrders.filter(
    (order) =>
      !["TERMINADO", "ENTREGADO", "CANCELADO"].includes(order.status) &&
      order.items.some((item: any) => item.status === "REALIZADO"),
  );

  return (
    <div className="flex flex-col h-screen p-4 sm:p-6 lg:p-8 bg-slate-100">
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-wide">
            <Package className="w-8 h-8 text-purple-400" />
            ÁREA DE EMPAQUE
          </h1>
          <p className="text-slate-400 font-medium mt-1">
            Operador: {user?.name}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right border-r border-slate-700 pr-6 hidden sm:block">
            <span className="block text-3xl font-black text-purple-400">
              {ordersToPackage.length}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Por armar
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={logoutUser}
            className="text-red-400 hover:bg-red-400/10 h-auto py-2 px-3"
          >
            <LogOut className="w-6 h-6 sm:mr-2" />{" "}
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {ordersToPackage.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <PackageCheck className="w-24 h-24 mb-4 text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-500">Todo al día</h2>
            <p>No hay órdenes con ítems finalizados esperando empaque.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ordersToPackage.map((order) => (
              <OrderPackageCard
                key={order.id}
                order={order}
                onPack={() => updateBulkMut.mutate({ order })}
                isLoading={updateBulkMut.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// TARJETA DE ORDEN A EMPAQUETAR
// ==========================================
const OrderPackageCard = ({ order, onPack, isLoading }: any) => {
  // Lógica: Revisamos si todos los ítems de esta orden están en estado REALIZADO o EMPAQUETADO
  const isReadyToPack = order.items.every((item: any) =>
    ["REALIZADO", "EMPAQUETADO"].includes(item.status),
  );

  const pendingItemsCount = order.items.filter(
    (item: any) => !["REALIZADO", "EMPAQUETADO"].includes(item.status),
  ).length;

  return (
    <div
      className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden flex flex-col transition-all ${
        isReadyToPack
          ? "border-purple-500 ring-4 ring-purple-50"
          : "border-amber-300 opacity-90"
      }`}
    >
      <div
        className={`p-5 border-b flex justify-between items-start ${isReadyToPack ? "bg-purple-50 border-purple-100" : "bg-amber-50 border-amber-100"}`}
      >
        <div>
          <span className="text-sm font-bold text-slate-500 mb-1 block uppercase tracking-widest">
            ORDEN {order.orderNumber}
          </span>
          <h3 className="text-xl font-black text-slate-900 leading-tight">
            {order.client.name}
          </h3>
        </div>
        <div className="text-right">
          <span className="bg-white px-3 py-1.5 rounded-lg border font-black text-slate-700 shadow-sm block">
            {order.items.length} ítems
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-3 bg-slate-50/50">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Contenido de la caja:
        </h4>

        {order.items.map((item: any, index: number) => {
          const isDone = ["REALIZADO", "EMPAQUETADO"].includes(item.status);

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isDone
                  ? "bg-white border-slate-200"
                  : "bg-slate-100 border-slate-300 border-dashed"
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-purple-500" />
                ) : (
                  <Clock className="w-6 h-6 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold truncate ${isDone ? "text-slate-800" : "text-slate-500"}`}
                >
                  {item.copies}x {item.fileName || `Renglón ${index + 1}`}
                </p>
                <p className="text-xs font-mono text-slate-500">
                  {item.widthMm}x{item.heightMm}mm
                </p>
              </div>
              {!isDone && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">
                  {item.status.replace("_", " ")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-5 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-600 bg-slate-100 p-2 rounded-md">
          <Truck className="w-4 h-4 text-blue-500 shrink-0" />
          Envío:{" "}
          <span className="font-bold text-slate-800">
            {order.shippingType || "A convenir"}
          </span>
        </div>

        {isReadyToPack ? (
          <Button
            onClick={onPack}
            disabled={isLoading}
            className="w-full h-16 text-lg font-black bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all"
          >
            <Box className="w-6 h-6 mr-2" />
            CERRAR Y ENVIAR A DESPACHO
          </Button>
        ) : (
          <div className="w-full h-16 rounded-md bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold px-4 text-center">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
            <span className="text-sm">
              Faltan {pendingItemsCount} ítems para completar
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
