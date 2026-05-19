import { Truck, Package, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const MiniShippingOrderCard = ({ order, onDeliver }: any) => {
  return (
    <div className="bg-white rounded-lg border-2 border-teal-400 shadow-sm shadow-teal-100/50 p-3 transition-all hover:shadow-md">
      <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
        <div>
          <span className="text-xs font-black text-teal-700">
            {order.orderNumber}
          </span>
          <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">
            {order.client.searchName || order.client.name}
          </h4>
        </div>
        <span className="bg-teal-100 text-teal-800 font-black px-2 py-1 rounded text-[10px] uppercase tracking-wider">
          TERMINADO
        </span>
      </div>

      <div className="bg-slate-50 rounded p-2 border border-slate-100 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
          <Truck className="w-3.5 h-3.5 text-teal-600" />
          Envío:{" "}
          <span className="uppercase text-teal-700">
            {order.shippingType || "A convenir"}
          </span>
        </div>
        {order.client?.address && (
          <div className="flex items-start gap-1.5 text-[10px] font-medium text-slate-500 mt-1.5">
            <MapPin className="w-3 h-3 shrink-0 text-slate-400 mt-0.5" />
            <span className="leading-tight">{order.client.address}</span>
          </div>
        )}
      </div>

      <Button
        onClick={() => onDeliver(order.id)}
        className="w-full h-9 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-sm"
      >
        <CheckCircle2 className="w-4 h-4 mr-1.5" /> MARCAR COMO ENTREGADO
      </Button>
    </div>
  );
};

export const ShippingColumn = ({ title, orders, onDeliver }: any) => {
  return (
    <div className="flex flex-col w-[350px] rounded-xl border bg-teal-50/40 border-teal-200 h-full max-h-full overflow-hidden shrink-0 shadow-sm relative">
      <div className="p-4 border-b rounded-t-xl shrink-0 shadow-sm sticky top-0 z-20 bg-teal-50 border-teal-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-teal-900">{title}</h3>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full border bg-teal-100 text-teal-800 border-teal-200 shadow-sm">
            {orders.length} pedidos
          </span>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-white px-2.5 py-1.5 rounded-md border border-teal-100 shadow-sm w-full justify-center">
            <Package className="w-3.5 h-3.5" />
            Órdenes Listas para Entregar
          </div>
        </div>
      </div>

      <div className="p-3 overflow-y-auto flex-1 space-y-3 z-10">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-sm py-10 italic border-2 border-dashed rounded-lg text-teal-500 border-teal-200 bg-white/50">
            <CheckCircle2 className="w-8 h-8 mb-2 text-teal-300" />
            No hay despachos pendientes
          </div>
        ) : (
          orders.map((order: any) => (
            <MiniShippingOrderCard
              key={order.id}
              order={order}
              onDeliver={onDeliver}
            />
          ))
        )}
      </div>
    </div>
  );
};
