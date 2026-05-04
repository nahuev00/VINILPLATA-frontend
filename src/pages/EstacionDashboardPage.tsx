// src/pages/EstacionDashboardPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Printer, LogOut, Layers, Loader2, Scissors } from "lucide-react";
import { toast } from "sonner";

import { updateOrderItem } from "@/services/orderService";
import { getMaterials } from "@/services/materialService";
import { getStations } from "@/services/stationService";
import { getOperators } from "@/services/operatorService";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeOrders } from "@/hooks/useRealTimeOrders";

import { Button } from "@/components/ui/button";
import { OperatorJobCard } from "@/components/OperatorJobCard";

export const EstacionDashboardPage = () => {
  const { user, logoutUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [globalOperatorId, setGlobalOperatorId] = useState<number | "">("");

  const { data: ordersRes, isLoading: loadingOrders } = useRealtimeOrders(
    "orders-station",
    user?.id,
  );
  const { data: operators } = useQuery({
    queryKey: ["operators"],
    queryFn: getOperators,
  });
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });
  const { data: stations } = useQuery({
    queryKey: ["stations-list"],
    queryFn: getStations,
  });

  // 👇 LA MAGIA ESTÁ AQUÍ 👇
  // Buscamos la estación actual en la lista usando el ID del usuario logueado
  const currentStation = stations?.find((st: any) => st.id === user?.id);
  const isFinishingStation = currentStation?.isFinishingStation || false;
  const activeStatus = isFinishingStation ? "TERMINACIONES" : "IMPRIMIENDO";

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateOrderItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-station"] });
      toast.success("Estado actualizado correctamente");
    },
    onError: () => toast.error("Error al actualizar el trabajo"),
  });

  const updateBulkMut = useMutation({
    mutationFn: async ({ ids, status, operatorId, stationId }: any) => {
      const promises = ids.map((id: number) =>
        updateOrderItem(id, { status, operatorId, stationId }),
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-station"] });
      toast.success(`${selectedIds.length} trabajos iniciados`);
      setSelectedIds([]);
      setGlobalOperatorId("");
    },
    onError: () => toast.error("Error al iniciar los trabajos"),
  });

  const { enColaItems, activosItems } = useMemo(() => {
    const allItems =
      ordersRes?.data.flatMap((order: any) =>
        order.items.map((item: any) => ({ ...item, order })),
      ) || [];

    const myItems = allItems.filter(
      (item: any) => item.assignedToId === user?.id,
    );

    return {
      enColaItems: myItems.filter((item: any) => item.status === "EN_COLA"),
      activosItems: myItems.filter(
        (item: any) =>
          item.status === "IMPRIMIENDO" || item.status === "TERMINACIONES",
      ),
    };
  }, [ordersRes, user?.id]);

  const getMaterialName = (id: number) =>
    materials?.find((m: any) => m.id === id)?.name || "Desconocido";

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkStart = () => {
    if (selectedIds.length > 0 && globalOperatorId !== "") {
      updateBulkMut.mutate({
        ids: selectedIds,
        status: activeStatus,
        operatorId: Number(globalOperatorId),
        stationId: user?.id,
      });
    }
  };

  const handleFinish = (itemId: number, nextStationId: number | null) => {
    updateMut.mutate({
      id: itemId,
      data: nextStationId
        ? {
            status: "EN_COLA",
            assignedToId: nextStationId,
            stationId: user?.id,
          }
        : { status: "REALIZADO", assignedToId: null, stationId: user?.id },
    });
  };

  if (loadingOrders)
    return (
      <div className="p-8 text-center text-slate-500 font-medium text-lg">
        Iniciando sistema de máquina...
      </div>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-wide">
            {isFinishingStation ? (
              <Scissors className="w-8 h-8 text-amber-400" />
            ) : (
              <Printer className="w-8 h-8 text-blue-400" />
            )}
            {user?.name.toUpperCase()}
          </h1>
          <p className="text-slate-400 font-medium mt-1">
            {isFinishingStation
              ? "Panel de Terminación / Post-Proceso"
              : "Panel de Control de Impresión"}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right border-r border-slate-700 pr-6 hidden sm:block">
            <span className="block text-3xl font-black text-blue-400">
              {enColaItems.length}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              En Cola
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={logoutUser}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-auto py-2 px-3 transition-colors"
          >
            <LogOut className="w-6 h-6 sm:mr-2" />{" "}
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden pb-4">
        {/* COLUMNA 1: EN COLA */}
        <div className="flex flex-col bg-slate-200/50 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner relative">
          <div className="bg-slate-200 p-4 border-b border-slate-300 shrink-0 z-10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-700 uppercase tracking-wider">
              Esperando Turno
            </h2>
            <span className="bg-white text-slate-600 font-bold px-3 py-1 rounded-full text-sm shadow-sm">
              {enColaItems.length}
            </span>
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-blue-600 text-white p-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md animate-in slide-in-from-top-2 shrink-0 z-10">
              <div className="flex items-center gap-2 font-bold w-full sm:w-auto">
                <Layers className="w-5 h-5 shrink-0" />
                <span>{selectedIds.length} seleccionados</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <select
                    className="w-full h-10 pl-3 pr-8 rounded-md bg-blue-700 border-blue-500 text-white text-sm font-medium focus:ring-white focus:border-white appearance-none cursor-pointer"
                    value={globalOperatorId}
                    onChange={(e) =>
                      setGlobalOperatorId(Number(e.target.value))
                    }
                  >
                    <option
                      value=""
                      disabled
                      className="bg-white text-slate-700"
                    >
                      Seleccionar Operario
                    </option>
                    {operators?.map((op: any) => (
                      <option
                        key={op.id}
                        value={op.id}
                        className="bg-white text-slate-900"
                      >
                        {op.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleBulkStart}
                  disabled={updateBulkMut.isPending || globalOperatorId === ""}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-black shadow-sm shrink-0 disabled:opacity-50"
                >
                  {updateBulkMut.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Play className="w-5 h-5 mr-2 fill-current" />
                  )}
                  INICIAR
                </Button>
              </div>
            </div>
          )}

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {enColaItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No hay trabajos pendientes.
              </div>
            ) : (
              enColaItems.map((item: any) => (
                <OperatorJobCard
                  key={item.id}
                  item={item}
                  getMaterialName={getMaterialName}
                  onAction={(operatorId: number) =>
                    updateMut.mutate({
                      id: item.id,
                      data: {
                        status: activeStatus,
                        operatorId,
                        stationId: user?.id,
                      },
                    })
                  }
                  actionType="START"
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  isBulkModeActive={selectedIds.length > 0}
                  stations={stations}
                  userId={user?.id}
                  isFinishing={isFinishingStation}
                  operators={operators}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 2: ACTIVOS */}
        <div className="flex flex-col bg-blue-50/50 rounded-2xl border-2 border-blue-200 overflow-hidden shadow-inner">
          <div className="bg-blue-600 p-4 border-b border-blue-700 shadow-sm shrink-0 z-10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              En Proceso
            </h2>
            <span className="bg-blue-800/50 text-white font-bold px-3 py-1 rounded-full text-sm">
              {activosItems.length}
            </span>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {activosItems.length === 0 ? (
              <div className="text-center py-12 text-blue-300 font-medium">
                La máquina está detenida.
              </div>
            ) : (
              activosItems.map((item: any) => (
                <OperatorJobCard
                  key={item.id}
                  item={item}
                  getMaterialName={getMaterialName}
                  onAction={(nextStationId: number | null) =>
                    handleFinish(item.id, nextStationId)
                  }
                  actionType="FINISH"
                  stations={stations}
                  userId={user?.id}
                  isFinishing={isFinishingStation}
                  operators={operators}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
