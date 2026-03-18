// src/pages/RubrosPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Tags } from "lucide-react";
import { toast } from "sonner";

import {
  getCategories,
  createCategory,
  updateCategory,
  type Category,
} from "@/services/categoryService";

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
const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// --- 2. COMPONENTE PRINCIPAL (PÁGINA) ---
export const RubrosPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const handleOpenModal = (category?: Category) => {
    setCategoryToEdit(category || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoryToEdit(null);
  };

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar la base de datos de rubros.
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Rubros</h1>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rubro
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nombre del Rubro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-slate-500"
                >
                  Cargando rubros...
                </TableCell>
              </TableRow>
            ) : !categories || categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Tags className="h-10 w-10 text-slate-300" />
                    <p className="text-base font-medium text-slate-900">
                      No hay rubros registrados
                    </p>
                    <p className="text-sm">
                      Crea rubros como "Agencia", "3D" o "Cartelería".
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-500">
                    {cat.id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {cat.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModal(cat)}
                    >
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={categoryToEdit}
      />
    </div>
  );
};

// --- 3. COMPONENTE DEL FORMULARIO MODAL ---
interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

const CategoryFormModal = ({
  isOpen,
  onClose,
  category,
}: CategoryFormModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: category ? { name: category.name } : { name: "" },
  });

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Rubro creado con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al crear el rubro"),
  });

  const updateMut = useMutation({
    mutationFn: (data: CategoryFormValues) =>
      updateCategory(category!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Rubro actualizado con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al actualizar el rubro"),
  });

  const onSubmit = (data: CategoryFormValues) => {
    if (category) updateMut.mutate(data);
    else createMut.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {category ? "Editar Rubro" : "Nuevo Rubro"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Nombre del Rubro
            </label>
            <Input
              {...register("name")}
              placeholder="Ej: Sublimación, 3D, Agencias..."
              className={`h-11 ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <span className="text-xs font-medium text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-300 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {createMut.isPending || updateMut.isPending
                ? "Guardando..."
                : "Guardar Rubro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
