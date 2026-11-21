import { useContext } from "react";
import { NotificationContext } from "../contexts/NotificationContext";

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotify harus dipakai di dalam NotificationProvider");
  return context;
};