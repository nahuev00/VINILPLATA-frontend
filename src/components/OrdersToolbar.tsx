// src/components/OrdersToolbar.tsx
import { Filter, Check, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_STATUSES, type PaymentFilter } from "@/hooks/useOrdersPage";

interface OrdersToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string[];
  setStatusFilter: (statuses: string[]) => void;
  toggleStatus: (status: string) => void;
  paymentFilter: PaymentFilter;
  setPaymentFilter: (filter: PaymentFilter) => void;
  activeFiltersCount: number;
  onNewOrder: () => void;
}

export const OrdersToolbar = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  toggleStatus,
  paymentFilter,
  setPaymentFilter,
  activeFiltersCount,
  onNewOrder,
}: OrdersToolbarProps) => {
  return (
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`relative bg-white border-slate-200 hover:bg-slate-50 ${
              activeFiltersCount > 0
                ? "border-blue-300 bg-blue-50/50 text-blue-700"
                : "text-slate-600"
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-4 bg-white shadow-xl border-slate-200"
          align="end"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800">Filtros Avanzados</h4>
              <button
                onClick={() => {
                  setStatusFilter(ALL_STATUSES);
                  setPaymentFilter("ALL");
                }}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                Limpiar todo
              </button>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Estado de la Orden
              </h5>
              <div className="space-y-2">
                {ALL_STATUSES.map((status) => (
                  <div
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        statusFilter.includes(status)
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-slate-300 group-hover:border-blue-400"
                      }`}
                    >
                      {statusFilter.includes(status) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm text-slate-700 font-medium select-none">
                      {status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pt-2 border-t border-slate-100">
                Estado de Cobro
              </h5>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setPaymentFilter("ALL")}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${paymentFilter === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setPaymentFilter("PAID")}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${paymentFilter === "PAID" ? "bg-teal-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Pagos
                </button>
                <button
                  onClick={() => setPaymentFilter("UNPAID")}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${paymentFilter === "UNPAID" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Impagos
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="relative w-full sm:w-64">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar cliente u orden..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>
      <Button
        onClick={onNewOrder}
        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
      >
        <Plus className="w-4 h-4 mr-2" /> Nueva Orden
      </Button>
    </div>
  );
};
