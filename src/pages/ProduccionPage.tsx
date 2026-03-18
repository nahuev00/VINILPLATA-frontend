// src/pages/ProduccionPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Printer,
  CheckCircle2,
  ArrowRightLeft,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react"; // <-- Agregamos Loader2
import { toast } from "sonner";

import { getOrders, updateOrderItem } from "@/services/orderService";
import { getStations } from "@/services/stationService";
import { getMaterials } from "@/services/materialService";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OrderItemDetailsModal } from "@/components/OrderItemDetailsModal";

export const ProduccionPage = () => {
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ["stations-list"],
    queryFn: getStations,
  });

  const { data: ordersRes, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-production"],
    queryFn: () => getOrders({ page: 1, limit: 100 }),
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateOrderItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-production"] });
      toast.success("Trabajo reasignado");
    },
    onError: () => toast.error("Error al actualizar el trabajo"),
  });

  if (loadingStations || loadingOrders)
    return (
      <div className="p-8 text-center text-slate-500">
        Cargando tablero de producción...
      </div>
    );

  const allItems =
    ordersRes?.data.flatMap((order) =>
      order.items.map((item) => ({ ...item, order })),
    ) || [];

  // 👇 AHORA INCLUIMOS EL ESTADO "IMPRIMIENDO" EN EL TABLERO
  const pendingItems = allItems.filter((item) =>
    ["PREIMPRESION", "EN_COLA", "IMPRIMIENDO"].includes(item.status),
  );

  const unassignedItems = pendingItems.filter((item) => !item.assignedToId);

  const getMaterialName = (id: number) =>
    materials?.find((m) => m.id === id)?.name || "Desconocido";

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Printer className="w-6 h-6 text-blue-600" /> Tablero de Producción
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestión de colas de impresión y asignación de máquinas.
        </p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full items-start">
          <StationColumn
            title="Sin Asignar / En Espera"
            items={unassignedItems}
            station={null}
            materials={materials}
            stations={stations}
            getMaterialName={getMaterialName}
            onUpdate={(id, data) => updateMut.mutate({ id, data })}
            onOpenDetails={setSelectedItem}
          />

          {stations?.map((station) => {
            const stationItems = pendingItems.filter(
              (item) => item.assignedToId === station.id,
            );
            return (
              <StationColumn
                key={station.id}
                title={station.name}
                items={stationItems}
                station={station}
                materials={materials}
                stations={stations}
                getMaterialName={getMaterialName}
                onUpdate={(id, data) => updateMut.mutate({ id, data })}
                onOpenDetails={setSelectedItem}
              />
            );
          })}
        </div>
      </div>

      <OrderItemDetailsModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        getMaterialName={getMaterialName}
        stations={stations || []}
      />
    </div>
  );
};

