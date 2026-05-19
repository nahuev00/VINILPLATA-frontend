// src/components/OperatorJobCard.tsx
import { useState } from "react";
import {
  Play,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Maximize,
  CheckSquare,
  Square,
  ArrowRight,
  HardHat,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface OperatorJobCardProps {
  item: any;
  getMaterialName: (id: number) => string;
  onAction: (value: any) => void;
  actionType: "START" | "FINISH";
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isBulkModeActive?: boolean;
  stations?: any[];
  userId?: number;
  isFinishing?: boolean;
  operators?: any[];
  onReturnToQueue?: () => void;
}

export const OperatorJobCard = ({
  item,
  getMaterialName,
  onAction,
  actionType,
  isSelected,
  onToggleSelect,
  isBulkModeActive,
  stations,
  userId,
  isFinishing,
  operators,
  onReturnToQueue,
}: OperatorJobCardProps) => {
  const [localOperatorId, setLocalOperatorId] = useState<number | "">("");

  const cardStyles =
    actionType === "START"
      ? isSelected
        ? "border-l-blue-600 ring-2 ring-blue-400 bg-blue-50/40 shadow-md"
        : "border-l-slate-400 hover:border-l-blue-400 hover:shadow-md cursor-pointer"
      : "border-l-blue-500 ring-1 ring-blue-200";

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border-l-8 p-5 transition-all select-none ${cardStyles}`}
      onClick={actionType === "START" ? onToggleSelect : undefined}
    >
      {actionType === "START" && (
        <div className="absolute top-4 right-4 text-slate-300 hover:text-blue-500 transition-colors">
          {isSelected ? (
            <CheckSquare className="w-8 h-8 text-blue-600" />
          ) : (
            <Square className="w-8 h-8" />
          )}
        </div>
      )}

      <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3 pr-10">
        <div>
          <span className="text-lg font-black text-slate-900 block leading-tight">
            {item.order.client.searchName || item.order.client.name}
          </span>
          <span className="text-sm font-bold text-blue-600">
            {item.order.orderNumber}
          </span>
          {item.order.promisedDate && (
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              Entrega:{" "}
              {new Date(item.order.promisedDate).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">
            Material
          </span>
          <span className="bg-indigo-100 text-indigo-800 font-black px-3 py-1.5 rounded-lg text-sm border border-indigo-200">
            {getMaterialName(item.materialId)}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <FileText className="w-5 h-5 text-slate-500 shrink-0" />
          <span className="font-mono text-slate-700 font-bold text-base truncate">
            {item.fileName || "SIN ARCHIVO"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-slate-100 p-2.5 rounded-lg flex items-center gap-2">
            <Maximize className="w-4 h-4 text-slate-500" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Medidas (mm)
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {item.widthMm} x {item.heightMm}
              </span>
            </div>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-lg text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400">
              Cantidad
            </span>
            <span className="font-black text-slate-800 text-lg leading-none">
              {item.copies} u.
            </span>
          </div>
        </div>
      </div>

      {item.finishing && (
        <div className="mb-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Terminaciones Requeridas
          </span>
          <p className="text-sm text-amber-900 font-medium leading-snug">
            {item.finishing}
          </p>
        </div>
      )}

      {item.notes && (
        <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <span className="text-xs font-bold text-yellow-800 uppercase mb-1 block">
            Notas del ítem:
          </span>
          <p className="text-sm text-yellow-900 font-medium leading-snug">
            {item.notes}
          </p>
        </div>
      )}

      {!(actionType === "START" && isBulkModeActive && !isSelected) && (
        <div onClick={(e) => e.stopPropagation()}>
          {actionType === "START" ? (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {!isSelected && (
                <>
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                    <HardHat className="w-3.5 h-3.5" /> ¿Quién realiza el
                    trabajo?
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm font-medium mb-3 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    value={localOperatorId}
                    onChange={(e) => setLocalOperatorId(Number(e.target.value))}
                  >
                    <option value="" disabled>
                      -- Seleccione su nombre --
                    </option>
                    {operators?.map((op: any) => (
                      <option key={op.id} value={op.id}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <Button
                disabled={!isSelected && localOperatorId === ""}
                onClick={() => {
                  if (isSelected) return;
                  onAction(Number(localOperatorId));
                }}
                className={`w-full h-14 text-lg font-black tracking-wide shadow-md transition-all ${
                  isSelected
                    ? "bg-slate-200 text-slate-500 hover:bg-slate-300 shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
                }`}
              >
                {isSelected ? (
                  "SELECCIONADO PARA GRUPO"
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" />{" "}
                    {isFinishing ? "INICIAR TERMINACIÓN" : "INICIAR IMPRESIÓN"}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-full h-14 text-lg font-black tracking-wide shadow-md transition-all mt-2 bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600">
                  <CheckCircle2 className="w-6 h-6 mr-2" /> TERMINAR TRABAJO
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-3 bg-white shadow-2xl border-slate-200 z-50 rounded-xl"
                align="center"
              >
                <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-center">
                  ¿Siguiente Paso?
                </h4>
                <Button
                  onClick={() => onAction(null)}
                  className="w-full justify-start h-12 mb-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold border border-emerald-300"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> REALIZADO (A
                  Empaque)
                </Button>

                {onReturnToQueue && (
                  <Button
                    onClick={onReturnToQueue}
                    className="w-full justify-start h-12 mb-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" /> Volver a la cola
                  </Button>
                )}

                {!isFinishing && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        O Derivar a:
                      </span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {stations
                        ?.filter(
                          (st: any) =>
                            st.isFinishingStation && st.id !== userId,
                        )
                        .map((st: any) => (
                          <Button
                            key={st.id}
                            variant="outline"
                            onClick={() => onAction(st.id)}
                            className="justify-start h-10 text-xs font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50 border-slate-200"
                          >
                            <ArrowRight className="w-4 h-4 mr-2 text-amber-500" />{" "}
                            Enviar a terminación: {st.name}
                          </Button>
                        ))}
                    </div>
                  </>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
};
