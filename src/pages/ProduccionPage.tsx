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
  Scissors,
  Package,
  Box,
  Truck,
  MapPin,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import {
  getOrders,
  updateOrderItem,
  updateOrder,
} from "@/services/orderService";
import { getStations } from "@/services/stationService";
import { getMaterials } from "@/services/materialService";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OrderItemDetailsModal } from "@/components/OrderItemDetailsModal";
import { OrderFormModal } from "@/components/OrderFormModal"; // 👈 IMPORTAMOS EL MODAL

export const ProduccionPage = () => {
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false); // 👈 ESTADO DEL MODAL

  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ["stations-list"],
    queryFn: getStations,
  });

  const { data: ordersRes, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-production"],
    queryFn: () => getOrders({ page: 1, limit: 100 }),
    refetchInterval: 15000,
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const updateItemMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateOrderItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-production"] });
      toast.success("Trabajo reasignado");
    },
    onError: () => toast.error("Error al actualizar el trabajo"),
  });

  const updateOrderMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-production"] });
      toast.success("¡Orden marcada como ENTREGADA!");
    },
    onError: () => toast.error("Error al actualizar la orden general"),
  });

  if (loadingStations || loadingOrders)
    return (
      <div className="p-8 text-center text-slate-500">
        Cargando tablero de producción...
      </div>
    );

  const allOrders = ordersRes?.data || [];

  const allItems = allOrders.flatMap((order) =>
    order.items.map((item: any) => ({ ...item, order })),
  );

  const pendingItems = allItems.filter((item) =>
    ["PREIMPRESION", "EN_COLA", "IMPRIMIENDO", "TERMINACIONES"].includes(
      item.status,
    ),
  );
  const unassignedItems = pendingItems.filter((item) => !item.assignedToId);

  const packagingItems = allItems.filter((item) => item.status === "REALIZADO");
  const shippingOrders = allOrders.filter(
    (order) => order.status === "TERMINADO",
  );

  const productionStations =
    stations?.filter((s: any) => s.role === "STATION") || [];
  const packagerStations =
    stations?.filter((s: any) => s.role === "PACKAGER") || [];
  const shipperStations =
    stations?.filter((s: any) => s.role === "SHIPPER") || [];

  const getMaterialName = (id: number) =>
    materials?.find((m) => m.id === id)?.name || "Desconocido";

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* 👇 CABECERA CON EL NUEVO BOTÓN 👇 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-6 h-6 text-blue-600" /> Tablero de Producción
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de colas de impresión, empaque y despachos.
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Orden
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full items-start">
          <StationColumn
            title="Sin Asignar / En Espera"
            items={unassignedItems}
            station={null}
            materials={materials}
            stations={productionStations}
            getMaterialName={getMaterialName}
            onUpdate={(id: number, data: any) =>
              updateItemMut.mutate({ id, data })
            }
            onOpenDetails={setSelectedItem}
          />

          {productionStations.map((station: any) => {
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
                stations={productionStations}
                getMaterialName={getMaterialName}
                onUpdate={(id: number, data: any) =>
                  updateItemMut.mutate({ id, data })
                }
                onOpenDetails={setSelectedItem}
              />
            );
          })}

          {packagerStations.length > 0 && (
            <StationColumn
              key="packagers-pool"
              title={
                packagerStations.length === 1
                  ? packagerStations[0].name
                  : "Área de Empaque"
              }
              items={packagingItems}
              station={{ ...packagerStations[0], role: "PACKAGER" }}
              materials={materials}
              stations={productionStations}
              getMaterialName={getMaterialName}
              onUpdate={(id: number, data: any) =>
                updateItemMut.mutate({ id, data })
              }
              onOpenDetails={setSelectedItem}
            />
          )}

          {shipperStations.length > 0 && (
            <ShippingColumn
              title={
                shipperStations.length === 1
                  ? shipperStations[0].name
                  : "Área de Despachos"
              }
              orders={shippingOrders}
              onDeliver={(id: number) =>
                updateOrderMut.mutate({ id, data: { status: "ENTREGADO" } })
              }
            />
          )}
        </div>
      </div>

      {/* MODALES */}
      <OrderItemDetailsModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        getMaterialName={getMaterialName}
        stations={productionStations}
      />

      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};

