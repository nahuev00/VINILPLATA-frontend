// src/pages/ProduccionPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Printer, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { updateOrderItem, updateOrder } from "@/services/orderService";
import { getStations } from "@/services/stationService";
import { getMaterials } from "@/services/materialService";
import { useRealtimeOrders } from "@/hooks/useRealTimeOrders";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderItemDetailsModal } from "@/components/OrderItemDetailsModal";
import { OrderFormModal } from "@/components/OrderFormModal";
import { StationColumn } from "@/components/StationColumn";
import { ShippingColumn } from "@/components/ShippingColumn";

export const ProduccionPage = () => {
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [searchStation, setSearchStation] = useState("");
  const [hideEmptyStations, setHideEmptyStations] = useState(false);
  const [stationTypeFilter, setStationTypeFilter] = useState<
    "ALL" | "PRINT" | "FINISH"
  >("ALL");

  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ["stations-list"],
    queryFn: getStations,
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  // Reemplazamos 15 líneas de lógica de socket por 1 sola llamada
  const { data: ordersRes, isLoading: loadingOrders } =
    useRealtimeOrders("orders-production");

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

  // 👇 OPTIMIZACIÓN: Memoizamos el cálculo de las listas de ítems 👇
  const { pendingItems, unassignedItems, packagingItems, shippingOrders } =
    useMemo(() => {
      const allOrders = ordersRes?.data || [];
      const allItems = allOrders.flatMap((order: any) =>
        order.items.map((item: any) => ({ ...item, order })),
      );

      const pending = allItems.filter((item: any) =>
        ["PREIMPRESION", "EN_COLA", "IMPRIMIENDO", "TERMINACIONES"].includes(
          item.status,
        ),
      );

      return {
        pendingItems: pending,
        unassignedItems: pending.filter((item: any) => !item.assignedToId),
        packagingItems: allItems.filter(
          (item: any) => item.status === "REALIZADO",
        ),
        shippingOrders: allOrders.filter(
          (order: any) => order.status === "TERMINADO",
        ),
      };
    }, [ordersRes]);

  // 👇 OPTIMIZACIÓN: Memoizamos el filtrado de las estaciones 👇
  const {
    baseProductionStations,
    packagerStations,
    shipperStations,
    filteredProductionStations,
  } = useMemo(() => {
    const base = stations?.filter((s: any) => s.role === "STATION") || [];
    const packagers = stations?.filter((s: any) => s.role === "PACKAGER") || [];
    const shippers = stations?.filter((s: any) => s.role === "SHIPPER") || [];

    const filtered = base.filter((station: any) => {
      if (
        searchStation &&
        !station.name.toLowerCase().includes(searchStation.toLowerCase())
      )
        return false;
      if (stationTypeFilter === "PRINT" && station.isFinishingStation)
        return false;
      if (stationTypeFilter === "FINISH" && !station.isFinishingStation)
        return false;
      if (hideEmptyStations) {
        const stationItems = pendingItems.filter(
          (item: any) => item.assignedToId === station.id,
        );
        if (stationItems.length === 0) return false;
      }
      return true;
    });

    return {
      baseProductionStations: base,
      packagerStations: packagers,
      shipperStations: shippers,
      filteredProductionStations: filtered,
    };
  }, [
    stations,
    searchStation,
    stationTypeFilter,
    hideEmptyStations,
    pendingItems,
  ]);

  const getMaterialName = (id: number) =>
    materials?.find((m: any) => m.id === id)?.name || "Desconocido";

  if (loadingStations || loadingOrders)
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <span className="font-medium">Cargando tablero de producción...</span>
      </div>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
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

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar estación..."
              value={searchStation}
              onChange={(e) => setSearchStation(e.target.value)}
              className="pl-9 h-9 bg-slate-50 text-sm"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setStationTypeFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${stationTypeFilter === "ALL" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Todas
            </button>
            <button
              onClick={() => setStationTypeFilter("PRINT")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${stationTypeFilter === "PRINT" ? "bg-blue-100 text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Impresión
            </button>
            <button
              onClick={() => setStationTypeFilter("FINISH")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${stationTypeFilter === "FINISH" ? "bg-amber-100 text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Corte
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="checkbox"
            id="hideEmpty"
            checked={hideEmptyStations}
            onChange={(e) => setHideEmptyStations(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="hideEmpty"
            className="text-sm font-bold text-slate-600 cursor-pointer select-none"
          >
            Ocultar estaciones vacías
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full items-start">
          <StationColumn
            title="Sin Asignar / En Espera"
            items={unassignedItems}
            station={null}
            materials={materials}
            stations={baseProductionStations}
            getMaterialName={getMaterialName}
            onUpdate={(id: number, data: any) =>
              updateItemMut.mutate({ id, data })
            }
            onOpenDetails={setSelectedItem}
            allPendingItems={pendingItems}
          />

          {filteredProductionStations.map((station: any) => {
            const stationItems = pendingItems.filter(
              (item: any) => item.assignedToId === station.id,
            );
            return (
              <StationColumn
                key={station.id}
                title={station.name}
                items={stationItems}
                station={station}
                materials={materials}
                stations={baseProductionStations}
                getMaterialName={getMaterialName}
                onUpdate={(id: number, data: any) =>
                  updateItemMut.mutate({ id, data })
                }
                onOpenDetails={setSelectedItem}
                allPendingItems={pendingItems}
              />
            );
          })}

          {packagerStations.length > 0 && (
            <div className="pl-6 border-l border-slate-200/60 ml-2 h-full flex gap-6">
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
                stations={baseProductionStations}
                getMaterialName={getMaterialName}
                onUpdate={(id: number, data: any) =>
                  updateItemMut.mutate({ id, data })
                }
                onOpenDetails={setSelectedItem}
                allPendingItems={pendingItems}
              />
            </div>
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

      <OrderItemDetailsModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        getMaterialName={getMaterialName}
        stations={baseProductionStations}
      />

      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};