// ==========================================
// SUBCOMPONENTE: COLUMNA DE ESTACIÓN CON MATEMÁTICA EN VIVO
// ==========================================
const StationColumn = ({
  title,
  items,
  station,
  stations,
  getMaterialName,
  onUpdate,
  onOpenDetails,
}: any) => {
  const totalLinearMeters = items.reduce((sum: number, item: any) => {
    const ml =
      item.linearMeters > 0
        ? item.linearMeters
        : ((item.heightMm || 0) / 1000) * (item.copies || 1);
    return sum + ml;
  }, 0);

  const speed = station?.printSpeedPerHour || 10;
  const estimatedHours = (totalLinearMeters / speed).toFixed(1);

  return (
    <div className="flex flex-col w-[350px] bg-slate-100/50 rounded-xl border border-slate-200 h-full max-h-full overflow-hidden shrink-0 shadow-sm relative">
      <div className="p-4 bg-white border-b border-slate-200 rounded-t-xl shrink-0 shadow-sm sticky top-0 z-20">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full border border-slate-200">
            {items.length} trab.
          </span>
        </div>

        {station ? (
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              {estimatedHours} Hrs
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 shadow-sm">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              {totalLinearMeters.toFixed(1)} ML
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-2">
            <AlertCircle className="w-3.5 h-3.5" /> Requieren asignación urgente
          </div>
        )}
      </div>

      <div className="p-3 overflow-y-auto flex-1 space-y-3 z-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-sm text-slate-400 py-10 italic border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2" />
            Máquina libre
          </div>
        ) : (
          items.map((item: any) => {
            const itemML =
              item.linearMeters > 0
                ? item.linearMeters
                : ((item.heightMm || 0) / 1000) * (item.copies || 1);

            return (
              <JobCard
                key={item.id}
                item={item}
                itemML={itemML}
                stations={stations}
                getMaterialName={getMaterialName}
                onUpdate={onUpdate}
                onOpenDetails={onOpenDetails}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

// ==========================================
// SUBCOMPONENTE: TARJETA DE TRABAJO (ITEM)
// ==========================================
const JobCard = ({
  item,
  itemML,
  stations,
  getMaterialName,
  onUpdate,
  onOpenDetails,
}: any) => {
  const compatibleStations =
    stations?.filter((st: any) =>
      st.materials?.some((m: any) => m.id === item.materialId),
    ) || [];

  // 👇 Verificamos si está actualmente imprimiendo
  const isPrinting = item.status === "IMPRIMIENDO";

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm p-3 transition-all relative ${
        isPrinting
          ? "border-blue-400 shadow-blue-100 ring-1 ring-blue-400 ring-offset-1"
          : "border-slate-200 hover:shadow-md hover:border-blue-300"
      }`}
    >
      <div className="cursor-pointer" onClick={() => onOpenDetails(item)}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-600 hover:underline">
              {item.order.orderNumber}
            </span>
            <span
              className="text-sm font-bold text-slate-900 truncate w-[220px]"
              title={item.order.client.name}
            >
              {item.order.client.name}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-2 rounded border border-slate-100 mb-3 relative z-0 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span
              className="text-xs font-medium text-slate-700 truncate"
              title={item.fileName || "Sin archivo"}
            >
              {item.fileName || "Sin archivo"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              {getMaterialName(item.materialId)}
            </span>
            <span className="font-mono text-slate-600 bg-white px-1 border border-slate-200 rounded">
              {item.widthMm}x{item.heightMm}{" "}
              <span className="text-slate-400">({item.copies}u)</span>
            </span>
          </div>
          <div className="mt-2 flex justify-end">
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded">
              Largo: {itemML.toFixed(2)} ML
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 relative z-10">
        {/* 👇 CONDICIONAL: Si está imprimiendo, bloqueamos acciones. Si no, mostramos Reasignar 👇 */}
        {isPrinting ? (
          <div className="flex items-center gap-2 text-blue-700 font-bold text-[11px] bg-blue-50 px-3 py-1.5 rounded-md w-full justify-center border border-blue-200 shadow-inner">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            IMPRIMIENDO...
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              {/* Ocupamos todo el ancho (w-full) ya que quitamos el botón de imprimir */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2 font-medium text-slate-700 bg-white hover:bg-slate-50 border-slate-300 shadow-sm w-full"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" /> Reasignar
                Trabajo
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-56 p-2 bg-white shadow-2xl border border-slate-200 z-50 rounded-lg"
              align="start"
            >
              <span className="text-xs font-bold text-slate-500 mb-2.5 block uppercase tracking-wider pl-1">
                Reasignar a:
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
                  Dejar en Espera
                </Button>
                <div className="h-px bg-slate-100 my-0.5"></div>

                {compatibleStations.length > 0 ? (
                  compatibleStations.map((st: any) => (
                    <Button
                      key={st.id}
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 border border-transparent"
                      onClick={() =>
                        onUpdate(item.id, {
                          assignedToId: st.id,
                          status: "EN_COLA",
                        })
                      }
                    >
                      {st.name}{" "}
                      <span className="ml-auto text-[10px] text-slate-400 font-mono bg-slate-100 px-1 py-0.5 rounded">
                        {st.printSpeedPerHour} ML/h
                      </span>
                    </Button>
                  ))
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
