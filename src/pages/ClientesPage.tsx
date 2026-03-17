// src/pages/ClientesPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Users,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getClients } from "@/services/clientService";
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

export const ClientesPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // React Query: La magia ocurre aquí.
  // Al poner 'page' y 'searchTerm' en el queryKey, se hace refetch automático al cambiar.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["clients", { page, search: searchTerm }],
    queryFn: () => getClients({ page, limit: 50, search: searchTerm }),
  });

  // Manejador de búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Volvemos a la página 1 al buscar
    setSearchTerm(searchInput);
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
      {/* 1. HEADER Y BARRA DE HERRAMIENTAS */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Gestión de Clientes
        </h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-md">
        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-sm items-center space-x-2"
        >
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Buscar por código, nombre o CUIT..."
              className="pl-9 h-10 w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
          >
            Buscar
          </Button>
        </form>

        {meta && (
          <div className="text-sm text-slate-500 font-medium">
            Total: {meta.total} clientes
          </div>
        )}
      </div>

      {/* 2. TABLA DE DATOS (Alta densidad) */}
      <div className="bg-white border border-slate-200 rounded-md flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Razón Social</TableHead>
              <TableHead>CUIT/DNI</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Rubro</TableHead>
              <TableHead className="text-right">Dcto.</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-slate-500"
                >
                  Cargando clientes...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-10 w-10 text-slate-300" />
                    <p className="text-base font-medium text-slate-900">
                      No se encontraron clientes
                    </p>
                    <p className="text-sm">
                      Prueba con otro término de búsqueda o crea un cliente
                      nuevo.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50 py-1">
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
                    {client.discount > 0 ? `${client.discount * 100}%` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. CONTROLES DE PAGINACIÓN */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-sm text-slate-500">
            Página <strong className="text-slate-900">{meta.page}</strong> de{" "}
            {meta.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page === 1}
              className="border-slate-300 text-slate-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page === meta.totalPages}
              className="border-slate-300 text-slate-700"
            >
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
