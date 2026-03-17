// src/pages/TransportesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Truck } from "lucide-react";
import { toast } from "sonner";

import {
  getCarriers,
  createCarrier,
  updateCarrier,
  type Carrier,
} from "@/services/carrierService";

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
const carrierSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  contactInfo: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  pickupDays: z.string().optional().nullable(),
  locations: z.string().optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
});

type CarrierFormValues = z.infer<typeof carrierSchema>;

// --- 2. COMPONENTE PRINCIPAL (PÁGINA) ---
export const TransportesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carrierToEdit, setCarrierToEdit] = useState<Carrier | null>(null);

  const {
    data: carriers,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["carriers"],
    queryFn: getCarriers,
  });

  const handleOpenModal = (carrier?: Carrier) => {
    setCarrierToEdit(carrier || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCarrierToEdit(null);
  };

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar la base de datos de transportes.
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Gestión de Transportes y Comisionistas
        </h1>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Transporte
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Días de Retiro</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Destinos</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-slate-500"
                >
                  Cargando transportes...
                </TableCell>
              </TableRow>
            ) : !carriers || carriers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Truck className="h-10 w-10 text-slate-300" />
                    <p className="text-base font-medium text-slate-900">
                      No hay transportes registrados
                    </p>
                    <p className="text-sm">
                      Agrega comisionistas y expresos para asociarlos a tus
                      clientes.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              carriers.map((carrier) => (
                <TableRow key={carrier.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-500">
                    {carrier.id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {carrier.name}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {carrier.pickupDays || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm font-mono">
                    {carrier.arrivalTime || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {carrier.locations || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {carrier.phone || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModal(carrier)}
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

      <CarrierFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        carrier={carrierToEdit}
      />
    </div>
  );
};

// --- 3. COMPONENTE DEL FORMULARIO MODAL ---
interface CarrierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrier: Carrier | null;
}

const CarrierFormModal = ({
  isOpen,
  onClose,
  carrier,
}: CarrierFormModalProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CarrierFormValues>({
    resolver: zodResolver(carrierSchema),
    values: carrier
      ? {
          name: carrier.name,
          contactInfo: carrier.contactInfo || "",
          phone: carrier.phone || "",
          pickupDays: carrier.pickupDays || "",
          locations: carrier.locations || "",
          arrivalTime: carrier.arrivalTime || "",
        }
      : {
          name: "",
          contactInfo: "",
          phone: "",
          pickupDays: "",
          locations: "",
          arrivalTime: "",
        },
  });

  const createMut = useMutation({
    mutationFn: createCarrier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      toast.success("Transporte creado con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al crear el transporte"),
  });

  const updateMut = useMutation({
    mutationFn: (data: CarrierFormValues) => updateCarrier(carrier!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      toast.success("Transporte actualizado con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al actualizar el transporte"),
  });

  const onSubmit = (data: CarrierFormValues) => {
    // Convertimos los strings vacíos en null para mantener la BD limpia
    const payload = {
      name: data.name,
      contactInfo: data.contactInfo || null,
      phone: data.phone || null,
      pickupDays: data.pickupDays || null,
      locations: data.locations || null,
      arrivalTime: data.arrivalTime || null,
    };

    if (carrier) updateMut.mutate(payload);
    else createMut.mutate(payload);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {carrier ? "Editar Transporte" : "Nuevo Transporte"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Fila 1: Nombre (Ancho completo) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Nombre del Transporte / Comisionista
            </label>
            <Input
              {...register("name")}
              placeholder="Ej: Mdq - Carlos"
              className={`h-11 ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <span className="text-xs font-medium text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Fila 2: Teléfono y Horario (2 columnas) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Teléfono
              </label>
              <Input
                {...register("phone")}
                placeholder="Ej: 02262 15649995"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Horario de Llegada
              </label>
              <Input
                {...register("arrivalTime")}
                placeholder="Ej: 16.00"
                className="h-11"
              />
            </div>
          </div>

          {/* Fila 3: Días y Destinos (2 columnas) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Días de Retiro
              </label>
              <Input
                {...register("pickupDays")}
                placeholder="Ej: de Lunes a Viernes"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Destinos / Localidades
              </label>
              <Input
                {...register("locations")}
                placeholder="Ej: Necochea, Miramar"
                className="h-11"
              />
            </div>
          </div>

          {/* Fila 4: Info de Contacto / Notas */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">
              Información de Contacto / Notas
            </label>
            <Input
              {...register("contactInfo")}
              placeholder="Ej: Llamar hasta las 13hs"
              className="h-11"
            />
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
                : "Guardar Transporte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
