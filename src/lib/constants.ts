import {
  Sprout,
  Droplets,
  Wheat,
  PauseCircle,
  FileText,
} from "lucide-react";
import { createElement } from "react";

// ============================================================
// SHARED CONSTANTS — SawahKu
// Konfigurasi style dan label yang digunakan di banyak komponen
// ============================================================

export interface FaseStyle {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}

/**
 * Mendapatkan style berdasarkan fase siklus sawah
 */
export const getFaseStyle = (fase: string): FaseStyle => {
  switch (fase) {
    case "tanam":
      return {
        color: "text-emerald-600",
        bg: "bg-emerald-100",
        border: "border-emerald-200",
        icon: createElement(Sprout, { size: 16 }),
        label: "Tanam",
      };
    case "perawatan":
      return {
        color: "text-blue-600",
        bg: "bg-blue-100",
        border: "border-blue-200",
        icon: createElement(Droplets, { size: 16 }),
        label: "Perawatan",
      };
    case "panen":
      return {
        color: "text-amber-600",
        bg: "bg-amber-100",
        border: "border-amber-200",
        icon: createElement(Wheat, { size: 16 }),
        label: "Panen",
      };
    case "kosong":
      return {
        color: "text-slate-500",
        bg: "bg-slate-100",
        border: "border-slate-200",
        icon: createElement(PauseCircle, { size: 16 }),
        label: "Kosong",
      };
    default:
      return {
        color: "text-purple-600",
        bg: "bg-purple-100",
        border: "border-purple-200",
        icon: createElement(FileText, { size: 16 }),
        label: "Lainnya",
      };
  }
};

/**
 * Label fase ringkas (tanpa icon) untuk Dashboard
 */
export const getFaseLabel = (fase: string) => {
  switch (fase) {
    case "tanam":
      return { label: "Tanam", bg: "bg-emerald-100 text-emerald-700" };
    case "perawatan":
      return { label: "Perawatan", bg: "bg-blue-100 text-blue-700" };
    case "panen":
      return { label: "Panen", bg: "bg-amber-100 text-amber-700" };
    case "kosong":
      return { label: "Kosong", bg: "bg-slate-100 text-slate-600" };
    default:
      return { label: "Lainnya", bg: "bg-purple-100 text-purple-700" };
  }
};

/**
 * Style untuk status pembayaran
 */
export const getStatusBayarStyle = (statusBayar: string) => {
  switch (statusBayar) {
    case "lunas":
      return {
        label: "Lunas",
        badge: "bg-emerald-500 text-white border-emerald-600",
        text: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "dp":
      return {
        label: "DP / Sebagian",
        badge: "bg-amber-400 text-amber-950 border-amber-500",
        text: "bg-amber-100 text-amber-700 border-amber-200",
      };
    default:
      return {
        label: "Belum Bayar",
        badge: "bg-rose-500 text-white border-rose-600",
        text: "bg-red-100 text-red-700 border-red-200",
      };
  }
};

/**
 * Style untuk status sewa
 */
export const getStatusSewaStyle = (status: string) => {
  switch (status) {
    case "aktif":
      return {
        label: "Berjalan",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500 animate-pulse",
      };
    case "selesai":
      return {
        label: "Panen",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    default:
      return {
        label: "Batal",
        bg: "bg-slate-100 text-slate-600 border-slate-300",
        dot: "bg-slate-400",
      };
  }
};