// src/pages/ClientesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Search,
  Plus,
  Users,
  Pencil,
  Building2,
  MapPin,
  Truck,
  Phone,
  FileText,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";

import {
  getClients,
  createClient,
  updateClient,
  type Client,
} from "@/services/clientService";
import { getCities } from "@/services/cityService";
import { getCategories } from "@/services/categoryService";
import { getCarriers } from "@/services/carrierService";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
// 1. ESQUEMA ZOD PARA EL CLIENTE
// ==========================================
const clientSchema = z.object({
  code: z.string().min(1, "Código requerido"),
  name: z.string().min(2, "La Razón Social es requerida"),
  searchName: z.string().optional().nullable(),
  cuitDni: z.string().optional().nullable(),
  taxCategory: z.string().optional().nullable(),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z.string().optional().nullable(),
  altPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  cityId: z.number().optional().nullable(),
  categoryId: z.number().optional().nullable(),
  carrierId: z.number().optional().nullable(),
  discount: z.number().min(0).max(100),
  shippingType: z
    .enum(["RGE", "RETIRA", "CORREO", "EXPRESO"])
    .optional()
    .nullable(),
  paymentTerms: z.string().optional().nullable(),
  userMercadoPago: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

// ==========================================
// 2. COMPONENTE REUTILIZABLE DE BÚSQUEDA (COMBOBOX)
// ==========================================
const ComboboxField = ({
  field,
  data,
  placeholder,
  searchPlaceholder,
}: {
  field: any;
  data: any[] | undefined;
  placeholder: string;
  searchPlaceholder: string;
}) => {
  const [open, setOpen] = useState(false);

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
            {field.value ? (
              data?.find((item) => item.id === field.value)?.name
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* w-[--radix-popover-trigger-width] mantiene el menú del mismo ancho exacto que el botón */}
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border-slate-200 shadow-md z-50">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9 border-none focus:ring-0"
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm text-slate-500">
              No se encontraron resultados.
            </CommandEmpty>
            <CommandGroup>
              {data?.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    field.onChange(item.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-100 text-slate-700 truncate"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-blue-600 flex-shrink-0",
                      field.value === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{item.name}</span>
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
// 3. PÁGINA PRINCIPAL
// ==========================================
export const ClientesPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clients", { page, search: searchTerm }],
    queryFn: () => getClients({ page, limit: 50, search: searchTerm }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  const openForm = (client?: Client) => {
    setSelectedClient(client || null);
    setIsFormOpen(true);
  };

  const openDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const clients = data?.data || [];
  const meta = data?.meta;

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar la base de clientes.
      </div>
    );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Gestión de Clientes
        </h1>
        <Button
          onClick={() => openForm()}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
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
              placeholder="Buscar por código, nombre o CUIT..."
              className="pl-9 h-10 w-full border-slate-200"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
          >
            Buscar
          </Button>
        </form>
        {meta && (
          <div className="text-sm text-slate-500 font-medium">
            Total: {meta.total}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-md flex-1 overflow-auto shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[100px] font-semibold text-slate-700">
                Código
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Razón Social
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                CUIT/DNI
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Ciudad
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Rubro
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                Dcto.
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
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-slate-500"
                >
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-slate-50 py-1 cursor-pointer border-b border-slate-100 last:border-0"
                  onClick={() => openDetails(client)}
                >
                  <TableCell className="font-mono text-xs font-medium text-slate-500">
                    {client.code}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {client.name}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {client.cuitDni || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {client.city?.name || "-"}
                  </TableCell>
                  <TableCell>
                    {client.category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {client.category.name}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    {client.discount > 0
                      ? `${(client.discount * 100).toFixed(0)}%`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        openForm(client);
                      }}
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
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-md shadow-sm">
          {/* Versión Escritorio */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Mostrando{" "}
                <span className="font-medium text-slate-900">
                  {(meta.page - 1) * meta.limit + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium text-slate-900">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span>{" "}
                de{" "}
                <span className="font-medium text-slate-900">{meta.total}</span>{" "}
                clientes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((old) => Math.max(old - 1, 1))}
                disabled={meta.page === 1}
                className="bg-white"
              >
                Anterior
              </Button>
              <span className="text-sm font-medium text-slate-600 px-2">
                Página {meta.page} de {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((old) => Math.min(old + 1, meta.totalPages))
                }
                disabled={meta.page === meta.totalPages}
                className="bg-white"
              >
                Siguiente
              </Button>
            </div>
          </div>

          {/* Versión Móvil */}
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={meta.page === 1}
              variant="outline"
              size="sm"
            >
              Anterior
            </Button>
            <span className="text-sm font-medium text-slate-600 self-center">
              {meta.page} / {meta.totalPages}
            </span>
            <Button
              onClick={() =>
                setPage((old) => Math.min(old + 1, meta.totalPages))
              }
              disabled={meta.page === meta.totalPages}
              variant="outline"
              size="sm"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <ClientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        client={selectedClient}
      />
      <ClientDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        client={selectedClient}
      />
    </div>
  );
};

// ==========================================
// 4. MODAL DE FORMULARIO (CREAR/EDITAR)
// ==========================================
const ClientFormModal = ({
  isOpen,
  onClose,
  client,
}: {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}) => {
  const queryClient = useQueryClient();

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: getCities,
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
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
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    values: client
      ? {
          ...client,
          discount: client.discount * 100,
        }
      : { code: "", name: "", discount: 0 },
  });

  const createMut = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente creado con éxito");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al crear el cliente"),
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => updateClient(client!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente actualizado");
      onClose();
      reset();
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const onSubmit = (data: ClientFormValues) => {
    const payload = {
      ...data,
      discount: data.discount / 100,
      searchName: data.name, // Tomamos el searchName idéntico al name automáticamente
    };
    if (client) updateMut.mutate(payload);
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
      <DialogContent className="sm:max-w-[900px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {client ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* SECCIÓN 1: DATOS PRINCIPALES */}
          <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" /> Datos Principales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Código
                </label>
                <Input
                  {...register("code")}
                  placeholder="Ej: AGU017"
                  className="h-9 bg-white"
                />
                {errors.code && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.code.message}
                  </span>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Razón Social / Nombre
                </label>
                <Input
                  {...register("name")}
                  placeholder="Ej: Aguilar Facundo"
                  className="h-9 bg-white"
                />
                {errors.name && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.name.message}
                  </span>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  CUIT / DNI
                </label>
                <Input {...register("cuitDni")} className="h-9 bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Condición Fiscal
                </label>
                <Input
                  {...register("taxCategory")}
                  placeholder="Ej: Consumidor Final"
                  className="h-9 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Rubro
                </label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <ComboboxField
                      field={field}
                      data={categories}
                      placeholder="Seleccionar rubro..."
                      searchPlaceholder="Buscar rubro..."
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CONTACTO Y UBICACIÓN */}
          <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Contacto y Ubicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Dirección
                </label>
                <Input
                  {...register("address")}
                  placeholder="Ej: Bahía Blanca 2651 1° B"
                  className="h-9 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Localidad
                </label>
                <Controller
                  name="cityId"
                  control={control}
                  render={({ field }) => (
                    <ComboboxField
                      field={field}
                      data={cities}
                      placeholder="Seleccionar localidad..."
                      searchPlaceholder="Buscar localidad..."
                    />
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Teléfono Principal
                </label>
                <Input {...register("phone")} className="h-9 bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Teléfono Alternativo
                </label>
                <Input {...register("altPhone")} className="h-9 bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Email
                </label>
                <Input
                  {...register("email")}
                  type="email"
                  className="h-9 bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: LOGÍSTICA Y FINANZAS */}
          <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" /> Logística y Finanzas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      <SelectContent className="bg-white border-slate-200 shadow-md">
                        <SelectItem
                          value="RETIRA"
                          className="hover:bg-slate-100 cursor-pointer text-slate-700"
                        >
                          Retira por local
                        </SelectItem>
                        <SelectItem
                          value="EXPRESO"
                          className="hover:bg-slate-100 cursor-pointer text-slate-700"
                        >
                          Expreso / Comisionista
                        </SelectItem>
                        <SelectItem
                          value="CORREO"
                          className="hover:bg-slate-100 cursor-pointer text-slate-700"
                        >
                          Correo
                        </SelectItem>
                        <SelectItem
                          value="RGE"
                          className="hover:bg-slate-100 cursor-pointer text-slate-700"
                        >
                          RGE
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Transporte Asignado
                </label>
                <Controller
                  name="carrierId"
                  control={control}
                  render={({ field }) => (
                    <ComboboxField
                      field={field}
                      data={carriers}
                      placeholder="Seleccionar transporte..."
                      searchPlaceholder="Buscar transporte..."
                    />
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Condición de Pago
                </label>
                <Input
                  {...register("paymentTerms")}
                  placeholder="Ej: Siempre Final 10%"
                  className="h-9 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Descuento (%)
                </label>
                <Input
                  type="number"
                  {...register("discount", { valueAsNumber: true })}
                  className="h-9 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Observaciones / Notas
                </label>
                <Textarea
                  {...register("notes")}
                  className="min-h-[60px] resize-none bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-sm"
            >
              {createMut.isPending || updateMut.isPending
                ? "Guardando..."
                : "Guardar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ==========================================
// 5. MODAL DE DETALLES (SOLO LECTURA)
// ==========================================
const ClientDetailsModal = ({
  isOpen,
  onClose,
  client,
}: {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}) => {
  if (!client) return null;

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex flex-col py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900">{value || "-"}</span>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[700px] bg-white border border-slate-200 shadow-xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center justify-between">
            {client.name}
            <span className="text-sm font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600">
              {client.code}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" /> Comercial
            </h4>
            <InfoRow label="CUIT / DNI" value={client.cuitDni} />
            <InfoRow label="Condición Fiscal" value={client.taxCategory} />
            <InfoRow label="Rubro" value={client.category?.name} />
            <InfoRow label="Cond. de Pago" value={client.paymentTerms} />
            <InfoRow
              label="Descuento"
              value={
                client.discount > 0
                  ? `${(client.discount * 100).toFixed(0)}%`
                  : "Sin descuento"
              }
            />
          </div>

          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-blue-600" /> Contacto y Logística
            </h4>
            <InfoRow label="Email" value={client.email} />
            <InfoRow
              label="Teléfonos"
              value={`${client.phone || ""} ${client.altPhone ? `/ ${client.altPhone}` : ""}`}
            />
            <InfoRow
              label="Ubicación"
              value={`${client.address || ""} ${client.city?.name ? `(${client.city.name})` : ""}`}
            />
            <InfoRow label="Tipo de Envío" value={client.shippingType} />
            <InfoRow label="Transporte" value={client.carrier?.name} />
          </div>
        </div>

        {client.notes && (
          <div className="mt-6 p-4 bg-yellow-50/80 rounded-lg border border-yellow-200/60 shadow-sm">
            <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider">
              Observaciones
            </span>
            <p className="text-sm text-yellow-900 mt-1.5 leading-relaxed">
              {client.notes}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
