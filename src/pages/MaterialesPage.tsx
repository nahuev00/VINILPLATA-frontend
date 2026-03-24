// src/pages/MaterialesPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Layers, Ruler, FileText } from "lucide-react";
import { toast } from "sonner";

import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "@/services/materialService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// ==========================================
// ESQUEMA ZOD (Adaptado al nuevo modelo Prisma)
// ==========================================
const materialSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  // Transformamos el string vacío a null para que Prisma lo acepte correctamente
  width: z
    .union([z.coerce.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === 0 ? null : Number(val))),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export const MaterialesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: materials, isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const deleteMut = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material eliminado");
    },
    onError: () => toast.error("Error al eliminar el material"),
  });

  const openForm = (material?: any) => {
    setSelectedMaterial(material || null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (
      window.confirm(
        "¿Estás seguro de eliminar este material? Esta acción no se puede deshacer.",
      )
    ) {
      deleteMut.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" /> Catálogo de Materiales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de insumos, bobinas, planchas y descripciones.
          </p>
        </div>
        <Button
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Material
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md flex-1 overflow-auto shadow-sm mt-4">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[80px] font-semibold text-slate-700">
                ID
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Categoría
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Nombre / Tipo
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Descripción
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">
                Ancho (m)
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-slate-500"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : !materials || materials.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-slate-500"
                >
                  No hay materiales registrados.
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material: any) => (
                <TableRow
                  key={material.id}
                  className="hover:bg-slate-50 py-1 border-b border-slate-100"
                >
                  <TableCell className="font-mono text-xs font-medium text-slate-500">
                    {material.id}
                  </TableCell>
                  <TableCell>
                    {material.category ? (
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
                        {material.category}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Sin categoría
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {material.name}
                  </TableCell>
                  <TableCell
                    className="text-sm text-slate-600 truncate max-w-[200px]"
                    title={material.description || ""}
                  >
                    {material.description || (
                      <span className="text-slate-400 italic text-xs">
                        Sin descripción
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {material.width ? (
                      <span className="inline-flex items-center gap-1 font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <Ruler className="w-3 h-3 text-slate-400" />{" "}
                        {material.width.toFixed(2)}m
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => openForm(material)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(material.id)}
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

      {isFormOpen && (
        <MaterialFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          material={selectedMaterial}
        />
      )}
    </div>
  );
};

// ==========================================
// MODAL DE FORMULARIO
// ==========================================
const MaterialFormModal = ({ isOpen, onClose, material }: any) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      width: "" as any,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (material) {
        reset({
          name: material.name,
          category: material.category || "",
          description: material.description || "",
          width: material.width || ("" as any),
        });
      } else {
        reset({ name: "", category: "", description: "", width: "" as any });
      }
    }
  }, [isOpen, material, reset]);

  const createMut = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material creado");
      onClose();
    },
    onError: () => toast.error("Error al crear el material"),
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => updateMaterial(material.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material actualizado");
      onClose();
    },
    onError: () => toast.error("Error al actualizar el material"),
  });

  const onSubmit = (data: MaterialFormValues) => {
    if (material) updateMut.mutate(data);
    else createMut.mutate(data);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[450px] bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {material ? "Editar Material" : "Nuevo Material"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1 block uppercase tracking-wider">
                Nombre del Material *
              </label>
              <Input
                {...register("name")}
                placeholder="Ej: Front Light 13oz Brillante"
                className="h-10 bg-white"
              />
              {errors.name && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700 mb-1 block uppercase tracking-wider">
                Categoría
              </label>
              <Input
                {...register("category")}
                placeholder="Ej: LONAS, VINILOS..."
                className="h-10 bg-white uppercase"
                list="categorias-list"
              />
              <datalist id="categorias-list">
                <option value="LONAS" />
                <option value="VINILOS" />
                <option value="PAPELES" />
                <option value="RÍGIDOS" />
                <option value="OTROS" />
              </datalist>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1 uppercase tracking-wider">
                <Ruler className="w-3.5 h-3.5" /> Ancho Bobina
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  {...register("width")}
                  placeholder="Ej: 1.22"
                  className="h-10 bg-white pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  m
                </span>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" /> Descripción / Notas
                (Opcional)
              </label>
              <Textarea
                {...register("description")}
                placeholder="Detalles adicionales, proveedor, características..."
                className="min-h-[80px] bg-white resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
