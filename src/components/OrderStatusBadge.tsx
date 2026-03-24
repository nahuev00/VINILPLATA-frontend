import { type OrderStatus } from "@/services/orderService";

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const styles: Record<string, string> = {
    PRESUPUESTADO: "bg-slate-100 text-slate-700 border-slate-200",
    EN_PRODUCCION: "bg-amber-100 text-amber-800 border-amber-200",
    TERMINADO: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ENTREGADO: "bg-blue-100 text-blue-800 border-blue-200",
    CANCELADO: "bg-red-100 text-red-800 border-red-200",
  };

  // Por si llega un estado que no está en el mapa
  const appliedStyle =
    styles[status] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${appliedStyle}`}
    >
      {status.replace("_", " ")}
    </span>
  );
};
