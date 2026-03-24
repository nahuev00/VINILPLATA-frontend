// src/components/OrderFormModal.tsx
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, FileText, Banknote, Trash2, Printer, Truck } from "lucide-react";
import { toast } from "sonner";

import { createOrder } from "@/services/orderService";
import { getClients } from "@/services/clientService";
import { getMaterials } from "@/services/materialService";
import { getStations } from "@/services/stationService";
import { getCities } from "@/services/cityService";
import { getCarriers } from "@/services/carrierService";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// 👇 IMPORTAMOS LAS PIEZAS DE GRUPOS DEL SELECT 👇
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComboboxField } from "./ComboboxField";

// --- SCHEMAS ---
const orderItemSchema = z.object({
  materialId: z.number().min(1, "Material requerido"),
  assignedToId: z.number().optional().nullable(),
  fileName: z.string().optional().nullable(),
  widthMm: z.number().min(1, "Ancho > 0"),
  heightMm: z.number().min(1, "Alto > 0"),
  copies: z.number().min(1, "Mínimo 1 copia"),
  finishing: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  unitPrice: z.number().min(0),
  subtotal: z.number().min(0),
});

const orderSchema = z.object({
  clientId: z.number().min(1, "Cliente requerido"),
  sellerId: z.number(),
  title: z.string().optional().nullable(),
  shippingType: z.string().optional().nullable(),
  carrierId: z.number().optional().nullable(),
  cityId: z.number().optional().nullable(),
  promisedDate: z.string().optional().nullable(),
  total: z.number().min(0),
  electronicPayment: z.number().min(0),
  cashPayment: z.number().min(0),
  invoiceType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "Debe agregar al menos un ítem"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

// --- SUBCOMPONENTE DE ITEM ---
const OrderItemCard = ({
  index,
  control,
  register,
  remove,
  setValue,
  materials,
  groupedMaterials,
  stations,
}: any) => {
  const currentMaterialId = useWatch({
    control,
    name: `items.${index}.materialId`,
  });
  const w = useWatch({ control, name: `items.${index}.widthMm` }) || 0;
  const h = useWatch({ control, name: `items.${index}.heightMm` }) || 0;
  const copies = useWatch({ control, name: `items.${index}.copies` }) || 1;
  const unitPrice =
    useWatch({ control, name: `items.${index}.unitPrice` }) || 0;

  const areaVisual = ((w * h) / 1000000) * copies;
  const calculatedSubtotal = unitPrice * copies;

  useEffect(() => {
    setValue(`items.${index}.subtotal`, calculatedSubtotal);
  }, [calculatedSubtotal, setValue, index]);

  const compatibleStations =
    stations?.filter((st: any) =>
      st.materials?.some((m: any) => m.id === currentMaterialId),
    ) || [];

  return (
    <div className="relative bg-slate-50/50 border border-slate-200 rounded-md p-4 shadow-sm">
      <div className="absolute top-2 right-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => remove(index)}
          className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <span className="text-xs font-black text-slate-400 absolute top-2 left-2">
        #{index + 1}
      </span>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 mt-4">
        {/* 👇 SELECTOR DE MATERIAL AGRUPADO 👇 */}
        <div className="col-span-12 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Material y Ancho
          </label>
          <Controller
            name={`items.${index}.materialId`}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value?.toString() || ""}
                onValueChange={(val) => field.onChange(Number(val))}
              >
                <SelectTrigger className="h-8 bg-white text-sm">
                  <SelectValue placeholder="Elegir material" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px]">
                  {Object.entries(groupedMaterials || {}).map(
                    ([category, mats]: [string, any]) => (
                      <SelectGroup key={category}>
                        <SelectLabel className="bg-slate-100 text-blue-800 font-black tracking-wider uppercase text-[10px] py-1 px-2 mb-1">
                          {category}
                        </SelectLabel>
                        {mats.map((m: any) => (
                          <SelectItem
                            key={m.id}
                            value={m.id.toString()}
                            className="pl-6 text-xs cursor-pointer"
                          >
                            {m.name}{" "}
                            <span className="text-slate-400 font-mono ml-2 font-bold">
                              ({m.width?.toFixed(2)}m)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="col-span-12 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Estación / Máquina
          </label>
          <Controller
            name={`items.${index}.assignedToId`}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value?.toString() || "unassigned"}
                onValueChange={(val) =>
                  field.onChange(val === "unassigned" ? null : Number(val))
                }
              >
                <SelectTrigger className="h-8 bg-white text-sm">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem
                    value="unassigned"
                    className="text-slate-500 italic"
                  >
                    Dejar sin asignar
                  </SelectItem>
                  {compatibleStations.map((st: any) => (
                    <SelectItem key={st.id} value={st.id.toString()}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="col-span-12 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Archivo / Ref
          </label>
          <Input
            {...register(`items.${index}.fileName`)}
            placeholder="Ej: cartel.pdf"
            className="h-8 bg-white text-sm"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Ancho (mm)
          </label>
          <Input
            type="number"
            {...register(`items.${index}.widthMm`, { valueAsNumber: true })}
            className="h-8 bg-white text-sm"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Alto (mm)
          </label>
          <Input
            type="number"
            {...register(`items.${index}.heightMm`, { valueAsNumber: true })}
            className="h-8 bg-white text-sm"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Terminaciones (Opc)
          </label>
          <Input
            {...register(`items.${index}.finishing`)}
            placeholder="Ej: Laminado mate"
            className="h-8 bg-white text-sm"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Notas
          </label>
          <Input
            {...register(`items.${index}.notes`)}
            placeholder="Ej: Cortar al ras"
            className="h-8 bg-white text-sm"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Copias
          </label>
          <Input
            type="number"
            {...register(`items.${index}.copies`, { valueAsNumber: true })}
            className="h-8 bg-white text-sm"
          />
        </div>
        <div className="col-span-6 md:col-span-2 flex flex-col justify-end pb-1 border-r border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            Área (M²)
          </span>
          <span className="text-sm font-black text-slate-600">
            {areaVisual.toFixed(2)}
          </span>
        </div>
        <div className="col-span-6 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Precio Unit. ($)
          </label>
          <Input
            type="number"
            step="0.01"
            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
            className="h-8 bg-white font-semibold text-sm"
          />
        </div>
        <div className="col-span-6 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Subtotal Renglón ($)
          </label>
          <Input
            type="number"
            {...register(`items.${index}.subtotal`)}
            readOnly
            className="h-8 bg-slate-100 font-bold pointer-events-none text-sm border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DEL MODAL ---
export const OrderFormModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [clientSearch, setClientSearch] = useState("");
  const debouncedClientSearch = useDebounce(clientSearch, 400);

  const { data: clientsRes } = useQuery({
    queryKey: ["clients-search", debouncedClientSearch],
    queryFn: () =>
      getClients({ page: 1, limit: 50, search: debouncedClientSearch }),
  });
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: getMaterials,
  });
  const { data: stations } = useQuery({
    queryKey: ["stations"],
    queryFn: getStations,
  });
  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: getCities,
  });
  const { data: carriers } = useQuery({
    queryKey: ["carriers"],
    queryFn: getCarriers,
  });

  // 👇 AGRUPAMOS LOS MATERIALES AQUÍ, UNA SOLA VEZ 👇
  const groupedMaterials = useMemo(() => {
    if (!materials) return {};
    return materials.reduce((acc: any, mat: any) => {
      const cat = mat.category || "OTROS";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(mat);
      return acc;
    }, {});
  }, [materials]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      sellerId: user?.id || 0,
      total: 0,
      electronicPayment: 0,
      cashPayment: 0,
      items: [
        { widthMm: 0, heightMm: 0, copies: 1, unitPrice: 0, subtotal: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" }) || [];
  const calculatedTotal = watchedItems.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0,
  );

  useEffect(() => {
    setValue("total", calculatedTotal);
  }, [calculatedTotal, setValue]);

  const watchedClientId = useWatch({ control, name: "clientId" });
  useEffect(() => {
    if (watchedClientId && clientsRes?.data) {
      const selectedClient = clientsRes.data.find(
        (c: any) => c.id === watchedClientId,
      );
      if (selectedClient) {
        setValue("cityId", selectedClient.cityId || null);
        setValue("shippingType", selectedClient.shippingType || null);
        setValue("carrierId", selectedClient.carrierId || null);
      }
    }
  }, [watchedClientId, clientsRes?.data, setValue]);

  const createMut = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Orden creada con éxito");
      onClose();
      reset({
        sellerId: user?.id || 0,
        total: 0,
        electronicPayment: 0,
        cashPayment: 0,
        items: [
          { widthMm: 0, heightMm: 0, copies: 1, unitPrice: 0, subtotal: 0 },
        ],
      });
      setClientSearch("");
    },
    onError: () => toast.error("Error al crear la orden"),
  });

  const onSubmit = (data: OrderFormValues) => {
    const itemsFormateados = data.items.map((item) => ({
      ...item,
      areaM2: ((item.widthMm * item.heightMm) / 1000000) * item.copies,
    }));
    createMut.mutate({ ...data, items: itemsFormateados });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          setClientSearch("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[1100px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Nueva Orden de Trabajo
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Datos Generales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Cliente
                  </label>
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <ComboboxField
                        field={field}
                        data={clientsRes?.data}
                        placeholder="Seleccionar cliente..."
                        searchPlaceholder="Buscar por nombre..."
                        onSearch={setClientSearch}
                      />
                    )}
                  />
                  {errors.clientId && (
                    <span className="text-xs text-red-500">
                      {errors.clientId.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Fecha Prometida
                  </label>
                  <Input
                    type="date"
                    {...register("promisedDate")}
                    className="h-9 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Título / Referencia
                  </label>
                  <Input
                    {...register("title")}
                    placeholder="Ej: Banners Promo"
                    className="h-9 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" /> Logística de Entrega
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Localidad Destino
                  </label>
                  <Controller
                    name="cityId"
                    control={control}
                    render={({ field }) => (
                      <ComboboxField
                        field={field}
                        data={cities}
                        placeholder="Seleccionar ciudad..."
                        searchPlaceholder="Buscar..."
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Tipo de Envío
                  </label>
                  <Controller
                    name="shippingType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-9 bg-white hover:bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Ej: RETIRA" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="RETIRA">
                            Retira por local
                          </SelectItem>
                          <SelectItem value="EXPRESO">
                            Expreso / Comisionista
                          </SelectItem>
                          <SelectItem value="CORREO">Correo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Transporte
                  </label>
                  <Controller
                    name="carrierId"
                    control={control}
                    render={({ field }) => (
                      <ComboboxField
                        field={field}
                        data={carriers}
                        placeholder="Seleccionar transporte..."
                        searchPlaceholder="Buscar..."
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" /> Ítems de
                Producción
              </h3>
              <Button
                type="button"
                onClick={() =>
                  append({
                    materialId: 0,
                    widthMm: 0,
                    heightMm: 0,
                    copies: 1,
                    unitPrice: 0,
                    subtotal: 0,
                  })
                }
                variant="outline"
                size="sm"
                className="bg-white border-slate-300"
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar Renglón
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <OrderItemCard
                  key={field.id}
                  index={index}
                  control={control}
                  register={register}
                  remove={remove}
                  setValue={setValue}
                  materials={materials}
                  groupedMaterials={groupedMaterials} // 👇 PASAMOS LA DATA AGRUPADA
                  stations={stations}
                />
              ))}
            </div>
            {errors.items && (
              <span className="text-xs text-red-500 font-bold">
                {errors.items.message}
              </span>
            )}
          </div>

          <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-blue-600" /> Facturación y
              Observaciones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Tipo Factura
                </label>
                <Controller
                  name="invoiceType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-9 bg-white">
                        <SelectValue placeholder="Ej: A" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="A">Factura A</SelectItem>
                        <SelectItem value="B">Factura B</SelectItem>
                        <SelectItem value="X">Comprobante X</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Efectivo ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("cashPayment", { valueAsNumber: true })}
                  className="h-9 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Digital / MP ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("electronicPayment", { valueAsNumber: true })}
                  className="h-9 bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Total de la Orden ($)
                </label>
                <Input
                  type="number"
                  {...register("total")}
                  readOnly
                  className="h-9 bg-slate-100 font-bold text-lg text-blue-700 border-blue-200 pointer-events-none"
                />
              </div>
              <div className="md:col-span-5">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Observaciones de la Orden
                </label>
                <Textarea
                  {...register("notes")}
                  placeholder="Ej: Entregar antes del mediodía"
                  className="min-h-[60px] resize-none bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
              disabled={createMut.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-sm"
            >
              {createMut.isPending ? "Creando..." : "Confirmar Orden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
