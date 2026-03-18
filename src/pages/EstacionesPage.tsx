// src/pages/EstacionesPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Pencil,
  Settings,
  Gauge,
  KeyRound,
  Monitor,
  CheckSquare,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import {
  getStations,
  createStation,
  updateStation,
  type Station,
} from "@/services/stationService";
import { getMaterials } from "@/services/materialService";

import { cn } from "@/lib/utils";
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

// ==========================================
// 1. ESQUEMA ZOD (Corregido con coerce)
// ==========================================
const stationSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  username: z.string().min(4, "El usuario debe tener al menos 4 caracteres"),
  password: z.string().optional(),

  // 👇 Usamos z.coerce.number() para evitar el bug del punto decimal en React
  printSpeedPerHour: z.coerce
    .number({ required_error: "La velocidad es requerida" })
    .min(0.1, "Debe ser mayor a 0"),

  materialIds: z.array(z.number()).optional().default([]),
});

type StationFormValues = z.infer<typeof stationSchema>;

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================
export const EstacionesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const {
    data: stations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["stations-list"],
    queryFn: getStations,
  });

  const openForm = (station?: Station) => {
    setSelectedStation(station || null);
    setIsFormOpen(true);
  };

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar las estaciones de trabajo.
      </div>
    );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Monitor className="w-6 h-6 text-blue-600" /> Estaciones de Trabajo
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de máquinas, plotters y mesas de corte.
          </p>
        </div>
        <Button
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Estación
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
                Nombre de Máquina
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Usuario (Login)
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Velocidad (ML / h)
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Materiales Asignados
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
            ) : !stations || stations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-slate-500"
                >
                  No hay estaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              stations.map((station) => (
                <TableRow
                  key={station.id}
                  className="hover:bg-slate-50 py-1 border-b border-slate-100"
                >
                  <TableCell className="font-mono text-xs font-medium text-slate-500">
                    {station.id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {station.name}
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">
                    {station.username}
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      <Gauge className="w-3.5 h-3.5" />
                      {station.printSpeedPerHour || 10} ML/h
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {station.materials && station.materials.length > 0 ? (
                        station.materials.map((m) => (
                          <span
                            key={m.id}
                            className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                          >
                            {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-amber-600 italic">
                          Ninguno
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => openForm(station)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        station={selectedStation}
      />
    </div>
  );
};

// ==========================================
// MODAL DE FORMULARIO (CREAR/EDITAR)
// ==========================================
const StationFormModal = ({
  isOpen,
  onClose,
  station,
}: {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
}) => {
  const queryClient = useQueryClient();
  const { data: materials } = useQuery({
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
    defaultValues: {
      name: "",
      username: "",
      password: "",
      printSpeedPerHour: 10,
      materialIds: [],
    },
  });

  // 👇 Usamos useEffect para cargar los datos solo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (station) {
        reset({
          name: station.name,
          username: station.username,
          password: "",
          printSpeedPerHour: station.printSpeedPerHour || 10,
          materialIds: station.materials?.map((m) => m.id) || [],
        });
      } else {
        reset({
          name: "",
          username: "",
          password: "",
          printSpeedPerHour: 10,
          materialIds: [],
        });
      }
    }
  }, [isOpen, station, reset]);

  const createMut = useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations-list"] });
      toast.success("Estación creada con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al crear la estación"),
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => updateStation(station!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations-list"] });
      toast.success("Estación actualizada");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const onSubmit = (data: StationFormValues) => {
    const payload = { ...data };
    if (station && !payload.password) {
      delete payload.password;
    }

    if (station) updateMut.mutate(payload);
    else createMut.mutate(payload);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[550px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {station ? "Editar Estación" : "Nueva Estación de Trabajo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> Perfil de Máquina
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Nombre de Máquina
              </label>
              <Input
                {...register("name")}
                placeholder="Ej: GZ 180 (Lona)"
                className="h-9 bg-white"
              />
              {errors.name && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-slate-500" /> Velocidad de
                Impresión / Corte
              </label>
              <div className="relative">
                {/* 👇 Quitamos el valueAsNumber para evitar que nos borre los decimales mientras tipeamos */}
                <Input
                  type="number"
                  step="0.1"
                  {...register("printSpeedPerHour")}
                  className="h-9 bg-white pr-12"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  ML / h
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Metros lineales que procesa por hora. Se usa para estimar la
                carga del tablero.
              </p>
              {errors.printSpeedPerHour && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.printSpeedPerHour.message}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-600" /> Materiales
              Compatibles
            </h3>
            <p className="text-[11px] text-slate-500 mb-2">
              Selecciona todos los materiales que esta máquina es capaz de
              procesar. Esto filtrará automáticamente las opciones al crear una
              orden.
            </p>

            <Controller
              name="materialIds"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-1">
                  {materials?.map((mat: any) => {
                    const isSelected = field.value.includes(mat.id);
                    return (
                      <label
                        key={mat.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md border cursor-pointer text-sm transition-all select-none",
                          isSelected
                            ? "bg-blue-50 border-blue-300 text-blue-800 font-medium shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={(e) => {
                            const current = field.value || [];
                            const updated = e.target.checked
                              ? [...current, mat.id]
                              : current.filter((id: number) => id !== mat.id);
                            field.onChange(updated);
                          }}
                        />
                        <div
                          className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-slate-300 bg-white",
                          )}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="truncate text-xs">{mat.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" /> Credenciales de
              Acceso
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Usuario
                </label>
                <Input
                  {...register("username")}
                  placeholder="Ej: gz180"
                  className="h-9 bg-white"
                  autoComplete="off"
                />
                {errors.username && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.username.message}
                  </span>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Contraseña {station && "(Opcional)"}
                </label>
                <Input
                  type="password"
                  {...register("password")}
                  placeholder={station ? "Dejar vacío para no cambiar" : "****"}
                  className="h-9 bg-white"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
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
