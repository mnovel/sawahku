/// <reference path="../pb_data/types.d.ts" />

// Menyimpan salinan nama penyewa di transaksi_sewa supaya nota publik
// (/nota/:id) bisa menampilkan nama penyewa tanpa membuka koleksi penyewa
// (kontak & alamat tetap tertutup untuk tamu).
// Idempoten: field hanya dibuat sekali, backfill hanya mengisi yang kosong.

migrate(
  (app) => {
    const transaksi = app.findCollectionByNameOrId("transaksi_sewa");

    if (!transaksi.fields.getByName("penyewa_nama")) {
      transaksi.fields.add(new TextField({ name: "penyewa_nama", max: 255 }));
      app.save(transaksi);
    }

    const records = app.findAllRecords("transaksi_sewa");
    for (const record of records) {
      if (record.get("penyewa_nama")) continue;
      try {
        const penyewa = app.findRecordById("penyewa", record.get("penyewa"));
        record.set("penyewa_nama", penyewa.get("nama") || "");
        app.save(record);
      } catch {
        // penyewa sudah tidak ada; biarkan kosong.
      }
    }
  },
  (app) => {
    const transaksi = app.findCollectionByNameOrId("transaksi_sewa");
    const field = transaksi.fields.getByName("penyewa_nama");
    if (field) {
      transaksi.fields.removeById(field.id);
      app.save(transaksi);
    }
  },
);
