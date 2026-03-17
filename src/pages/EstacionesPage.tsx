// src/pages/EstacionesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, MonitorPlay } from "lucide-react";
import { toast } from "sonner";

import {
  getStations,
  createStation,
  updateStation,
  type Station,
} from "@/services/stationService";
import { getMaterials } from "@/services/materialService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

// --- 1. ESQUEMA DE VALIDACIÓN ZOD ---
const stationSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  username: z.string().min(3, "El usuario es obligatorio (Ej: gz180)"),
  password: z.string().optional(), // Opcional (solo se usa al crear o si quiere cambiarla)
  materialIds: z.array(z.number()), // Arreglo de IDs para las relaciones
});

type StationFormValues = z.infer<typeof stationSchema>;

// --- 2. PÁGINA PRINCIPAL ---
export const EstacionesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Station | null>(null);

  const {
    data: stations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stations"],
    queryFn: getStations,
  });

  const handleOpenModal = (station?: Station) => {
    setStationToEdit(station || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStationToEdit(null);
  };

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar la base de datos de estaciones.
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Estaciones de Trabajo
        </h1>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Estación
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nombre / Máquina</TableHead>
              <TableHead>Usuario de Logueo</TableHead>
              <TableHead>Materiales Admitidos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Cargando estaciones...
                </TableCell>
              </TableRow>
            ) : !stations || stations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MonitorPlay className="h-10 w-10 text-slate-300" />
                    <p className="text-base font-medium text-slate-900">
                      No hay estaciones registradas
                    </p>
                    <p className="text-sm">
                      Crea una estación (Ej: GZ 180) para empezar a asignarle
                      trabajos.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              stations.map((st) => (
                <TableRow key={st.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-500">
                    {st.id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {st.name}
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">
                    {st.username}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {st.materials?.length > 0 ? (
                        st.materials.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          Sin materiales
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModal(st)}
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

      <StationFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        station={stationToEdit}
      />
    </div>
  );
};

// --- 3. FORMULARIO MODAL (CON CHECKBOXES DE MATERIALES) ---
interface StationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
}

const StationFormModal = ({
  isOpen,
  onClose,
  station,
}: StationFormModalProps) => {
  const queryClient = useQueryClient();

  // Consultamos los materiales para mostrarlos en el formulario
  const { data: materialsList } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationSchema),
    values: station
      ? {
          name: station.name,
          username: station.username,
          password: "", // No traemos la contraseña por seguridad
          materialIds: station.materials?.map((m) => m.id) || [], // Pre-seleccionamos los materiales que ya tiene
        }
      : { name: "", username: "", password: "", materialIds: [] },
  });

  const createMut = useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.success("Estación creada con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al crear la estación"),
  });

  const updateMut = useMutation({
    mutationFn: (data: StationFormValues) => updateStation(station!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.success("Estación actualizada con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al actualizar la estación"),
  });

  const onSubmit = (data: StationFormValues) => {
    if (station) updateMut.mutate(data);
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
      <DialogContent className="sm:max-w-[700px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {station ? "Editar Estación" : "Nueva Estación de Trabajo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Fila: Nombre y Usuario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Nombre de la Máquina / Sector
              </label>
              <Input
                {...register("name")}
                placeholder="Ej: Plotter GZ 180"
                className="h-11"
              />
              {errors.name && (
                <span className="text-xs text-red-500">
                  {errors.name.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Usuario de Logueo
              </label>
              <Input
                {...register("username")}
                placeholder="Ej: plotter_gz"
                className="h-11 font-mono"
              />
              {errors.username && (
                <span className="text-xs text-red-500">
                  {errors.username.message}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Contraseña{" "}
              {station && "(Opcional: Dejar en blanco para mantener actual)"}
            </label>
            <Input
              type="password"
              {...register("password")}
              placeholder="***"
              className="h-11"
            />
          </div>

          {/* Sección de Checkboxes para Materiales */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-sm font-semibold text-slate-900">
              Materiales Compatibles
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Selecciona qué materiales puede procesar esta estación.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-md border border-slate-200">
              {materialsList?.map((material) => (
                <Controller
                  key={material.id}
                  name="materialIds"
                  control={control}
                  render={({ field }) => {
                    const isChecked = field.value.includes(material.id);
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`mat-${material.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, material.id]);
                            } else {
                              field.onChange(
                                field.value.filter(
                                  (val) => val !== material.id,
                                ),
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`mat-${material.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
                        >
                          {material.name}
                        </label>
                      </div>
                    );
                  }}
                />
              ))}
              {(!materialsList || materialsList.length === 0) && (
                <p className="text-sm text-slate-500 col-span-3">
                  No hay materiales creados aún.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-300"
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
                : "Guardar Estación"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
