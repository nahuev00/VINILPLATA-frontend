// src/pages/EstacionDashboardPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  CheckCircle2,
  FileText,
  Printer,
  AlertTriangle,
  Maximize,
  LogOut,
  CheckSquare,
  Square,
  Layers,
  Loader2,
  ArrowRight,
  Scissors,
  HardHat,
} from "lucide-react";
import { toast } from "sonner";

import { getOrders, updateOrderItem } from "@/services/orderService";
import { getMaterials } from "@/services/materialService";
import { getStations } from "@/services/stationService";
import { getOperators } from "@/services/operatorService";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useSocket } from "@/context/SocketContext";

export const EstacionDashboardPage = () => {
  const { user, logoutUser } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [globalOperatorId, setGlobalOperatorId] = useState<number | "">("");

  const activeStatus = user?.isFinishingStation
    ? "TERMINACIONES"
    : "IMPRIMIENDO";

  const { data: ordersRes, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-station", user?.id],
    queryFn: () => getOrders({ page: 1, limit: 100 }),
  });

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

  useEffect(() => {
    if (!socket) return;
    const handleOrdersUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["orders-station"] });
    };
    socket.on("ordersUpdated", handleOrdersUpdate);
    return () => {
      socket.off("ordersUpdated", handleOrdersUpdate);
    };
  }, [socket, queryClient]);

  // 👇 Mutación Individual 👇
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateOrderItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-station"] });
      toast.success("Estado actualizado correctamente");
    },
    onError: () => toast.error("Error al actualizar el trabajo"),
  });

  // 👇 Mutación Múltiple (Bulk) 👇
  const updateBulkMut = useMutation({
    mutationFn: async ({
      ids,
      status,
      operatorId,
      stationId, // 👈 AGREGADO AQUÍ
    }: {
      ids: number[];
      status: string;
      operatorId: number;
      stationId?: number; // 👈 AGREGADO AQUÍ
    }) => {
      const promises = ids.map(
        (id) => updateOrderItem(id, { status, operatorId, stationId }), // 👈 AGREGADO AQUÍ
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

  if (loadingOrders)
    return (
      <div className="p-8 text-center text-slate-500 font-medium text-lg">
        Iniciando sistema de máquina...
      </div>
    );

  const allItems =
    ordersRes?.data.flatMap((order: any) =>
      order.items.map((item: any) => ({ ...item, order })),
    ) || [];

  const myItems = allItems.filter(
    (item: any) => item.assignedToId === user?.id,
  );
  const enColaItems = myItems.filter((item: any) => item.status === "EN_COLA");
  const activosItems = myItems.filter(
    (item: any) =>
      item.status === "IMPRIMIENDO" || item.status === "TERMINACIONES",
  );

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
        stationId: user?.id, // 👈 ENVIAMOS EL ID DE LA MÁQUINA AL BULK
      });
    }
  };

  const handleFinish = (itemId: number, nextStationId: number | null) => {
    if (nextStationId) {
      updateMut.mutate({
        id: itemId,
        data: {
          status: "EN_COLA",
          assignedToId: nextStationId,
          // Al mandarlo a otra máquina, podríamos o no enviar el stationId actual como log,
          // pero dejémoslo simple por ahora: solo registramos quién lo mandó.
          stationId: user?.id,
        },
      });
    } else {
      updateMut.mutate({
        id: itemId,
        data: {
          status: "REALIZADO",
          assignedToId: null,
          stationId: user?.id, // 👈 Para que quede en el log que esta máquina lo terminó
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-wide">
            {user?.isFinishingStation ? (
              <Scissors className="w-8 h-8 text-amber-400" />
            ) : (
              <Printer className="w-8 h-8 text-blue-400" />
            )}
            {user?.name.toUpperCase()}
          </h1>
          <p className="text-slate-400 font-medium mt-1">
            {user?.isFinishingStation
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
                        stationId: user?.id, // 👈 ENVIAMOS EL ID DE LA MÁQUINA INDIVIDUAL
                      },
                    })
                  }
                  actionType="START"
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  isBulkModeActive={selectedIds.length > 0}
                  stations={stations}
                  userId={user?.id}
                  isFinishing={user?.isFinishingStation}
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
                  isFinishing={user?.isFinishingStation}
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

// ==========================================
// TARJETA GIGANTE PARA EL OPERADOR
// ==========================================
const OperatorJobCard = ({
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
}: any) => {
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
            {item.order.client.name}
          </span>
          <span className="text-sm font-bold text-blue-600">
            {item.order.orderNumber}
          </span>
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
                  className="w-full justify-start h-12 mb-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold border border-emerald-300"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> REALIZADO (Mandar a
                  Empaquetado)
                </Button>

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
