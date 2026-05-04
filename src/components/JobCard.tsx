import { Loader2, HardHat, Package, ArrowRightLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Función auxiliar exportada para que la use también la columna
export const formatHoursAndMinutes = (decimalHours: number) => {
  if (isNaN(decimalHours) || decimalHours <= 0) return "0m";
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

export const JobCard = ({
  item,
  itemML,
  stations,
  getMaterialName,
  onUpdate,
  onOpenDetails,
  allPendingItems,
}: any) => {
  const compatibleStations =
    stations?.filter((st: any) =>
      st.materials?.some((m: any) => m.id === item.materialId),
    ) || [];

  const isFinishing = item.status === "TERMINACIONES";
  const isPrinting = item.status === "IMPRIMIENDO";
  const isReady = item.status === "REALIZADO";
  const isLocked = isPrinting || isFinishing;

  let currentOperatorName = "Operador no asignado";
  if (isLocked && item.logs && item.logs.length > 0) {
    const recentLog = [...item.logs]
      .reverse()
      .find((log: any) => log.status === item.status);
    if (recentLog && recentLog.operator) {
      currentOperatorName = recentLog.operator.name;
    }
  }

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm p-3 transition-all relative ${
        isLocked
          ? isFinishing
            ? "border-amber-400 shadow-amber-100 ring-1 ring-amber-400 ring-offset-1"
            : "border-blue-400 shadow-blue-100 ring-1 ring-blue-400 ring-offset-1"
          : isReady
            ? "border-purple-400 shadow-purple-100 ring-1 ring-purple-400 ring-offset-1"
            : "border-slate-200 hover:shadow-md hover:border-blue-300"
      }`}
    >
      <div className="cursor-pointer" onClick={() => onOpenDetails(item)}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-600 hover:underline">
              {item.order.orderNumber}
            </span>
            <span
              className="text-[15px] font-black text-slate-900 leading-tight truncate w-[250px]"
              title={item.order.client.name}
            >
              {item.order.client.name}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 mb-3 space-y-2 hover:bg-slate-100 transition-colors">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Material:
            </span>
            <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {getMaterialName(item.materialId)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Tamaño:
            </span>
            <span className="font-mono text-slate-700 font-bold">
              {item.widthMm} x {item.heightMm} mm{" "}
              <span className="text-slate-400 font-sans ml-1">
                ({item.copies}u)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Largo Lineal:
            </span>
            <span className="font-black text-slate-700">
              {itemML.toFixed(2)} ML
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 relative z-10">
        {isLocked ? (
          <div
            className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-md w-full justify-center border shadow-inner ${
              isFinishing
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-black text-[11px] tracking-wide ${
                isFinishing ? "text-amber-700" : "text-blue-700"
              }`}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {isFinishing ? "EN TERMINACIÓN..." : "IMPRIMIENDO..."}
            </div>
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600 bg-white px-3 py-0.5 rounded-full border border-slate-200 shadow-sm mt-0.5 uppercase">
              <HardHat className="w-4 h-4 text-slate-400" />
              {currentOperatorName}
            </div>
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs px-3 font-bold w-full shadow-sm ${
                  isReady
                    ? "bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-800"
                    : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700"
                }`}
              >
                {isReady ? (
                  <>
                    <Package className="w-3.5 h-3.5 mr-1.5" /> Esperando Empaque
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" /> Reasignar
                    Trabajo
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-2 bg-white shadow-2xl border border-slate-200 z-50 rounded-lg"
              align="start"
            >
              <span className="text-xs font-bold text-slate-500 mb-2.5 block uppercase tracking-wider pl-1">
                {isReady ? "Corregir asignación:" : "Reasignar a:"}
              </span>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8 text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 border border-transparent hover:border-amber-200"
                  onClick={() =>
                    onUpdate(item.id, {
                      assignedToId: null,
                      status: "PREIMPRESION",
                    })
                  }
                >
                  Devolver a Espera / Preimpresión
                </Button>
                <div className="h-px bg-slate-100 my-0.5"></div>
                {compatibleStations.length > 0 ? (
                  compatibleStations.map((st: any) => {
                    const stItems =
                      allPendingItems?.filter(
                        (i: any) => i.assignedToId === st.id,
                      ) || [];
                    const stTotalML = stItems.reduce((sum: number, i: any) => {
                      const ml =
                        i.linearMeters > 0
                          ? i.linearMeters
                          : ((i.heightMm || 0) / 1000) * (i.copies || 1);
                      return sum + ml;
                    }, 0);
                    const stSpeed = st.printSpeedPerHour || 10;
                    const stRawHours = stSpeed > 0 ? stTotalML / stSpeed : 0;
                    const stDisplayTime = formatHoursAndMinutes(stRawHours);

                    return (
                      <Button
                        key={st.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start h-8 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 border border-transparent flex w-full items-center"
                        onClick={() =>
                          onUpdate(item.id, {
                            assignedToId: st.id,
                            status: "EN_COLA",
                          })
                        }
                      >
                        <span className="truncate max-w-[120px]">
                          {st.name}
                        </span>
                        <span
                          className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            st.isFinishingStation
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {st.isFinishingStation ? "Corte" : "Impresión"}
                        </span>
                        <span className="ml-auto text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />{" "}
                          {stDisplayTime}
                        </span>
                      </Button>
                    );
                  })
                ) : (
                  <div className="text-[10px] text-amber-700 italic px-2 py-2 leading-relaxed border border-amber-200 bg-amber-50 rounded-md shadow-inner">
                    Ninguna otra máquina es compatible con{" "}
                    {getMaterialName(item.materialId)}.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};
