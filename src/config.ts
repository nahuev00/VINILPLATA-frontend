// src/config.ts
import {
  LayoutDashboard,
  Users,
  FilePlus,
  Files,
  MonitorPlay,
  Settings,
  MapPin,
  Truck,
  Tags,
} from "lucide-react";

export const siteConfig = {
  name: "VINILPLATA ERP",
  description: "Sistema de gestión integral para producción gráfica",
};

export const sidebarNavigation = [
  {
    title: "Tablero",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Órdenes de Trabajo",
    href: "/ordenes",
    icon: Files,
  },
  {
    title: "Produccion",
    href: "/produccion",
    icon: MonitorPlay,
  },
  {
    title: "Estaciones",
    href: "/estaciones",
    icon: MonitorPlay,
  },
  {
    title: "Materiales",
    href: "/materiales",
    icon: Settings, // Puedes cambiar el icono por uno como 'Box' o 'Layers' importándolo de lucide-react
  },
  {
    title: "Localidades",
    href: "/ciudades",
    icon: MapPin,
  },
  {
    title: "Comisionistas",
    href: "/transportes",
    icon: Truck,
  },
  {
    title: "Rubros",
    href: "/rubros",
    icon: Tags,
  },
  {
    title: "Tipos de Facturacion",
    href: "/facturacion",
    icon: Tags,
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
];
