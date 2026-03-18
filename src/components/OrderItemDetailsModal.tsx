import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  User,
  Calendar,
  Ruler,
  Scissors,
  StickyNote,
  Printer,
  Maximize,
} from "lucide-react";

export const OrderItemDetailsModal = ({
  isOpen,
  onClose,
  item,
  getMaterialName,
  stations,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  getMaterialName: (id: number) => string;
  stations: any[];
}) => {
  if (!item) return null;

  // Calculamos el salvavidas por si no hay metros lineales en la BD
  const itemML =
    item.linearMeters > 0
      ? item.linearMeters
      : ((item.heightMm || 0) / 1000) * (item.copies || 1);
  const areaM2 = ((item.widthMm * item.heightMm) / 1000000) * item.copies;

  const stationName =
    stations?.find((st) => st.id === item.assignedToId)?.name || "Sin Asignar";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[700px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* ENCABEZADO */}
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-blue-600">{item.order.orderNumber}</span>
              </DialogTitle>
              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                {item.fileName || "Sin nombre de archivo referenciado"}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  item.status === "PREIMPRESION"
                    ? "bg-slate-100 text-slate-600"
                    : item.status === "EN_COLA"
                      ? "bg-amber-100 text-amber-700"
                      : item.status === "IMPRESO"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                }`}
              >
                {item.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* INFO DEL CLIENTE Y ORDEN */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Cliente
              </span>
              <span className="text-sm font-bold text-slate-900 block mt-1">
                {item.order.client.name}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Entrega Prometida
              </span>
              <span className="text-sm font-medium text-slate-900 block mt-1">
                {item.order.promisedDate
                  ? new Date(item.order.promisedDate).toLocaleDateString(
                      "es-AR",
                    )
                  : "A convenir"}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Asignado a
              </span>
              <span className="text-sm font-medium text-slate-900 block mt-1">
                {stationName}
              </span>
            </div>
          </div>

          {/* DETALLES TÉCNICOS DE PRODUCCIÓN */}
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-blue-600" /> Especificaciones
              Técnicas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 border border-slate-200 rounded-md bg-white shadow-sm">
                <span className="text-xs text-slate-500 block mb-1">
                  Material
                </span>
                <span className="font-bold text-indigo-700 text-sm">
                  {getMaterialName(item.materialId)}
                </span>
              </div>
              <div className="p-3 border border-slate-200 rounded-md bg-white shadow-sm">
                <span className="text-xs text-slate-500 block mb-1">
                  Medidas (mm)
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {item.widthMm} x {item.heightMm}
                </span>
              </div>
              <div className="p-3 border border-slate-200 rounded-md bg-white shadow-sm">
                <span className="text-xs text-slate-500 block mb-1">
                  Copias
                </span>
                <span className="font-bold text-slate-900 text-sm text-center block">
                  {item.copies}
                </span>
              </div>
              <div className="p-3 border border-slate-200 rounded-md bg-white shadow-sm bg-blue-50/30">
                <span className="text-xs text-slate-500 block mb-1">
                  Consumo Estimado
                </span>
                <span className="font-bold text-blue-700 text-sm block">
                  {itemML.toFixed(2)} ML
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  ({areaM2.toFixed(2)} M²)
                </span>
              </div>
            </div>
          </div>

          {/* TERMINACIONES Y NOTAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-md bg-amber-50/30">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2 text-sm">
                <Scissors className="w-4 h-4 text-amber-600" /> Terminaciones
              </h4>
              <p className="text-sm text-slate-700 font-medium">
                {item.finishing || (
                  <span className="text-slate-400 italic font-normal">
                    Sin terminaciones especificadas.
                  </span>
                )}
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-md bg-slate-50">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2 text-sm">
                <StickyNote className="w-4 h-4 text-blue-600" /> Notas del
                Renglón
              </h4>
              <p className="text-sm text-slate-700">
                {item.notes || (
                  <span className="text-slate-400 italic">
                    Sin notas adicionales.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* NOTAS GENERALES DE LA ORDEN (Si las hay) */}
          {item.order.notes && (
            <div className="p-4 border border-red-200 rounded-md bg-red-50/50">
              <h4 className="font-bold text-red-800 flex items-center gap-2 mb-1 text-sm">
                Atención - Notas de la Orden General
              </h4>
              <p className="text-sm text-red-700">{item.order.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
