// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, User, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import {
  login,
  loginSchema,
  type LoginCredentials,
} from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await login(data);
      loginUser(response.user);
      toast.success(`Bienvenido, ${response.user.name}`);

      // 👇 RUTEO INTELIGENTE POR ROLES 👇
      if (response.user.role === "ADMIN") {
        navigate("/"); // Redirige al inicio para el Admin
      } else if (response.user.role === "PACKAGER") {
        navigate("/empaque"); // Los empaquetadores van a su módulo
      } else if (response.user.role === "SHIPPER") {
        navigate("/envios"); // 👈 NUEVO: Va a la vista aislada de Despachos
      } else {
        navigate("/estacion-panel"); // Las máquinas van a su tablero
      }
    } catch (error) {
      toast.error("Credenciales inválidas. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Printer className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            VINILPLATA ERP
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Gestión Integral de Producción
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <Input
                  {...register("username")}
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="Ej: admin"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <span className="text-xs text-red-500 font-medium mt-1 block">
                  {errors.username.message}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <Input
                  type="password"
                  {...register("password")}
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 font-medium mt-1 block">
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Ingresar al Sistema"
              )}
            </Button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-xs font-medium text-slate-400">
        © {new Date().getFullYear()} VINILPLATA. Todos los derechos reservados.
      </p>
    </div>
  );
};
