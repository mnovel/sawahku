/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// SAWAHKU — Skema PocketBase
// ------------------------------------------------------------
// Migrasi ini idempoten:
//  - Koleksi yang belum ada akan dibuat lengkap.
//  - Koleksi yang sudah ada TIDAK diubah (termasuk rules-nya),
//    kecuali penambahan field `jumlah_musim` bila belum ada.
//
// Cara pakai: letakkan folder `pb_migrations` di samping binary
// PocketBase, lalu jalankan `./pocketbase migrate up` (atau
// restart server; PocketBase otomatis menjalankan migrasi baru).
// Butuh PocketBase >= 0.23 (properti `fields`).
// ============================================================

migrate(
  (app) => {
    // ---------- helper ----------
    function ensureCollection(name, fields, rules) {
      try {
        return app.findCollectionByNameOrId(name);
      } catch {
        const collection = new Collection({
          type: "base",
          name: name,
          fields: fields,
          listRule: rules.list ?? null,
          viewRule: rules.view ?? null,
          createRule: rules.create ?? null,
          updateRule: rules.update ?? null,
          deleteRule: rules.delete ?? null,
        });
        app.save(collection);
        return collection;
      }
    }

    const PUBLIC_READ_ADMIN_WRITE = {
      list: "",
      view: "",
      create: null,
      update: null,
      delete: null,
    };
    const ADMIN_ONLY = {
      list: null,
      view: null,
      create: null,
      update: null,
      delete: null,
    };
    // Nota digital (/nota/:id) dibuka tanpa login, sehingga record
    // transaksi harus bisa dibaca publik. Data penyewa tetap tertutup.
    const NOTA_PUBLIC_VIEW = {
      list: null,
      view: "",
      create: null,
      update: null,
      delete: null,
    };

    // ---------- sawah ----------
    const sawah = ensureCollection(
      "sawah",
      [
        { name: "nama", type: "text", required: true, max: 255 },
        { name: "lokasi", type: "text", max: 500 },
        { name: "luas_total", type: "number", min: 0, onlyInt: false },
        { name: "harga_sewa", type: "number", min: 0, onlyInt: false },
        {
          name: "status",
          type: "select",
          values: ["tersedia", "disewa"],
          maxSelect: 1,
          required: true,
        },
        { name: "deskripsi", type: "text", max: 0 },
        { name: "foto", type: "file", maxSelect: 1, maxSize: 5242880 },
        { name: "url_maps", type: "text", max: 1000 },
      ],
      PUBLIC_READ_ADMIN_WRITE,
    );

    // ---------- sertifikat ----------
    ensureCollection(
      "sertifikat",
      [
        {
          name: "sawah",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: sawah.id,
          cascadeDelete: true,
        },
        { name: "tipe_hak", type: "text", max: 100 },
        { name: "nib", type: "number", min: 0, onlyInt: true },
        { name: "luas", type: "number", min: 0 },
        { name: "url_maps", type: "text", max: 1000 },
        { name: "url_bhumi", type: "text", max: 1000 },
      ],
      PUBLIC_READ_ADMIN_WRITE,
    );

    // ---------- penyewa ----------
    const penyewa = ensureCollection(
      "penyewa",
      [
        { name: "nama", type: "text", required: true, max: 255 },
        { name: "kontak", type: "text", max: 50 },
        { name: "alamat", type: "text", max: 0 },
        {
          name: "status",
          type: "select",
          values: ["aktif", "nonaktif"],
          maxSelect: 1,
          required: true,
        },
        { name: "foto", type: "file", maxSelect: 1, maxSize: 5242880 },
      ],
      ADMIN_ONLY,
    );

    // ---------- transaksi_sewa ----------
    const transaksi = ensureCollection(
      "transaksi_sewa",
      [
        {
          name: "sawah",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: sawah.id,
          cascadeDelete: true,
        },
        {
          name: "penyewa",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: penyewa.id,
          cascadeDelete: true,
        },
        { name: "tanggal_mulai", type: "date", required: true },
        { name: "tanggal_panen", type: "date" },
        { name: "tanggal_jatuh_tempo", type: "date" },
        { name: "harga_sewa", type: "number", min: 0, required: true },
        // Banyak musim tanam dalam satu kontrak sewa (default 1).
        { name: "jumlah_musim", type: "number", min: 1, onlyInt: true },
        {
          name: "status",
          type: "select",
          values: ["aktif", "selesai", "batal"],
          maxSelect: 1,
          required: true,
        },
        {
          name: "status_bayar",
          type: "select",
          values: ["belum_bayar", "dp", "lunas"],
          maxSelect: 1,
          required: true,
        },
        { name: "nominal_dibayar", type: "number", min: 0 },
        // Tanda tangan disimpan sebagai data URL base64, jadi tanpa batas.
        { name: "ttd_penyewa", type: "text", max: 0 },
      ],
      NOTA_PUBLIC_VIEW,
    );

    // ---------- riwayat_bayar ----------
    ensureCollection(
      "riwayat_bayar",
      [
        {
          name: "transaksi",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: transaksi.id,
          cascadeDelete: true,
        },
        { name: "nominal", type: "number", min: 0, required: true },
        { name: "tanggal", type: "date" },
        { name: "keterangan", type: "text", max: 500 },
      ],
      ADMIN_ONLY,
    );

    // ---------- log_bulanan ----------
    ensureCollection(
      "log_bulanan",
      [
        {
          name: "transaksi",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: transaksi.id,
          cascadeDelete: true,
        },
        { name: "periode", type: "text", required: true, max: 7 },
        {
          name: "fase",
          type: "select",
          values: ["tanam", "perawatan", "panen", "kosong", "lain"],
          maxSelect: 1,
          required: true,
        },
        { name: "keterangan", type: "text", max: 0 },
        { name: "foto", type: "file", maxSelect: 1, maxSize: 5242880 },
      ],
      ADMIN_ONLY,
    );

    // ---------- setting ----------
    ensureCollection(
      "setting",
      [
        { name: "nama_aplikasi", type: "text", max: 100 },
        { name: "deskripsi", type: "text", max: 0 },
        { name: "deskripsi_singkat", type: "text", max: 500 },
        { name: "keyword", type: "text", max: 1000 },
        { name: "nama_pengelola", type: "text", max: 255 },
        { name: "domain", type: "text", max: 255 },
        { name: "logo", type: "file", maxSelect: 1, maxSize: 5242880 },
        { name: "alamat", type: "text", max: 0 },
        { name: "nomor_wa", type: "text", max: 50 },
        { name: "catatan_nota", type: "text", max: 0 },
      ],
      PUBLIC_READ_ADMIN_WRITE,
    );

    // ---------- pastikan field jumlah_musim ada ----------
    // Koleksi transaksi_sewa mungkin sudah ada dari instalasi lama tanpa
    // field ini. Tambahkan hanya jika belum ada, tanpa menyentuh field lain.
    const transaksiTerbaru = app.findCollectionByNameOrId("transaksi_sewa");
    if (!transaksiTerbaru.fields.getByName("jumlah_musim")) {
      transaksiTerbaru.fields.add(
        new NumberField({
          name: "jumlah_musim",
          min: 1,
          onlyInt: true,
        }),
      );
      app.save(transaksiTerbaru);
    }
  },
  (app) => {
    // Rollback: cukup lepas field baru. Koleksi tidak dihapus agar data
    // produksi tidak ikut hilang jika migrasi ini dijalankan di server lama.
    const transaksi = app.findCollectionByNameOrId("transaksi_sewa");
    const field = transaksi.fields.getByName("jumlah_musim");
    if (field) {
      transaksi.fields.removeById(field.id);
      app.save(transaksi);
    }
  },
);
