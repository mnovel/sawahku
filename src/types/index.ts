// ============================================================
// SHARED TYPES — SawahKu
// Definisi tipe data terpusat untuk seluruh aplikasi
// ============================================================

export interface Sawah {
  id: string;
  nama: string;
  lokasi?: string;
  luas_total: number;
  harga_sewa: number;
  status: "tersedia" | "disewa";
  deskripsi?: string;
  foto?: string;
  peta_url?: string;
}

export interface Sertifikat {
  id: string;
  sawah: string;
  jenis: string;
  nomor: string;
  pemilik: string;
  file?: string;
}

export interface Penyewa {
  id: string;
  nama: string;
  kontak?: string;
  alamat?: string;
  status: "aktif" | "nonaktif";
  foto?: string;
}

export interface TransaksiSewa {
  id: string;
  sawah: string;
  penyewa: string;
  tanggal_mulai: string;
  tanggal_panen?: string;
  tanggal_jatuh_tempo?: string;
  harga_sewa: number;
  /** Jumlah musim tanam yang disewa dalam satu kontrak (default 1). */
  jumlah_musim?: number;
  /** Salinan nama penyewa untuk nota publik (tanpa data kontak). */
  penyewa_nama?: string;
  status: "aktif" | "selesai" | "batal";
  status_bayar: "belum_bayar" | "dp" | "lunas";
  nominal_dibayar: number;
  ttd_penyewa?: string;
  expand?: {
    sawah?: Sawah;
    penyewa?: Penyewa;
  };
}

export interface LogBulanan {
  id: string;
  transaksi?: string;
  periode: string;
  fase: "tanam" | "perawatan" | "panen" | "kosong" | "lain";
  keterangan: string;
  foto?: string;
  expand?: {
    transaksi?: {
      expand?: {
        sawah?: { nama: string };
        penyewa?: { nama: string };
      };
    };
  };
}

export interface RiwayatBayar {
  id: string;
  transaksi?: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
}

export interface SettingApp {
  id?: string;
  nama_aplikasi?: string;
  deskripsi?: string;
  deskripsi_singkat?: string;
  keyword?: string;
  nama_pengelola?: string;
  domain?: string;
  logo?: string;
  alamat?: string;
  nomor_wa?: string;
  catatan_nota?: string;
}

export interface User {
  id: string;
  email: string;
}

// Form types
export interface TransaksiForm {
  sawah: string;
  penyewa: string;
  tanggal_mulai: string;
  tanggal_jatuh_tempo: string;
  harga_sewa: string;
  jumlah_musim: string;
  status_bayar: string;
  nominal_dibayar: string;
}

export interface LogForm {
  periode: string;
  fase: string;
  keterangan: string;
  foto: File | null;
}

export interface PayForm {
  tanggal: string;
  nominal: string;
  keterangan: string;
}