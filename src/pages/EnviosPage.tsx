import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  MapPin,
  CheckCircle2,
  LogOut,
  PackageCheck,
  User,
  CalendarDays,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { getOrders, updateOrder } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const EnviosPage = () => {
  const { user, logoutUser } = useAuth();
  const queryClient = useQueryClient();

  // Traemos las órdenes. Filtraremos las TERMINADO en el frontend
  // (Si tuvieras miles, lo ideal sería filtrar desde el backend pasándole el status a getOrders)
  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ["orders-shipping"],
    queryFn: () => getOrders({ page: 1, limit: 100 }),
    refetchInterval: 15000, // Refresco cada 15 segundos
  });

  // Mutación para marcar la orden como ENTREGADA
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

  if (isLoading)
    return (
      <div className="p-8 text-center text-teal-700 font-medium">
        Cargando módulo de envíos...
      </div>
    );

  const allOrders = ordersRes?.data || [];

  // Filtramos estrictamente las órdenes que están en TERMINADO (empaquetadas y listas)
  const ordersToShip = allOrders.filter(
    (order) => order.status === "TERMINADO",
  );

  return (
    <div className="flex flex-col h-screen p-4 sm:p-6 lg:p-8 bg-slate-100">
      {/* HEADER DE LA ESTACIÓN */}
      <div className="mb-6 bg-teal-950 text-white p-6 rounded-xl shadow-lg flex justify-between items-center shrink-0 border-b-4 border-teal-500">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ordersToShip.map((order) => (
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

// ==========================================
// TARJETA DE ORDEN A DESPACHAR
// ==========================================
const ShippingOrderCard = ({ order, onDeliver, isLoading }: any) => {
  const isRetiro = order.shippingType === "RETIRA";

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-teal-500 overflow-hidden flex flex-col transition-all hover:shadow-lg">
      {/* Cabecera */}
      <div className="p-5 border-b bg-teal-50 border-teal-100 flex justify-between items-start">
        <div>
          <span className="text-sm font-black text-teal-700 mb-1 block uppercase tracking-widest">
            {order.orderNumber}
          </span>
          <h3 className="text-xl font-black text-slate-900 leading-tight">
            {order.client.name}
          </h3>
        </div>
        <div className="text-right">
          <span className="bg-white px-3 py-1.5 rounded-lg border border-teal-200 font-black text-teal-800 shadow-sm block text-sm">
            ${order.total.toLocaleString("es-AR")}
          </span>
        </div>
      </div>

      {/* Info Logística y Cliente */}
      <div className="p-5 flex-1 bg-white space-y-4">
        {/* Etiqueta de Envío Grande */}
        <div
          className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
            isRetiro
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <Truck className="w-6 h-6 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
              Tipo de Entrega
            </span>
            <span className="block text-lg font-black uppercase tracking-wide leading-none mt-0.5">
              {order.shippingType || "NO ESPECIFICADO"}
            </span>
          </div>
        </div>

        {/* Detalles del cliente / Destino */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
          {!isRetiro && order.client.address && (
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="font-medium">{order.client.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium">
              Vendedor: {order.seller?.name || "-"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium">
              Pagos: Efectivo ${order.cashPayment} | Digital $
              {order.electronicPayment}
            </span>
          </div>
        </div>

        {/* Resumen del paquete */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Contenido verificado ({order.items.length} ítems):
          </h4>
          <ul className="text-xs text-slate-600 space-y-1.5 max-h-[100px] overflow-y-auto">
            {order.items.map((item: any, idx: number) => (
              <li key={item.id} className="flex gap-2 items-center">
                <span className="font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {item.copies}x
                </span>
                <span className="truncate font-medium">
                  {item.fileName || `Producto ${idx + 1}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botón de Acción Final */}
      <div className="p-5 bg-teal-50 border-t border-teal-100">
        <Button
          onClick={onDeliver}
          disabled={isLoading}
          className="w-full h-16 text-lg font-black bg-teal-600 hover:bg-teal-700 text-white shadow-lg transition-all"
        >
          <CheckCircle2 className="w-6 h-6 mr-2" />
          {isRetiro ? "ENTREGAR AL CLIENTE" : "DESPACHAR / SUBIR AL CAMIÓN"}
        </Button>
      </div>
    </div>
  );
};
