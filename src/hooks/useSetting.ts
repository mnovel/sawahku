import { useEffect, useState } from "react";
import { pb } from "../lib/pb";

export interface SettingApp {
  id?: string;
  nama_aplikasi?: string;
  deskripsi?: string;
  nama_pengelola?: string;
  alamat?: string;
  nomor_wa?: string;
  catatan_nota?: string;
}

export default function useSetting() {
  const [setting, setSetting] = useState<SettingApp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSetting() {
    try {
      setLoading(true);
      setError(null);
      const records = await pb.collection("setting").getFullList<SettingApp>();
      if (records.length > 0) {
        setSetting(records[0]);
      } else {
        setSetting(null);
      }
    } catch (err: any) {
      console.error("Gagal memuat setting aplikasi:", err);
      setError(err?.message || "Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSetting();
  }, []);

  return { setting, loading, error, refetch: fetchSetting };
}