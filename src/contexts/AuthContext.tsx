import { createContext, useContext, useEffect, useState } from "react";
import { pb } from "../lib/pb";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return context;
};