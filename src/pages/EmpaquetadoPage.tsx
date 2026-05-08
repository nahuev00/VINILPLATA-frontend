// src/pages/EmpaquetadoPage.tsx
import { useEffect, useState } from "react"; // 👈 Agregamos useState
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  PackageCheck,
  LogOut,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Box,
  Truck,
  Layers,
  Scissors,
  MessageSquare,
  Printer, // 👈 Nuevo icono
  CheckSquare, // 👈 Nuevo icono
  Square, // 👈 Nuevo icono
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf"; // 👈 Importamos jsPDF

import {
  getOrders,
  updateOrderItem,
  updateOrder,
} from "@/services/orderService";
import { getMaterials } from "@/services/materialService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

import { useSocket } from "@/context/SocketContext";

export const EmpaquetadoPage = () => {
  const { user, logoutUser } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // 👇 ESTADO PARA SELECCIÓN DE ETIQUETAS 👇
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  const { data: ordersRes, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-packaging"],
    queryFn: () => getOrders({ page: 1, limit: 100 }),
  });

  useEffect(() => {
    if (!socket) return;
    const handleOrdersUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["orders-packaging"] });
    };
    socket.on("ordersUpdated", handleOrdersUpdate);
    return () => {
      socket.off("ordersUpdated", handleOrdersUpdate);
    };
  }, [socket, queryClient]);

  const { data: materials, isLoading: loadingMaterials } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const updateBulkMut = useMutation({
    mutationFn: async ({ order }: { order: any }) => {
      const itemPromises = order.items.map((item: any) =>
        updateOrderItem(item.id, { status: "EMPAQUETADO" }),
      );
      await Promise.all(itemPromises);
      await updateOrder(order.id, { status: "TERMINADO" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-packaging"] });
      toast.success("¡Orden empaquetada y enviada a Despachos!");
    },
    onError: () => toast.error("Error al empaquetar la orden"),
  });

  const getMaterialName = (id: number) => {
    return materials?.find((m) => m.id === id)?.name || "Material desconocido";
  };

  // 👇 FUNCIÓN MAGA: GENERADOR DE PDF (CON DIRECCIÓN) 👇
  const handlePrintLabels = () => {
    if (selectedOrderIds.length === 0) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [64, 48],
    });

    const ordersToPrint = ordersRes?.data.filter((o: any) =>
      selectedOrderIds.includes(o.id),
    );

    ordersToPrint.forEach((order: any, index: number) => {
      if (index > 0) doc.addPage([64, 48], "landscape");

      // Variable para controlar la posición vertical actual
      let currentY = 6;

      // 1. NÚMERO DE ORDEN
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`ORDEN: ${order.orderNumber}`, 4, currentY);

      currentY += 2;
      doc.setLineWidth(0.4);
      doc.line(4, currentY, 60, currentY); // Línea divisoria

      // 2. NOMBRE DEL CLIENTE (Con salto de línea automático)
      currentY += 5;
      doc.setFontSize(11);
      const clientName = order.client?.name?.toUpperCase() || "SIN NOMBRE";

      const nameLines = doc.splitTextToSize(clientName, 56);
      doc.text(nameLines, 4, currentY);

      // Movemos currentY según cuántas líneas ocupó el nombre
      currentY += nameLines.length * 4.5;

      // 3. LOCALIDAD
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const city = order.city?.name?.toUpperCase() || "SIN LOCALIDAD";
      const cityLines = doc.splitTextToSize(`Loc: ${city}`, 56);
      doc.text(cityLines, 4, currentY);

      // 4. TIPO DE ENVÍO (Sin el recuadro gris)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const carrier = (
        order.carrier?.name ||
        order.shippingType ||
        "A CONVENIR"
      ).toUpperCase();
      // Lo ponemos en la línea 29 para que tenga espacio suficiente
      doc.text(`ENVÍO: ${carrier}`, 4, 29, { maxWidth: 56 });

      // 5. VALORES DE PAGO
      doc.setFontSize(8);
      const cash = (order.cashPayment || 0).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      });
      const elec = (order.electronicPayment || 0).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      });

      doc.text(`EFECTIVO: $${cash}`, 4, 36);
      doc.text(`ELECTRÓNICO: $${elec}`, 4, 41);

      // Footer
      doc.setFontSize(6);
      doc.setFont("helvetica", "italic");
      doc.text(`Imp: ${new Date().toLocaleDateString("es-AR")}`, 4, 46);
      doc.text(`Ítems: ${order.items?.length || 0}`, 48, 46);
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setSelectedOrderIds([]);
  };

  const toggleOrderSelection = (id: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id],
    );
  };

  if (loadingOrders || loadingMaterials)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Cargando módulo de empaquetado...
      </div>
    );

  const allOrders = ordersRes?.data || [];
  const ordersToPackage = allOrders.filter(
    (order: any) =>
      !["TERMINADO", "ENTREGADO", "CANCELADO"].includes(order.status) &&
      order.items.some((item: any) => item.status === "REALIZADO"),
  );

  return (
    <div className="flex flex-col h-screen p-4 sm:p-6 lg:p-8 bg-slate-100 relative">
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-wide">
            <Package className="w-8 h-8 text-purple-400" />
            ÁREA DE EMPAQUE
          </h1>
          <p className="text-slate-400 font-medium mt-1">
            Operador: {user?.name}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right border-r border-slate-700 pr-6 hidden sm:block">
            <span className="block text-3xl font-black text-purple-400">
              {ordersToPackage.length}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Por armar
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={logoutUser}
            className="text-red-400 hover:bg-red-400/10 h-auto py-2 px-3"
          >
            <LogOut className="w-6 h-6 sm:mr-2" />{" "}
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>

      {/* 👇 BARRA FLOTANTE DE IMPRESIÓN 👇 */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-purple-500 p-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center font-black">
              {selectedOrderIds.length}
            </span>
            <span className="font-bold text-slate-700">
              Órdenes seleccionadas
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <Button
            onClick={handlePrintLabels}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black"
          >
            <Printer className="w-5 h-5 mr-2" />
            GENERAR ETIQUETAS PDF
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSelectedOrderIds([])}
            className="text-slate-400 hover:text-slate-600"
          >
            Cancelar
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-24">
        {ordersToPackage.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <PackageCheck className="w-24 h-24 mb-4 text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-500">Todo al día</h2>
            <p>No hay órdenes con ítems finalizados esperando empaque.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ordersToPackage.map((order: any) => (
              <OrderPackageCard
                key={order.id}
                order={order}
                onPack={() => updateBulkMut.mutate({ order })}
                isLoading={updateBulkMut.isPending}
                getMaterialName={getMaterialName}
                isSelected={selectedOrderIds.includes(order.id)} // 👈 Pasamos selección
                onSelect={() => toggleOrderSelection(order.id)} // 👈 Pasamos toggle
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};;;

const OrderPackageCard = ({
  order,
  onPack,
  isLoading,
  getMaterialName,
  isSelected, // 👈 Recibimos props
  onSelect, // 👈 Recibimos props
}: any) => {
  const isReadyToPack = order.items.every((item: any) =>
    ["REALIZADO", "EMPAQUETADO"].includes(item.status),
  );

  const pendingItemsCount = order.items.filter(
    (item: any) => !["REALIZADO", "EMPAQUETADO"].includes(item.status),
  ).length;

  return (
    <div
      className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden flex flex-col transition-all relative ${
        isSelected
          ? "ring-4 ring-blue-500 border-blue-500"
          : isReadyToPack
            ? "border-purple-500"
            : "border-amber-300 opacity-90"
      }`}
    >
      {/* CHECKBOX DE SELECCIÓN */}
      <div
        onClick={onSelect}
        className="absolute top-4 right-4 z-10 cursor-pointer text-slate-300 hover:text-blue-500 transition-colors"
      >
        {isSelected ? (
          <CheckSquare className="w-8 h-8 text-blue-500 fill-blue-50" />
        ) : (
          <Square className="w-8 h-8" />
        )}
      </div>

      <div
        className={`p-5 border-b flex justify-between items-start pr-14 ${isReadyToPack ? "bg-purple-50 border-purple-100" : "bg-amber-50 border-amber-100"}`}
      >
        <div>
          <span className="text-sm font-bold text-slate-500 mb-1 block uppercase tracking-widest">
            ORDEN {order.orderNumber}
          </span>
          <h3 className="text-xl font-black text-slate-900 leading-tight">
            {order.client.name}
          </h3>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-3 bg-slate-50/50">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Contenido de la caja:
        </h4>

        {order.items.map((item: any, index: number) => {
          const isDone = ["REALIZADO", "EMPAQUETADO"].includes(item.status);

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                isDone
                  ? "bg-white border-slate-200 shadow-sm"
                  : "bg-slate-100 border-slate-300 border-dashed"
              }`}
            >
              <div className="shrink-0 pt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-purple-500" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <p
                  className={`text-sm font-black truncate leading-tight ${isDone ? "text-slate-800" : "text-slate-500"}`}
                >
                  {item.copies}x {item.fileName || `Renglón ${index + 1}`}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {item.widthMm}x{item.heightMm}mm
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    <Layers className="w-3 h-3" />
                    {getMaterialName(item.materialId)}
                  </span>
                </div>

                {item.finishing && (
                  <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 p-1.5 rounded text-[11px] text-amber-800">
                    <Scissors className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                    <span className="font-medium leading-tight">
                      <span className="font-bold">Terminación:</span>{" "}
                      {item.finishing}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-600 bg-slate-100 p-2 rounded-md border border-slate-200">
          <Truck className="w-4 h-4 text-blue-500 shrink-0" />
          Envío:{" "}
          <span className="font-bold text-slate-800">
            {order.shippingType || "A convenir"}
          </span>
        </div>

        {isReadyToPack ? (
          <Button
            onClick={onPack}
            disabled={isLoading}
            className="w-full h-16 text-lg font-black bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all"
          >
            <Box className="w-6 h-6 mr-2" />
            CERRAR Y MANDAR A DESPACHO
          </Button>
        ) : (
          <div className="w-full h-16 rounded-md bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold px-4 text-center">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
            <span className="text-sm">
              Faltan {pendingItemsCount} ítems para completar
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
