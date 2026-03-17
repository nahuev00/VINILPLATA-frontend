// src/components/layout/MainLayout.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const MainLayout = () => {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Área principal a la derecha */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Aquí podrías agregar un Header superior (Topbar) en el futuro si lo necesitas */}

        {/* Contenido dinámico de las pantallas con scroll independiente */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
