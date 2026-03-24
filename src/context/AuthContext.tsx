// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { type AuthUser } from "../services/authService";

interface AuthContextType {
  user: AuthUser | null;
  loginUser: (userData: AuthUser) => void;
  logoutUser: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, revisamos si ya había alguien logueado en el localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("erp_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginUser = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem("erp_user", JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("erp_user");
  };

  if (loading) return null; // Previene parpadeos de rutas

  return (
    <AuthContext.Provider
      value={{ user, loginUser, logoutUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  return context;
};
