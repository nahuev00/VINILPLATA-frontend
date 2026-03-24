import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "sonner";

import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";

import { LoginPage } from "./pages/LoginPage";
import { MaterialesPage } from "./pages/MaterialesPage";
import { EstacionesPage } from "./pages/EstacionesPage";
import { ClientesPage } from "./pages/ClientesPage";
import { CiudadesPage } from "./pages/CiudadesPage";
import { TransportesPage } from "./pages/TransportesPage";
import { RubrosPage } from "./pages/RubrosPage";
import { OrdenesPage } from "./pages/OrdenesPage";
import { ProduccionPage } from "./pages/ProduccionPage";
import { EstacionDashboardPage } from "./pages/EstacionDashboardPage";
import { EmpaquetadoPage } from "./pages/EmpaquetadoPage";
import { EnviosPage } from "./pages/EnviosPage";

const Dashboard = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900">Tablero Principal</h1>
    <p className="text-slate-500 mt-2">Bienvenido al ERP</p>
  </div>
);

const NotFound = () => (
  <div className="p-8 text-center">
    <h1 className="text-3xl font-bold text-slate-900 mb-2">404</h1>
    <p className="text-slate-500">
      La página que buscas no existe o no tienes permisos para verla.
    </p>
  </div>
);

// Guardián ADMIN
const AdminRoutes = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/login" replace />;
  return <MainLayout />;
};

// Guardián MÁQUINAS (Impresión/Terminación)
const StationRoutes = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "ADMIN" || user?.role === "PACKAGER")
    return <Navigate to="/" replace />;
  return <Outlet />;
};

// 👇 NUEVO GUARDIÁN EMPAQUETADO 👇
const PackagerRoutes = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Permitimos entrar al ADMIN (para que puedas probarlo) y al PACKAGER
  if (user?.role !== "PACKAGER" && user?.role !== "ADMIN")
    return <Navigate to="/" replace />;
  return <Outlet />;
};

const ShipperRoutes = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Permitimos entrar al ADMIN (para que puedas probarlo) y al PACKAGER
  if (user?.role !== "SHIPPER" && user?.role !== "ADMIN")
    return <Navigate to="/" replace />;
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* ZONA ADMIN */}
          <Route element={<AdminRoutes />}>
            <Route path="/" element={<Navigate to="/ordenes" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/ordenes" element={<OrdenesPage />} />
            <Route path="/materiales" element={<MaterialesPage />} />
            <Route path="/produccion" element={<ProduccionPage />} />
            <Route path="/estaciones" element={<EstacionesPage />} />
            <Route path="/ciudades" element={<CiudadesPage />} />
            <Route path="/transportes" element={<TransportesPage />} />
            <Route path="/rubros" element={<RubrosPage />} />
          </Route>

          {/* ZONA ESTACIONES */}
          <Route element={<StationRoutes />}>
            <Route path="/estacion-panel" element={<EstacionDashboardPage />} />
          </Route>

          {/*  ZONA EMPAQUETADO  */}
          <Route element={<PackagerRoutes />}>
            <Route path="/empaque" element={<EmpaquetadoPage />} />
          </Route>

          {/*  ZONA ENVIOS  */}
          <Route element={<ShipperRoutes />}>
            <Route path="/envios" element={<EnviosPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="bottom-right" />
    </AuthProvider>
  );
}

export default App;
