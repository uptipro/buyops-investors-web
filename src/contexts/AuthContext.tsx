import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../services/api-service";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{
    ok: boolean;
    requiresTwoFactor?: boolean;
    interimToken?: string;
  }>;
  register: (data: object) => Promise<void>;
  logout: () => void;
  verify2FA: (interimToken: string, token: string) => Promise<boolean>;
  updateUser: (u: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("buyops_user");
    const token = localStorage.getItem("token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const data = res.data;
    if (data.requiresTwoFactor) {
      return {
        ok: false,
        requiresTwoFactor: true,
        interimToken: data.interimToken,
      };
    }
    const { access_token, user: userData } = data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("buyops_user", JSON.stringify(userData));
    setUser(userData);
    return { ok: true };
  };

  const register = async (data: object) => {
    const res = await authApi.register(data);
    const { access_token, user: userData } = res.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("buyops_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("buyops_user");
    setUser(null);
  };

  const verify2FA = async (interimToken: string, token: string) => {
    try {
      const res = await authApi.verify2FA(interimToken, token);
      const { access_token, user: userData } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("buyops_user", JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch {
      return false;
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("buyops_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, verify2FA, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
