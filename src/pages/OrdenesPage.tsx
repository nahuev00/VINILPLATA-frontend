// src/pages/OrdenesPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Search,
  Plus,
  Files,
  Calendar,
  FileText,
  User,
  Banknote,
  Trash2,
  Printer,
  Check,
  ChevronsUpDown,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import {
  getOrders,
  createOrder,
  type Order,
  type OrderStatus,
} from "@/services/orderService";
import { getClients } from "@/services/clientService";
import { getMaterials } from "@/services/materialService";
import { getStations } from "@/services/stationService";
import { getCities } from "@/services/cityService";
import { getCarriers } from "@/services/carrierService";

import { cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// ==========================================
// HOOK PERSONALIZADO: DEBOUNCE (Para no saturar el servidor al teclear)
// ==========================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ==========================================
// 1. ESQUEMAS ZOD
// ==========================================
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

type OrderFormValues = z.infer<typeof orderSchema>;

const getStatusBadge = (status: OrderStatus) => {
  const styles: Record<OrderStatus, string> = {
    PRESUPUESTADO: "bg-slate-100 text-slate-700 border-slate-200",
    EN_PRODUCCION: "bg-amber-100 text-amber-800 border-amber-200",
    TERMINADO: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ENTREGADO: "bg-blue-100 text-blue-800 border-blue-200",
    CANCELADO: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

// ==========================================
// COMBOBOX REUTILIZABLE (Mejorado para Búsqueda Asíncrona)
// ==========================================
const ComboboxField = ({
  field,
  data,
  placeholder,
  searchPlaceholder,
  onSearch,
}: {
  field: any;
  data: any[] | undefined;
  placeholder: string;
  searchPlaceholder: string;
  onSearch?: (val: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Mantenemos el nombre visible aunque el objeto desaparezca de la lista (por la paginación)
  useEffect(() => {
    if (field.value && data) {
      const found = data.find((item) => item.id === field.value);
      if (found) setSelectedItem(found);
    }
  }, [field.value, data]);

  const getSearchValue = (item: any) =>
    item.code ? `${item.code} ${item.name}` : item.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 bg-white font-normal hover:bg-slate-50 border-slate-200 text-slate-700 overflow-hidden"
        >
          <span className="truncate">
            {selectedItem ? (
              <>
                {selectedItem.code && (
                  <span className="font-mono text-slate-400 mr-2">
                    [{selectedItem.code}]
                  </span>
                )}
                {selectedItem.name}
              </>
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border-slate-200 shadow-md z-50">
        {/* Si tenemos onSearch (es asíncrono), apagamos el filtro interno de Shadcn */}
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9 border-none focus:ring-0"
            onValueChange={onSearch} // Dispara la búsqueda al backend
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm text-slate-500">
              No hay resultados.
            </CommandEmpty>
            <CommandGroup>
              {data?.map((item) => (
                <CommandItem
                  key={item.id}
                  value={getSearchValue(item)}
                  onSelect={() => {
                    field.onChange(item.id);
                    setSelectedItem(item);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-slate-100 text-slate-700 truncate"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-blue-600 flex-shrink-0",
                      field.value === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">
                    {item.code && (
                      <span className="font-mono text-xs text-slate-400 mr-2">
                        [{item.code}]
                      </span>
                    )}
                    {item.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================
export const OrdenesPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", { page, search: searchTerm }],
    queryFn: () => getOrders({ page, limit: 50, search: searchTerm }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const orders = data?.data || [];
  const meta = data?.meta;

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar las órdenes de trabajo.
      </div>
    );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Órdenes de Trabajo
        </h1>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Orden
        </Button>
      </div>

      <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-sm items-center space-x-2"
        >
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Buscar por número o cliente..."
              className="pl-9 h-10 w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="h-10 bg-slate-100"
          >
            Buscar
          </Button>
        </form>
        {meta && (
          <div className="text-sm text-slate-500 font-medium">
            Total: {meta.total} órdenes
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-md flex-1 overflow-auto shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[120px]">Nº Orden</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Título / Ref.</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-slate-500"
                >
                  No se encontraron órdenes
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-slate-50 py-1 cursor-pointer"
                  onClick={() => openDetails(order)}
                >
                  <TableCell className="font-mono font-bold text-slate-900">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {order.client.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {order.title || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {order.promisedDate
                      ? new Date(order.promisedDate).toLocaleDateString("es-AR")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    $
                    {order.total.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        order={selectedOrder}
      />
      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};

// ==========================================
// MODAL DE CREACIÓN DE ORDEN
// ==========================================
const OrderFormModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();

  // 👇 MAGIA ASÍNCRONA: Estado para la búsqueda de clientes
  const [clientSearch, setClientSearch] = useState("");
  // Espera 400ms después de que el usuario deja de tipear para buscar
  const debouncedClientSearch = useDebounce(clientSearch, 400);

  // Traemos los clientes filtrados desde el backend (Limitamos a 50 resultados rápidos)
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
      sellerId: 4,
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
      reset();
      setClientSearch(""); // Reseteamos la búsqueda
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
                        searchPlaceholder="Buscar por nombre o código (Ej: CL-001)..."
                        onSearch={setClientSearch} // 👇 Le pasamos el control de búsqueda
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
                    placeholder="Ej: Banners Promo Invierno"
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
                          <SelectItem value="RGE">RGE</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Transporte / Comisionista
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

// ==========================================
// SUBCOMPONENTE: TARJETA DE RENGLÓN (ORDER ITEM)
// ==========================================
const OrderItemCard = ({
  index,
  control,
  register,
  remove,
  setValue,
  materials,
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
        <div className="col-span-12 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Material
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
                <SelectContent className="bg-white">
                  {materials?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
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
          {currentMaterialId && compatibleStations.length === 0 && (
            <span className="text-[10px] text-amber-600 mt-0.5 block">
              Ninguna máquina procesa este material.
            </span>
          )}
        </div>

        <div className="col-span-12 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Archivo / Ref
          </label>
          <Input
            {...register(`items.${index}.fileName`)}
            placeholder="Ej: cartel_frente.pdf"
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
            Terminaciones (Ej: Ojalillos)
          </label>
          <Input
            {...register(`items.${index}.finishing`)}
            placeholder="Ej: Laminado mate"
            className="h-8 bg-white text-sm"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-700 mb-1 block uppercase">
            Notas del ítem
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
            className="h-8 bg-slate-100 font-bold text-slate-900 pointer-events-none text-sm border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MODAL DE DETALLES (SOLO LECTURA)
// ==========================================
const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}) => {
  if (!order) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[800px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {order.orderNumber}
                {getStatusBadge(order.status)}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                {order.title || "Sin título de referencia"}
              </p>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-black text-slate-900">
                $
                {order.total.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Orden
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> Cliente
            </span>
            <span className="text-sm font-bold text-slate-900 block mt-1">
              {order.client.name}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Entrega Prometida
            </span>
            <span className="text-sm font-medium text-slate-900 block mt-1">
              {order.promisedDate
                ? new Date(order.promisedDate).toLocaleDateString("es-AR")
                : "A convenir"}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> Vendedor
            </span>
            <span className="text-sm font-medium text-slate-900 block mt-1">
              {order.seller.name}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Pagos
            </span>
            <span className="text-xs text-slate-700 block mt-1">
              Efectivo: ${order.cashPayment}
            </span>
            <span className="text-xs text-slate-700">
              Digital: ${order.electronicPayment}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-600" /> Detalle de Producción
            ({order.items.length} ítems)
          </h4>
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs">Archivo / Ref</TableHead>
                  <TableHead className="text-xs">Medidas (mm)</TableHead>
                  <TableHead className="text-xs text-center">Cant.</TableHead>
                  <TableHead className="text-xs text-right">M² Tot.</TableHead>
                  <TableHead className="text-xs">Estado</TableHead>
                  <TableHead className="text-xs text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id} className="bg-white">
                    <TableCell>
                      <span className="font-medium text-slate-900 block text-sm">
                        {item.fileName || "Sin archivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-slate-600">
                      {item.widthMm} x {item.heightMm}
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-900">
                      {item.copies}
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">
                      {item.areaM2.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {item.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900 text-sm">
                      $
                      {item.subtotal.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
