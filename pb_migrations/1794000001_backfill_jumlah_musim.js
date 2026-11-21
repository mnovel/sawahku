/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// SAWAHKU — Penyempurnaan setelah skema awal
// ------------------------------------------------------------
// 1. Backfill `jumlah_musim` untuk record lama yang masih 0 supaya
//    nilainya konsisten dengan UI (yang menampilkan 0 sebagai 1 musim).
// 2. Pastikan field yang dipakai aplikasi tetapi belum ada pada
//    instalasi lama tetap tersedia: transaksi_sewa.keterangan dan
//    penyewa.catatan.
//
// Idempoten dan aman dijalankan berulang kali.
// ============================================================

migrate(
  (app) => {
    // ---------- 1. backfill jumlah_musim ----------
    app
      .db()
      .newQuery(
        "UPDATE transaksi_sewa SET jumlah_musim = 1 WHERE jumlah_musim IS NULL OR jumlah_musim = 0",
      )
      .execute();

    // ---------- 2. field tambahan yang belum ada ----------
    function ensureTextField(collectionName, fieldName) {
      const collection = app.findCollectionByNameOrId(collectionName);
      if (!collection.fields.getByName(fieldName)) {
        collection.fields.add(new TextField({ name: fieldName, max: 0 }));
        app.save(collection);
      }
    }

    ensureTextField("transaksi_sewa", "keterangan");
    ensureTextField("penyewa", "catatan");
  },
  (_app) => {
    // Rollback tidak mengubah data: nilai 0/1 pada jumlah_musim tidak bisa
    // dibedakan lagi setelah backfill.
  },
);
