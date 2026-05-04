// src/pages/OrdenesPage.tsx
import { useState } from "react";
import { FileText } from "lucide-react";

import { useOrdersPage } from "@/hooks/useOrdersPage";
import { OrdersToolbar } from "@/components/OrdersToolbar";
import { OrdersTable } from "@/components/OrdersTable";

import { OrderFormModal } from "@/components/OrderFormModal";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { OrderLogsModal } from "@/components/OrderLogsModal";

export const OrdenesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<any | null>(null);
  const [orderLogsToView, setOrderLogsToView] = useState<any | null>(null);

  // Todo el estado pesado está encapsulado aquí:
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
            setOrderToEdit(null);
            setIsFormOpen(true);
          }}
        />
      </div>

      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div className="overflow-y-auto flex-1">
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            onViewLogs={setOrderLogsToView}
            onEdit={(order) => {
              setOrderToEdit(order);
              setIsFormOpen(true);
            }}
            onViewDetails={setSelectedOrder}
          />
        </div>
      </div>

      {/* Modales */}
      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
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
