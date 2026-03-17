// src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { siteConfig, sidebarNavigation } from "@/config";
import { useUiStore } from "@/store/useUiStore";
import { Menu } from "lucide-react";

export const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useUiStore();

  return (
    <aside
      className={`bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Cabecera del Sidebar */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {isSidebarOpen && (
          <span className="font-bold text-white truncate">
            {siteConfig.name}
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-2">
        {sidebarNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {isSidebarOpen && (
              <span className="text-sm font-medium">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuario / Perfil (Fijo abajo) */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white">Nahuel</span>
              <span className="text-xs text-slate-500">Administrador</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