// ==========================================
// SUBCOMPONENTE: COLUMNA DE DESPACHOS
// ==========================================
const ShippingColumn = ({ title, orders, onDeliver }: any) => {
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
            <ShippingOrderCard
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

// ==========================================
// SUBCOMPONENTE: TARJETA DE ORDEN DE DESPACHO
// ==========================================
const ShippingOrderCard = ({ order, onDeliver }: any) => {
  return (
    <div className="bg-white rounded-lg border-2 border-teal-400 shadow-sm shadow-teal-100/50 p-3 transition-all hover:shadow-md">
      <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
        <div>
          <span className="text-xs font-black text-teal-700">
            {order.orderNumber}
          </span>
          <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">
            {order.client.name}
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

      <div className="mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
          Contenido del paquete ({order.items.length}):
        </p>
        <ul className="text-[11px] text-slate-600 space-y-1.5 bg-white border border-slate-100 rounded p-2 shadow-inner max-h-[80px] overflow-y-auto">
          {order.items.map((item: any) => (
            <li
              key={item.id}
              className="flex gap-1.5 items-center justify-between"
            >
              <div className="flex gap-1.5 items-center truncate">
                <span className="font-black text-slate-700 bg-slate-100 px-1 rounded">
                  {item.copies}x
                </span>
                <span className="truncate">
                  {item.fileName || "Diseño sin nombre"}
                </span>
              </div>
              <span className="text-[8px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                {item.status}
              </span>
            </li>
          ))}
        </ul>
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

// ==========================================
// SUBCOMPONENTE: COLUMNA DE MÁQUINAS / EMPAQUE
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
  const isPackager = station?.role === "PACKAGER";

  const totalLinearMeters = items.reduce((sum: number, item: any) => {
    const ml =
      item.linearMeters > 0
        ? item.linearMeters
        : ((item.heightMm || 0) / 1000) * (item.copies || 1);
    return sum + ml;
  }, 0);

  const speed = station?.printSpeedPerHour || 10;
  const estimatedHours =
    speed > 0 ? (totalLinearMeters / speed).toFixed(1) : "0.0";

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
              {estimatedHours} Hrs
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
          <div className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-2">
            <AlertCircle className="w-3.5 h-3.5" /> Requieren asignación urgente
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

  const isFinishing = item.status === "TERMINACIONES";
  const isPrinting = item.status === "IMPRIMIENDO";
  const isReady = item.status === "REALIZADO";

  const isLocked = isPrinting || isFinishing;

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
        {isLocked ? (
          <div
            className={`flex items-center gap-2 font-bold text-[11px] px-3 py-1.5 rounded-md w-full justify-center border shadow-inner ${
              isFinishing
                ? "text-amber-700 bg-amber-50 border-amber-200"
                : "text-blue-700 bg-blue-50 border-blue-200"
            }`}
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {isFinishing ? "EN TERMINACIÓN..." : "IMPRIMIENDO..."}
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-7 text-[11px] px-2 font-medium w-full shadow-sm ${
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
                  compatibleStations.map((st: any) => (
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
                      <span className="truncate max-w-[120px]">{st.name}</span>

                      <span
                        className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          st.isFinishingStation
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {st.isFinishingStation ? "Corte" : "Impresión"}
                      </span>

                      {st.printSpeedPerHour > 0 && (
                        <span className="ml-auto text-[9px] text-slate-400 font-mono bg-slate-100 px-1 py-0.5 rounded">
                          {st.printSpeedPerHour} ML/h
                        </span>
                      )}
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
