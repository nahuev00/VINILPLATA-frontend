// src/pages/CiudadesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, MapPin } from "lucide-react";
import { toast } from "sonner";

import {
  getCities,
  createCity,
  updateCity,
  type City,
} from "@/services/cityService";

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
const citySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  province: z.string().optional().nullable(),
});

type CityFormValues = z.infer<typeof citySchema>;

// --- 2. COMPONENTE PRINCIPAL (PÁGINA) ---
export const CiudadesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cityToEdit, setCityToEdit] = useState<City | null>(null);

  const {
    data: cities,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cities"],
    queryFn: getCities,
  });

  const handleOpenModal = (city?: City) => {
    setCityToEdit(city || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCityToEdit(null);
  };

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar la base de datos de ciudades.
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Gestión de Localidades
        </h1>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Localidad
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Ciudad / Localidad</TableHead>
              <TableHead>Provincia</TableHead>
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
                  Cargando localidades...
                </TableCell>
              </TableRow>
            ) : !cities || cities.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MapPin className="h-10 w-10 text-slate-300" />
                    <p className="text-base font-medium text-slate-900">
                      No hay localidades registradas
                    </p>
                    <p className="text-sm">
                      Agrega ciudades para luego asignarlas a tus clientes.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              cities.map((city) => (
                <TableRow key={city.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-500">
                    {city.id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {city.name}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {city.province ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {city.province}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModal(city)}
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

      <CityFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        city={cityToEdit}
      />
    </div>
  );
};

// --- 3. COMPONENTE DEL FORMULARIO MODAL ---
interface CityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: City | null;
}

const CityFormModal = ({ isOpen, onClose, city }: CityFormModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CityFormValues>({
    resolver: zodResolver(citySchema),
    values: city
      ? { name: city.name, province: city.province || "" }
      : { name: "", province: "" },
  });

  const createMut = useMutation({
    mutationFn: createCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("Localidad creada con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al crear la localidad"),
  });

  const updateMut = useMutation({
    mutationFn: (data: CityFormValues) => updateCity(city!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("Localidad actualizada con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al actualizar la localidad"),
  });

  const onSubmit = (data: CityFormValues) => {
    // Si la provincia viene como string vacío, la mandamos como null al backend
    const payload = { ...data, province: data.province || null };
    if (city) {
      updateMut.mutate(payload);
    } else {
      createMut.mutate(payload);
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
      <DialogContent className="sm:max-w-[500px] bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {city ? "Editar Localidad" : "Nueva Localidad"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Nombre de la Ciudad
            </label>
            <Input
              {...register("name")}
              placeholder="Ej: Mar del Plata"
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
              Provincia (Opcional)
            </label>
            <Input
              {...register("province")}
              placeholder="Ej: Buenos Aires"
              className={`h-11 ${errors.province ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
            {errors.province && (
              <span className="text-xs font-medium text-red-500">
                {errors.province.message}
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
                : "Guardar Localidad"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
