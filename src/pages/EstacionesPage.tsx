// src/pages/EstacionesPage.tsx
import { useState } from "react";
import {
  Plus,
  Pencil,
  Gauge,
  Monitor,
  Scissors,
  Box,
  Truck,
} from "lucide-react";

import { useStations } from "@/hooks/useStations";
import { type Station } from "@/services/stationService";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StationFormModal } from "@/components/StationFormModal";

export const EstacionesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // 1 Sola línea reemplaza TODO el bloque anterior de Query y Mapeo
  const { stations, isLoading, isError } = useStations();

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
            ) : stations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                        <Gauge className="w-3.5 h-3.5" />{" "}
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
