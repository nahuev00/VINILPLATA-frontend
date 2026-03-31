// src/services/authService.ts
import * as z from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  printSpeedPerHour: number;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
}

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  const res = await fetch(`${API_URL}/users/login`, {
    // Ajusta la ruta exacta de tu backend
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  return res.json();
};
