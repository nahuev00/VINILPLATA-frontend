import { useState, useMemo } from "react";
import {
  Package,
  Scissors,
  Printer,
  Clock,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  Box,
  ArrowUpDown,
  CheckSquare,
  Square,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { JobCard, formatHoursAndMinutes } from "./JobCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const StationColumn = ({
  title,
  items,
  station,
  stations,
  getMaterialName,
  onUpdate,
  onOpenDetails,
  allPendingItems,
  sortBy,
  onSortChange,
  selectedIds,
  onToggleSelect,
  onBulkAssign,
  isBulkAssigning,
  canSelectItem,
}: any) => {
  const isPackager = station?.role === "PACKAGER";
  const [targetStationId, setTargetStationId] = useState<number | "">("");

  const totalLinearMeters = items.reduce((sum: number, item: any) => {
    const ml =
      item.linearMeters > 0
        ? item.linearMeters
        : ((item.heightMm || 0) / 1000) * (item.copies || 1);
    return sum + ml;
  }, 0);

  const speed = station?.printSpeedPerHour || 10;
  const rawHours = speed > 0 ? totalLinearMeters / speed : 0;
  const displayTime = formatHoursAndMinutes(rawHours);

  const compatibleStationsForBulk = useMemo(() => {
    if (!selectedIds || selectedIds.length === 0) return stations || [];
    const selectedItems = items.filter((i: any) =>
      selectedIds.includes(i.id),
    );
    if (selectedItems.length === 0) return stations || [];
    return (
      stations?.filter((st: any) =>
        selectedItems.every((item: any) =>
          st.materials?.some((m: any) => m.id === item.materialId),
        ),
      ) || []
    );
  }, [stations, selectedIds, items]);

  const isUnassigned = station === null;

  return (
    <div
      className={`flex flex-col w-[350px] rounded-xl border h-full max-h-full overflow-hidden shrink-0 shadow-sm relative ${
        isPackager
          ? "bg-purple-50/30 border-purple-200"
          : "bg-slate-100/50 border-slate-200"
      }`}
    >
      <div
        className={`p-4 border-b rounded-t-xl shrink-0 shadow-sm sticky top-0 z-20 ${
          isPackager
            ? "bg-purple-50 border-purple-200"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {isPackager ? (
              <Package className="w-5 h-5 text-purple-600" />
            ) : station?.isFinishingStation ? (
              <Scissors className="w-5 h-5 text-amber-500" />
            ) : (
              <Printer className="w-5 h-5 text-blue-500" />
            )}
            <h3
              className={`font-bold text-base ${isPackager ? "text-purple-900" : "text-slate-800"}`}
            >
              {title}
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full border ${
              isPackager
                ? "bg-purple-100 text-purple-800 border-purple-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {items.length} trab.
          </span>
        </div>

        {station && !isPackager ? (
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              {displayTime}
            </div>
            {!station.isFinishingStation && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 shadow-sm">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {totalLinearMeters.toFixed(1)} ML
              </div>
            )}
          </div>
        ) : station && isPackager ? (
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100/50 px-2.5 py-1.5 rounded-md border border-purple-200 shadow-sm w-full justify-center">
              <Box className="w-3.5 h-3.5" />
              Bandeja Global de Armado
            </div>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Requieren asignación urgente
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="h-7 text-xs bg-white border-slate-200 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="bg-white w-[var(--radix-select-trigger-width)]"
                >
                  <SelectItem value="promisedDate" className="text-xs">
                    F. Entrega
                  </SelectItem>
                  <SelectItem value="orderNumber" className="text-xs">
                    N° Orden
                  </SelectItem>
                  <SelectItem value="createdAt" className="text-xs">
                    F. Creación
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 overflow-y-auto flex-1 space-y-3 z-10">
        {items.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center text-sm py-10 italic border-2 border-dashed rounded-lg ${
              isPackager
                ? "text-purple-400 border-purple-200 bg-purple-50/50"
                : "text-slate-400 border-slate-200 bg-slate-50/50"
            }`}
          >
            <CheckCircle2
              className={`w-8 h-8 mb-2 ${isPackager ? "text-purple-300" : "text-slate-300"}`}
            />
            {isPackager ? "No hay trabajos listos" : "Máquina libre"}
          </div>
        ) : (
          items.map((item: any) => {
            const itemML =
              item.linearMeters > 0
                ? item.linearMeters
                : ((item.heightMm || 0) / 1000) * (item.copies || 1);

            if (isUnassigned && onToggleSelect) {
              const canSelect = canSelectItem ? canSelectItem(item) : true;
              const isSelected = selectedIds?.includes(item.id) || false;
              return (
                <div key={item.id} className="relative">
                  <div
                    className={`absolute top-2 right-2 z-20 cursor-pointer transition-colors ${
                      !canSelect
                        ? "opacity-30 cursor-not-allowed"
                        : "text-slate-300 hover:text-blue-500"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canSelect) {
                        onToggleSelect(item.id);
                        setTargetStationId("");
                      }
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Square className="w-6 h-6" />
                    )}
                  </div>
                  <JobCard
                    item={item}
                    itemML={itemML}
                    stations={stations}
                    getMaterialName={getMaterialName}
                    onUpdate={onUpdate}
                    onOpenDetails={onOpenDetails}
                    allPendingItems={allPendingItems}
                    selectionMode={true}
                    isSelected={isSelected}
                    canSelect={canSelect}
                    onToggleSelect={() => {
                      if (canSelect) {
                        onToggleSelect(item.id);
                        setTargetStationId("");
                      }
                    }}
                  />
                </div>
              );
            }

            return (
              <JobCard
                key={item.id}
                item={item}
                itemML={itemML}
                stations={stations}
                getMaterialName={getMaterialName}
                onUpdate={onUpdate}
                onOpenDetails={onOpenDetails}
                allPendingItems={allPendingItems}
              />
            );
          })
        )}
      </div>

      {isUnassigned && selectedIds?.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 border-t border-blue-200 bg-blue-50 p-3 flex flex-col gap-2 shadow-lg z-20">
          <span className="text-xs font-bold text-blue-900">
            {selectedIds.length} seleccionados
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={targetStationId ? String(targetStationId) : ""}
              onValueChange={(val) => setTargetStationId(Number(val))}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200 flex-1">
                <SelectValue placeholder="Elegir máquina..." />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="bg-white w-[var(--radix-select-trigger-width)]"
              >
                {compatibleStationsForBulk.map((st: any) => (
                  <SelectItem
                    key={st.id}
                    value={String(st.id)}
                    className="text-xs"
                  >
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!targetStationId || isBulkAssigning}
              onClick={() => {
                if (targetStationId && onBulkAssign) {
                  onBulkAssign(Number(targetStationId));
                  setTargetStationId("");
                }
              }}
              className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              {isBulkAssigning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              Asignar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
