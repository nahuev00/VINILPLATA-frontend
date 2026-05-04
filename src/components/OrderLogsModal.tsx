// src/components/OrderLogsModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  Clock,
  FileText,
  HardHat,
  ChevronRight,
  PackageX,
  Printer,
} from "lucide-react";

interface OrderLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export const OrderLogsModal = ({
  isOpen,
  onClose,
  order,
}: OrderLogsModalProps) => {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 👇 Ajuste clave: sm:max-w-[90vw] xl:max-w-[1200px] para hacerlo ancho, y max-h-[80vh] para la altura 👇 */}
      <DialogContent className="w-full sm:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[1200px] max-h-[80vh] bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0 pb-4 border-b border-slate-100">
          <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-8 h-8 text-indigo-600" />
            Historial de Producción por Ítem
          </DialogTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 w-fit">
            <span className="text-base">
              Orden:{" "}
              <strong className="text-indigo-700 font-black">
                {order.orderNumber}
              </strong>
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-base">
              Cliente:{" "}
              <strong className="text-slate-800">{order.client?.name}</strong>
            </span>
          </div>
        </DialogHeader>

        {/* Contenedor principal con scroll vertical */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-2 custom-scrollbar-vertical">
          {!order.items || order.items.length === 0 ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center">
              <PackageX className="w-16 h-16 mb-4 text-slate-200" />
              <p className="text-lg font-medium">
                Esta orden no tiene ítems registrados.
              </p>
            </div>
          ) : (
            order.items.map((item: any) => {
              const sortedLogs = item.logs
                ? [...item.logs].sort(
                    (a: any, b: any) =>
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime(),
                  )
                : [];

              return (
                <div
                  key={item.id}
                  className="bg-white border-2 border-slate-200/60 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Cabecera del Ítem */}
                  <div className="bg-slate-50/80 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200">
                        <FileText className="w-7 h-7 text-slate-500" />
                      </div>
                      <div>
                        <h4
                          className="text-lg font-bold text-slate-800 truncate max-w-[600px]"
                          title={item.fileName}
                        >
                          {item.fileName || "Sin archivo especificado"}
                        </h4>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500 mt-1">
                          <span className="bg-white px-2.5 py-0.5 rounded border border-slate-200">
                            {item.widthMm} x {item.heightMm} mm
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                            {item.copies} copias
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Línea de tiempo Horizontal */}
                  <div className="p-6 bg-white overflow-x-auto custom-scrollbar">
                    {sortedLogs.length === 0 ? (
                      <span className="text-base italic text-slate-400 block py-4">
                        Sin historial de movimientos registrado para este ítem.
                      </span>
                    ) : (
                      <div className="flex items-center min-w-max pb-4">
                        {sortedLogs.map((log: any, index: number) => {
                          const isLast = index === sortedLogs.length - 1;

                          return (
                            <div
                              key={log.id}
                              className="flex items-center shrink-0"
                            >
                              {/* Tarjeta del Log */}
                              <div className="bg-white border-2 border-slate-100 shadow-sm p-4 rounded-xl w-64 flex flex-col gap-2 hover:border-indigo-300 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-black text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded uppercase tracking-wider border border-indigo-100">
                                    {log.status.replace("_", " ")}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-2 mt-1">
                                  {/* Operador */}
                                  <div className="flex items-center gap-2 text-sm text-slate-700">
                                    {log.operator ? (
                                      <>
                                        <HardHat className="w-5 h-5 text-amber-600 shrink-0" />
                                        <span
                                          className="font-bold text-base truncate"
                                          title={log.operator.name}
                                        >
                                          {log.operator.name}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <HardHat className="w-5 h-5 text-slate-300 shrink-0" />
                                        <span className="italic text-slate-400 font-medium text-sm">
                                          Operario sin asignar
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {/* Estación / Máquina */}
                                  {log.station && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                                      <Printer className="w-4 h-4 text-blue-500 shrink-0" />
                                      <span
                                        className="font-medium truncate text-xs"
                                        title={log.station.name}
                                      >
                                        Máquina:{" "}
                                        <strong className="text-slate-800">
                                          {log.station.name}
                                        </strong>
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 pt-3 border-t border-slate-100 mt-2">
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  {new Date(log.createdAt).toLocaleString(
                                    "es-AR",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}{" "}
                                  hs
                                </div>
                              </div>

                              {/* Conector (Flecha) centrado */}
                              {!isLast && (
                                <div className="flex items-center justify-center px-3 sm:px-6">
                                  <div className="flex items-center">
                                    <div className="w-12 sm:w-20 h-[3px] bg-indigo-200 rounded-full" />
                                    <ChevronRight className="w-8 h-8 text-indigo-400 -ml-3" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }

        .custom-scrollbar-vertical::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar-vertical::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar-vertical::-webkit-scrollbar-thumb {
          background: #e2e8f0; 
          border-radius: 4px;
        }
        .custom-scrollbar-vertical::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1; 
        }
      `}</style>
    </Dialog>
  );
};
