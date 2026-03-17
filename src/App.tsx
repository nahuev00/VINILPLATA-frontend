// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { Toaster } from "sonner";
import { MaterialesPage } from "./pages/MaterialesPage";
import { EstacionesPage } from "./pages/EstacionesPage";
import { ClientesPage } from "./pages/ClientesPage";
import { CiudadesPage } from "./pages/CiudadesPage";
import { TransportesPage } from "./pages/TransportesPage";

// Componentes temporales (luego los moveremos a src/pages/)
const Dashboard = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900">Tablero Principal</h1>
    <p className="text-slate-500 mt-2">Bienvenido al ERP</p>
  </div>
);
const Ordenes = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900">Órdenes de Trabajo</h1>
  </div>
);
const NotFound = () => (
  <div>
    <h1 className="text-2xl font-bold text-red-600">
      404 - Pantalla no encontrada
    </h1>
  </div>
);

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Ruta Padre que envuelve con el Layout */}
          <Route path="/" element={<MainLayout />}>
            {/* Rutas Hijas que se renderizan dentro del <Outlet /> del Layout */}
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="ordenes" element={<Ordenes />} />
            <Route path="materiales" element={<MaterialesPage />} />
            <Route path="produccion" element={<EstacionesPage />} />
            <Route path="ciudades" element={<CiudadesPage />} />
            <Route path="transportes" element={<TransportesPage />} />

            {/* Captura de rutas inexistentes */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
