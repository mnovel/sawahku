import { createContext, useEffect, useState } from "react";
import { pb } from "../lib/pb";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(
    pb.authStore.model as unknown as User,
  );

  useEffect(() => {
    return pb.authStore.onChange((_token, model) => {
      setUser(model as unknown as User);
    });
  }, []);

  const login = async (email: string, password: string) => {
    await pb.collection("users").authWithPassword(email, password);
  };

  const logout = () => pb.authStore.clear();

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from "../hooks/useAuth";
