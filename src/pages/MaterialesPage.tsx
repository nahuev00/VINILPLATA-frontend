// src/pages/MaterialesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Package } from "lucide-react";
import { toast } from "sonner";

import {
  getMaterials,
  createMaterial,
  updateMaterial,
  type Material,
} from "@/services/materialService";

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
// Quitamos 'price' y agregamos 'description' (opcional)
const materialSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

// --- 2. COMPONENTE PRINCIPAL (PÁGINA) ---
export const MaterialesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);

  const {
    data: materials,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const handleOpenModal = (material?: Material) => {
    setMaterialToEdit(material || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMaterialToEdit(null);
  };

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar la base de datos de materiales.
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Gestión de Materiales
        </h1>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Material
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nombre / Material</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-slate-500"
                >
                  Cargando materiales...
                </TableCell>
              </TableRow>
            ) : !materials || materials.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-10 w-10 text-slate-300" />
                    <p className="text-base font-medium text-slate-900">
                      No hay materiales registrados
                    </p>
                    <p className="text-sm">
                      Haz clic en "Nuevo Material" para agregar el primero a tu
                      lista.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              materials.map((mat) => (
                <TableRow key={mat.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-500">
                    {mat.id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {mat.name}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {mat.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModal(mat)}
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

      <MaterialFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        material={materialToEdit}
      />
    </div>
  );
};

// --- 3. COMPONENTE DEL FORMULARIO MODAL ---
interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
}

const MaterialFormModal = ({
  isOpen,
  onClose,
  material,
}: MaterialFormModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    // Llenamos el formulario con el name y la description (si existe, si no string vacío)
    values: material
      ? { name: material.name, description: material.description || "" }
      : { name: "", description: "" },
  });

  const createMut = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material creado con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al crear el material"),
  });

  const updateMut = useMutation({
    mutationFn: (data: MaterialFormValues) =>
      updateMaterial(material!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material actualizado con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al actualizar el material"),
  });

  const onSubmit = (data: MaterialFormValues) => {
    if (material) {
      updateMut.mutate(data);
    } else {
      createMut.mutate(data);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {material ? "Editar Material" : "Nuevo Material"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Nombre del material
            </label>
            <Input
              {...register("name")}
              placeholder="Ej: Vinilo Avery Base Gris"
              className={`h-11 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
            {errors.name && (
              <span className="text-xs font-medium text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Descripción (Opcional)
            </label>
            <Input
              {...register("description")}
              placeholder="Ej: Solo usar para máquina GZ 180"
              className={`h-11 ${errors.description ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
            {errors.description && (
              <span className="text-xs font-medium text-red-500">
                {errors.description.message}
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
                : "Guardar Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
