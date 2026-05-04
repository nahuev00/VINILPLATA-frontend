// src/hooks/useStations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getStations,
  createStation,
  updateStation,
} from "@/services/stationService";

export const useStations = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["stations-list"],
    queryFn: getStations,
  });

  // Lógica de ordenamiento por flujo de producción movida aquí
  const roleOrder: Record<string, number> = {
    STATION: 1,
    PACKAGER: 2,
    SHIPPER: 3,
  };

  const sortedStations = query.data
    ? [...query.data].sort((a, b) => {
        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
      })
    : [];

  const createMut = useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations-list"] });
      toast.success("Registro creado con éxito");
    },
    onError: () => toast.error("Error al crear el registro"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateStation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations-list"] });
      toast.success("Registro actualizado");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  return {
    stations: sortedStations, // Ya devolvemos la lista ordenada
    isLoading: query.isLoading,
    isError: query.isError,
    createStation: createMut,
    updateStation: updateMut,
  };
};
