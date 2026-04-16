// src/pages/EnviosPage.tsx
import { useEffect } from "react"; // 👈 IMPORTAMOS useEffect
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  MapPin,
  CheckCircle2,
  LogOut,
  PackageCheck,
  User,
  Receipt,
  Phone,
  Printer,
  Map,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { getOrders, updateOrder } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

// 👇 IMPORTAMOS EL HOOK DEL SOCKET 👇
import { useSocket } from "@/context/SocketContext";

export const EnviosPage = () => {
  const { user, logoutUser } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket(); // 👈 INSTANCIAMOS EL SOCKET

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ["orders-shipping"],
    queryFn: () => getOrders({ page: 1, limit: 100 }),
    // 👇 ELIMINAMOS refetchInterval: 15000 👇
  });

  // 👇 NUEVA MAGIA: ESCUCHADOR EN TIEMPO REAL 👇
  useEffect(() => {
    if (!socket) return;

    const handleOrdersUpdate = () => {
      console.log("🔄 Actualización detectada: Recargando cola de envíos...");
      queryClient.invalidateQueries({ queryKey: ["orders-shipping"] });
    };

    socket.on("ordersUpdated", handleOrdersUpdate);

    return () => {
      socket.off("ordersUpdated", handleOrdersUpdate);
    };
  }, [socket, queryClient]);

  const deliverMut = useMutation({
    mutationFn: async (orderId: number) => {
      await updateOrder(orderId, { status: "ENTREGADO" });
    },
    onSuccess: () => {
      // Opcional invalidar aquí, ya que el socket lo hará, pero lo dejamos por seguridad.
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
  const ordersToShip = allOrders.filter(
    (order: any) => order.status === "TERMINADO",
  );

  return (
    <div className="flex flex-col h-screen p-4 sm:p-6 lg:p-8 bg-slate-100">
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
            {ordersToShip.map((order: any) => (
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
      <div className="p-4 border-b bg-teal-50 border-teal-100 flex justify-between items-start">
        <div>
          <span className="text-xs font-black text-teal-700 mb-0.5 block uppercase tracking-widest">
            {order.orderNumber}
          </span>
          <h3 className="text-lg font-black text-slate-900 leading-tight">
            {order.client?.name}
          </h3>
        </div>
        <div className="text-right">
          <span className="bg-white px-2.5 py-1 rounded border border-teal-200 font-black text-teal-800 shadow-sm block text-xs">
            ${order.total?.toLocaleString("es-AR")}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 bg-white space-y-4">
        {/* ETIQUETA DE ENVÍO VISUAL */}
        <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-4 relative">
          <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">
            Datos Etiqueta
          </div>

          {/* Método de Envío Destacado */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200/60">
            <Truck
              className={`w-5 h-5 ${isRetiro ? "text-amber-500" : "text-teal-600"}`}
            />
            <span
              className={`text-sm font-black uppercase tracking-wide ${isRetiro ? "text-amber-700" : "text-teal-700"}`}
            >
              {order.shippingType || "A CONVENIR"}
            </span>
          </div>

          {/* Info del Cliente y Destino */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {order.client?.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  DNI/CUIT: {order.client?.documentNumber || "S/D"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-slate-700">
                {order.client?.phone || "Sin teléfono registrado"}
              </p>
            </div>

            {!isRetiro && (
              <>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-slate-700 leading-tight">
                    {order.client?.address || "Sin dirección registrada"}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <Map className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {order.city?.name || "Localidad no especificada"}
                  </p>
                </div>

                <div className="flex items-start gap-2 bg-white p-2 rounded border border-slate-200 shadow-sm mt-2">
                  <Building2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                      Transporte / Expreso
                    </p>
                    <p className="text-xs font-black text-indigo-700 leading-none">
                      {order.carrier?.name || "No asignado"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resumen Administrativo */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-100 p-2 rounded">
          <div className="flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Efvo:{" "}
              <strong className="text-slate-800">${order.cashPayment}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              MP:{" "}
              <strong className="text-slate-800">
                ${order.electronicPayment}
              </strong>
            </span>
          </div>
        </div>

        {/* Resumen del paquete */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Contenido del paquete ({order.items?.length}):
          </h4>
          <ul className="text-[11px] text-slate-600 space-y-1 max-h-[80px] overflow-y-auto pr-2">
            {order.items?.map((item: any, idx: number) => (
              <li key={item.id} className="flex gap-2 items-center">
                <span className="font-black text-slate-700 bg-slate-100 px-1 rounded">
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

      {/* Botones de Acción */}
      <div className="p-4 bg-teal-50 border-t border-teal-100 flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full h-8 text-[11px] font-bold text-teal-700 border-teal-300 bg-white hover:bg-teal-100"
          onClick={() =>
            toast.info(
              "Funcionalidad de generación de etiquetas PDF próximamente.",
            )
          }
        >
          <Printer className="w-3.5 h-3.5 mr-2" /> IMPRIMIR ETIQUETA
        </Button>

        <Button
          onClick={onDeliver}
          disabled={isLoading}
          className="w-full h-12 text-sm font-black bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {isRetiro ? "ENTREGAR AL CLIENTE" : "DESPACHAR AL CAMIÓN"}
        </Button>
      </div>
    </div>
  );
};
