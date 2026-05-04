// src/components/StationFormModal.tsx
import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Monitor,
  Package,
  Truck,
  Settings,
  CheckSquare,
  KeyRound,
  Check,
} from "lucide-react";

import { getMaterials } from "@/services/materialService";
import { type Station } from "@/services/stationService";
import { useStations } from "@/hooks/useStations";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const stationSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  username: z.string().min(4, "El usuario debe tener al menos 4 caracteres"),
  password: z.string().optional(),
  role: z.enum(["STATION", "PACKAGER", "SHIPPER"]),
  printSpeedPerHour: z.coerce.number().min(0), 
  materialIds: z.array(z.number()),
  isFinishingStation: z.boolean(), 
});

type StationFormValues = z.infer<typeof stationSchema>;

interface StationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
}

export const StationFormModal = ({
  isOpen,
  onClose,
  station,
}: StationFormModalProps) => {
  const { createStation, updateStation } = useStations();

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

  const onSubmit = (data: StationFormValues) => {
    const payload = { ...data };
    if (station && !payload.password) delete payload.password;

    if (payload.role === "PACKAGER" || payload.role === "SHIPPER") {
      payload.printSpeedPerHour = 0;
      payload.materialIds = [];
      payload.isFinishingStation = false;
    }

    if (station) {
      updateStation.mutate(
        { id: station.id, data: payload },
        { onSuccess: onClose },
      );
    } else {
      createStation.mutate(payload, { onSuccess: onClose });
    }
  };

  const isPending = createStation.isPending || updateStation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                    Velocidad Promedio
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
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-4">
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
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
