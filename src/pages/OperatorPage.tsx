// src/pages/OperadoresPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Users, HardHat } from "lucide-react";
import { toast } from "sonner";

import {
  getOperators,
  createOperator,
  type Operator,
} from "@/services/operatorService";

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

// --- 1. ESQUEMA DE VALIDACIÓN CON ZOD ---
const operatorSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

type OperatorFormValues = z.infer<typeof operatorSchema>;

// --- 2. COMPONENTE PRINCIPAL (PÁGINA) ---
export const OperadoresPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: operators,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["operators"],
    queryFn: getOperators,
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar la base de datos de operarios.
      </div>
    );

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HardHat className="w-6 h-6 text-blue-600" />
          Gestión de Operarios
        </h1>
        <Button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Operario
        </Button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[100px] font-bold text-slate-700">
                  ID
                </TableHead>
                <TableHead className="font-bold text-slate-700">
                  Nombre del Operario
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-32 text-center text-slate-500"
                  >
                    Cargando operarios...
                  </TableCell>
                </TableRow>
              ) : !operators || operators.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-64 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="h-12 w-12 text-slate-300" />
                      <p className="text-lg font-bold text-slate-700">
                        No hay operarios registrados
                      </p>
                      <p className="text-sm text-slate-500">
                        Crea operarios para poder asignarles trabajos en las
                        máquinas.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                operators.map((op) => (
                  <TableRow
                    key={op.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="font-bold text-slate-500">
                      #{op.id}
                    </TableCell>
                    <TableCell className="font-black text-slate-800">
                      {op.name}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <OperatorFormModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

// --- 3. COMPONENTE DEL FORMULARIO MODAL ---
interface OperatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OperatorFormModal = ({ isOpen, onClose }: OperatorFormModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OperatorFormValues>({
    resolver: zodResolver(operatorSchema),
    defaultValues: { name: "" },
  });

  const createMut = useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      toast.success("Operario creado con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al crear el operario"),
  });

  const onSubmit = (data: OperatorFormValues) => {
    createMut.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-slate-200 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-blue-600" />
            Nuevo Operario
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nombre Completo
            </label>
            <Input
              {...register("name")}
              placeholder="Ej: Juan Pérez"
              className={`h-11 bg-slate-50 border-slate-300 focus-visible:ring-blue-500 ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <span className="text-xs font-bold text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] font-bold shadow-sm"
            >
              {createMut.isPending ? "Guardando..." : "Guardar Operario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
