// src/pages/EnviosPage.tsx
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, LogOut, PackageCheck, Search } from "lucide-react";
import { toast } from "sonner";

import { updateOrder } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 👇 Importamos nuestro Hook en Tiempo Real y la Tarjeta 👇
import { useRealtimeOrders } from "@/hooks/useRealTimeOrders";
import { ShippingOrderCard } from "@/components/ShippingOrderCard";

export const EnviosPage = () => {
  const { user, logoutUser } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");

  // 1 línea reemplaza a todo el bloque de useQuery, useSocket y useEffect
  const { data: ordersRes, isLoading } = useRealtimeOrders("orders-shipping");

  const deliverMut = useMutation({
    mutationFn: async (orderId: number) => {
      await updateOrder(orderId, { status: "ENTREGADO" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-shipping"] });
      toast.success("¡Orden despachada con éxito!");
    },
    onError: () => toast.error("Error al actualizar la orden"),
  });

  const allOrders = ordersRes?.data || [];
  const ordersToShip = allOrders.filter(
    (order: any) => order.status === "TERMINADO",
  );

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return ordersToShip;

    const lowerTerm = searchTerm.toLowerCase();

    return ordersToShip.filter((order: any) => {
      return (
        order.orderNumber?.toLowerCase().includes(lowerTerm) ||
        order.client?.name?.toLowerCase().includes(lowerTerm) ||
        order.shippingType?.toLowerCase().includes(lowerTerm) ||
        order.carrier?.name?.toLowerCase().includes(lowerTerm) ||
        order.city?.name?.toLowerCase().includes(lowerTerm)
      );
    });
  }, [ordersToShip, searchTerm]);

  if (isLoading)
    return (
      <div className="p-8 text-center text-teal-700 font-medium">
        Cargando módulo de envíos...
      </div>
    );

  return (
    <div className="flex flex-col h-screen p-4 sm:p-6 lg:p-8 bg-slate-100">
      {/* CABECERA PRINCIPAL */}
      <div className="mb-4 bg-teal-950 text-white p-6 rounded-xl shadow-lg flex justify-between items-center shrink-0 border-b-4 border-teal-500">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-wide">
            <Truck className="w-8 h-8 text-teal-400" />
            ÁREA DE LOGÍSTICA Y DESPACHOS
          </h1>
          <p className="text-teal-200/70 font-medium mt-1">
            Estación: {user?.name}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right border-r border-teal-800 pr-6 hidden sm:block">
            <span className="block text-3xl font-black text-teal-400">
              {ordersToShip.length}
            </span>
            <span className="text-xs text-teal-200/50 font-bold uppercase tracking-wider">
              Por entregar
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={logoutUser}
            className="text-red-300 hover:bg-red-500/20 hover:text-red-200 h-auto py-2 px-3"
          >
            <LogOut className="w-6 h-6 sm:mr-2" />{" "}
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6 shrink-0 flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por comisionista, cliente, ciudad o N° de orden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-slate-50 text-sm border-slate-300 focus-visible:ring-teal-500"
          />
        </div>
        {searchTerm && (
          <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
            {filteredOrders.length} resultados
          </span>
        )}
      </div>

      {/* ÁREA DE TARJETAS */}
      <div className="flex-1 overflow-y-auto pb-8">
        {ordersToShip.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <PackageCheck className="w-24 h-24 mb-4 text-teal-200/50" />
            <h2 className="text-2xl font-bold text-slate-500">
              Sin despachos pendientes
            </h2>
            <p className="text-slate-400 mt-2">
              Todo ha sido entregado o no han llegado paquetes de producción.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Search className="w-16 h-16 mb-4 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-500">
              No hay coincidencias
            </h2>
            <p className="text-slate-400 mt-2">
              No se encontraron despachos para "{searchTerm}".
            </p>
            <Button
              variant="link"
              onClick={() => setSearchTerm("")}
              className="mt-4 text-teal-600"
            >
              Limpiar búsqueda
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order: any) => (
              <ShippingOrderCard
                key={order.id}
                order={order}
                onDeliver={() => deliverMut.mutate(order.id)}
                isLoading={deliverMut.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
