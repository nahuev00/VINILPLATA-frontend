// src/pages/EstacionesPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useWatch } from "react-hook-form";
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
  Scissors,
  Package,
  Box,
  Truck,
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
// 1. ESQUEMA ZOD ACTUALIZADO (Con SHIPPER)
// ==========================================
const stationSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  username: z.string().min(4, "El usuario debe tener al menos 4 caracteres"),
  password: z.string().optional(),
  role: z.enum(["STATION", "PACKAGER", "SHIPPER"]).default("STATION"),
  printSpeedPerHour: z.coerce.number().min(0).default(0),
  materialIds: z.array(z.number()).optional().default([]),
  isFinishingStation: z.boolean().default(false),
});

type StationFormValues = z.infer<typeof stationSchema>;

export const EstacionesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const {
    data: stations,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["stations-list"], queryFn: getStations });

  const openForm = (station?: Station) => {
    setSelectedStation(station || null);
    setIsFormOpen(true);
  };

  // 👇 LÓGICA DE ORDENAMIENTO POR FLUJO DE PRODUCCIÓN 👇
  const roleOrder: Record<string, number> = {
    STATION: 1,
    PACKAGER: 2,
    SHIPPER: 3,
  };

  // Clonamos el array original y lo ordenamos según el peso definido arriba
  const sortedStations = stations
    ? [...stations].sort((a, b) => {
        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
      })
    : [];

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
            <Monitor className="w-6 h-6 text-blue-600" /> Estaciones y Personal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de impresoras, empaque y logística de envíos.
          </p>
        </div>
        <Button
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Registro
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
                Nombre
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Tipo / Rol
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Usuario (Login)
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Velocidad
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Materiales Compatibles
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
                  colSpan={7}
                  className="h-48 text-center text-slate-500"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : sortedStations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-slate-500"
                >
                  No hay estaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              sortedStations.map((station) => (
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

                  <TableCell>
                    {station.role === "SHIPPER" ? (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-[10px] font-bold px-2.5 py-1 rounded-md border border-teal-200 uppercase tracking-wider shadow-sm">
                        <Truck className="w-3.5 h-3.5" /> Logística / Envíos
                      </span>
                    ) : station.role === "PACKAGER" ? (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-md border border-purple-200 uppercase tracking-wider shadow-sm">
                        <Box className="w-3.5 h-3.5" /> Sector Empaque
                      </span>
                    ) : station.isFinishingStation ? (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-200 uppercase tracking-wider shadow-sm">
                        <Scissors className="w-3.5 h-3.5" /> Terminación
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-md border border-blue-200 uppercase tracking-wider shadow-sm">
                        <Monitor className="w-3.5 h-3.5" /> Impresión
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-slate-600 font-mono text-sm">
                    {station.username}
                  </TableCell>
                  <TableCell>
                    {station.role === "PACKAGER" ||
                    station.role === "SHIPPER" ? (
                      <span className="text-slate-400 italic text-xs">-</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
                        <Gauge className="w-3.5 h-3.5" />
                        {station.printSpeedPerHour || 10} ML/h
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {station.role === "PACKAGER" ||
                    station.role === "SHIPPER" ? (
                      <span className="text-slate-400 italic text-xs">
                        Aplica a todas las órdenes
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {station.materials && station.materials.length > 0 ? (
                          station.materials.map((m: any) => (
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
                    )}
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
      role: "STATION",
      printSpeedPerHour: 10,
      materialIds: [],
      isFinishingStation: false,
    },
  });

  const watchedRole = useWatch({ control, name: "role" });

  useEffect(() => {
    if (isOpen) {
      if (station) {
        reset({
          name: station.name,
          username: station.username,
          password: "",
          role:
            (station.role as "STATION" | "PACKAGER" | "SHIPPER") || "STATION",
          printSpeedPerHour: station.printSpeedPerHour || 10,
          materialIds: station.materials?.map((m: any) => m.id) || [],
          isFinishingStation: station.isFinishingStation || false,
        });
      } else {
        reset({
          name: "",
          username: "",
          password: "",
          role: "STATION",
          printSpeedPerHour: 10,
          materialIds: [],
          isFinishingStation: false,
        });
      }
    }
  }, [isOpen, station, reset]);

  const createMut = useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations-list"] });
      toast.success("Registro creado con éxito");
      onClose();
    },
    onError: () => toast.error("Error al crear el registro"),
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => updateStation(station!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations-list"] });
      toast.success("Registro actualizado");
      onClose();
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const onSubmit = (data: StationFormValues) => {
    const payload = { ...data };
    if (station && !payload.password) delete payload.password;

    // Limpiamos datos innecesarios si es empaquetador o despachante
    if (payload.role === "PACKAGER" || payload.role === "SHIPPER") {
      payload.printSpeedPerHour = 0;
      payload.materialIds = [];
      payload.isFinishingStation = false;
    }

    if (station) updateMut.mutate(payload);
    else createMut.mutate(payload);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[650px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {station ? "Editar Registro" : "Nuevo Registro del Sistema"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
              Área Asignada
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all text-center",
                  watchedRole === "STATION"
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <input
                  type="radio"
                  value="STATION"
                  {...register("role")}
                  className="hidden"
                />
                <Monitor className="w-6 h-6 mb-1" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Máquina
                </span>
              </label>

              <label
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all text-center",
                  watchedRole === "PACKAGER"
                    ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <input
                  type="radio"
                  value="PACKAGER"
                  {...register("role")}
                  className="hidden"
                />
                <Package className="w-6 h-6 mb-1" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Empaque
                </span>
              </label>

              <label
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all text-center",
                  watchedRole === "SHIPPER"
                    ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <input
                  type="radio"
                  value="SHIPPER"
                  {...register("role")}
                  className="hidden"
                />
                <Truck className="w-6 h-6 mb-1" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Despachos
                </span>
              </label>
            </div>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              {watchedRole === "STATION"
                ? "Perfil de Máquina"
                : "Datos del Operador"}
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Nombre
              </label>
              <Input
                {...register("name")}
                placeholder={
                  watchedRole === "STATION"
                    ? "Ej: Router CNC 1"
                    : watchedRole === "PACKAGER"
                      ? "Ej: Mesa de Empaque 1"
                      : "Ej: Estación de Logística"
                }
                className="h-9 bg-white"
              />
              {errors.name && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.name.message}
                </span>
              )}
            </div>

            {watchedRole === "STATION" && (
              <>
                <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-md border border-amber-200">
                  <input
                    type="checkbox"
                    id="isFinishing"
                    {...register("isFinishingStation")}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 border-amber-300"
                  />
                  <label
                    htmlFor="isFinishing"
                    className="text-sm font-bold text-amber-900 cursor-pointer select-none flex flex-col"
                  >
                    <span>
                      Esta es una Estación de Terminación / Post-Proceso
                    </span>
                    <span className="text-[10px] font-normal text-amber-700 mt-0.5">
                      Márcala si es un Router, Láser, Laminadora, etc.
                    </span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-slate-500" /> Velocidad
                    Promedio
                  </label>
                  <div className="relative">
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
                </div>
              </>
            )}
          </div>

          {watchedRole === "STATION" && (
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" /> Materiales
                Compatibles
              </h3>
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
                              field.onChange(
                                e.target.checked
                                  ? [...current, mat.id]
                                  : current.filter(
                                      (id: number) => id !== mat.id,
                                    ),
                              );
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
          )}

          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" /> Acceso al Sistema
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Usuario (Login)
                </label>
                <Input
                  {...register("username")}
                  className="h-9 bg-white"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Contraseña {station && "(Opcional)"}
                </label>
                <Input
                  type="password"
                  {...register("password")}
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
                : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
