// src/pages/OrdenesPage.tsx
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useOrdersPage } from "@/hooks/useOrdersPage";
import { updateOrder } from "@/services/orderService";
import { OrdersToolbar } from "@/components/OrdersToolbar";
import { OrdersTable } from "@/components/OrdersTable";
import { Button } from "@/components/ui/button";

import { OrderFormModal } from "@/components/OrderFormModal";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { OrderLogsModal } from "@/components/OrderLogsModal";

export const OrdenesPage = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<any | null>(null);
  const [orderLogsToView, setOrderLogsToView] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const {
    orders,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    toggleStatus,
    paymentFilter,
    setPaymentFilter,
    getActiveFiltersCount,
  } = useOrdersPage();

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const visibleOrders = orders.filter(
    (o: any) => o.status !== "CANCELADO",
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = visibleOrders.every((o: any) =>
        prev.includes(o.id),
      );
      if (allSelected) {
        return prev.filter(
          (id) => !visibleOrders.some((o: any) => o.id === id),
        );
      }
      const newIds = visibleOrders
        .filter((o: any) => !prev.includes(o.id))
        .map((o: any) => o.id);
      return [...prev, ...newIds];
    });
  }, [visibleOrders]);

  const cancelMut = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(
        ids.map((id) => updateOrder(id, { status: "CANCELADO" })),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-production"] });
      toast.success(`${selectedIds.length} órdenes canceladas correctamente`);
      setSelectedIds([]);
    },
    onError: () => {
      toast.error("Error al cancelar las órdenes");
    },
  });

  const handleBulkCancel = () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `¿Estás seguro de cancelar ${selectedIds.length} órdenes?`,
    );
    if (confirmed) cancelMut.mutate(selectedIds);
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Registro de Órdenes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administración de pedidos, facturación y estados.
          </p>
        </div>

        <OrdersToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          toggleStatus={toggleStatus}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          activeFiltersCount={getActiveFiltersCount()}
          onNewOrder={() => {
            setIsCreateOpen(true);
          }}
        />
      </div>

      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col relative">
        <div className="overflow-y-auto flex-1">
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onViewLogs={setOrderLogsToView}
            onEdit={(order) => {
              setOrderToEdit(order);
              setIsEditOpen(true);
            }}
            onViewDetails={setSelectedOrder}
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 border-t border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-between shadow-lg z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="text-slate-500 hover:text-slate-700 transition-colors"
                title="Limpiar selección"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-blue-900">
                {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "orden seleccionada" : "órdenes seleccionadas"}
              </span>
            </div>
            <Button
              onClick={handleBulkCancel}
              disabled={cancelMut.isPending}
              variant="outline"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 shadow-sm"
            >
              {cancelMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-1" />
              )}
              {cancelMut.isPending
                ? "Cancelando..."
                : "Cancelar Seleccionados"}
            </Button>
          </div>
        )}
      </div>

      {/* Modal de crear orden — instancia separada, con persistencia localStorage */}
      <OrderFormModal
        isOpen={isCreateOpen}
        storageKey="order-create-draft"
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Modal de editar orden — instancia separada */}
      <OrderFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setOrderToEdit(null);
        }}
        orderToEdit={orderToEdit}
      />

      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        stations={[]}
      />
      <OrderLogsModal
        isOpen={!!orderLogsToView}
        onClose={() => setOrderLogsToView(null)}
        order={orderLogsToView}
      />
    </div>
  );
};
