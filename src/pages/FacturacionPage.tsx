// src/pages/FacturacionPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Receipt, Plus, Edit3, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import {
  getInvoiceTypes,
  createInvoiceType,
  updateInvoiceType,
  deleteInvoiceType,
  type InvoiceType,
} from "@/services/invoiceTypeService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const FacturacionPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<InvoiceType | null>(null);
  const [typeName, setTypeName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invoiceTypes = [], isLoading } = useQuery({
    queryKey: ["invoiceTypes"],
    queryFn: getInvoiceTypes,
  });

  const filteredTypes = invoiceTypes.filter((type) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenModal = (type?: InvoiceType) => {
    if (type) {
      setEditingType(type);
      setTypeName(type.name);
    } else {
      setEditingType(null);
      setTypeName("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    setTypeName("");
  };

  const createMut = useMutation({
    mutationFn: createInvoiceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceTypes"] });
      toast.success("Tipo de facturación creado");
      handleCloseModal();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error al crear el tipo"),
  });

  const updateMut = useMutation({
    mutationFn: updateInvoiceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceTypes"] });
      toast.success("Tipo de facturación actualizado");
      handleCloseModal();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error al actualizar"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteInvoiceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceTypes"] });
      toast.success("Tipo de facturación eliminado");
    },
    onError: (err: any) =>
      toast.error(
        err.response?.data?.message ||
          "Error al eliminar. Es posible que esté en uso en alguna orden.",
      ),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return toast.error("El nombre es obligatorio");

    if (editingType) {
      updateMut.mutate({ id: editingType.id, name: typeName });
    } else {
      createMut.mutate(typeName);
    }
  };

  const handleDelete = (id: number) => {
    if (
      window.confirm("¿Seguro que deseas eliminar este tipo de facturación?")
    ) {
      deleteMut.mutate(id);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* HEADER Y BUSCADOR */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" /> Tipos de Facturación
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los nombres de las facturas disponibles en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo Tipo
          </Button>
        </div>
      </div>

      {/* TABLA */}
      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col max-w-4xl">
        <div className="overflow-y-auto flex-1">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className="font-bold text-slate-700 w-16">
                  ID
                </TableHead>
                <TableHead className="font-bold text-slate-700">
                  Nombre del Tipo
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-right w-24">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center h-32 text-slate-500"
                  >
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center h-32 text-slate-500"
                  >
                    No se encontraron tipos de facturación.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((type) => (
                  <TableRow key={type.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-slate-500 text-xs">
                      {type.id}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-slate-900 uppercase">
                        {type.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(type)}
                          className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {editingType
                ? "Editar Tipo de Facturación"
                : "Nuevo Tipo de Facturación"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Nombre (Ej: Factura A, Remito, etc.)
              </label>
              <Input
                autoFocus
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Nombre de la factura..."
                className="h-10 bg-white uppercase"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createMut.isPending || updateMut.isPending
                  ? "Guardando..."
                  : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
