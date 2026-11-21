/// <reference path="../pb_data/types.d.ts" />

// Sinkronisasi API rules untuk instalasi lama / hasil restore backup.
// - setting        : baca publik (branding & nota), tulis wajib login
// - transaksi_sewa : view publik agar /nota/:id bisa dibuka tanpa login,
//                    list & tulis wajib login; data penyewa tidak ikut
//                    terbuka karena expand mengikuti penyewa.viewRule
// - sawah          : list sudah publik, view disamakan agar expand `sawah`
//                    pada nota publik tidak kosong
// Idempoten: aman dijalankan berulang.

const LOGIN = '@request.auth.id != ""';

migrate(
  (app) => {
    function setRules(name, rules) {
      let collection;
      try {
        collection = app.findCollectionByNameOrId(name);
      } catch {
        return; // koleksi belum ada, biarkan migrasi skema yang membuat
      }
      collection.listRule = rules.list ?? null;
      collection.viewRule = rules.view ?? null;
      if (rules.create !== undefined) collection.createRule = rules.create;
      if (rules.update !== undefined) collection.updateRule = rules.update;
      if (rules.delete !== undefined) collection.deleteRule = rules.delete;
      app.save(collection);
    }

    setRules("setting", {
      list: "", view: "", create: LOGIN, update: LOGIN, delete: LOGIN,
    });
    setRules("transaksi_sewa", {
      list: LOGIN, view: "", create: LOGIN, update: LOGIN, delete: LOGIN,
    });
    setRules("sawah", { list: "", view: "" });
  },
  (app) => {
    // Rollback: logika tulis kembali seperti semula (wajib login),
    // hanya view transaksi yang tadinya juga wajib login.
    const setRules = (name, rules) => {
      let collection;
      try {
        collection = app.findCollectionByNameOrId(name);
      } catch {
        return;
      }
      collection.listRule = rules.list ?? null;
      collection.viewRule = rules.view ?? null;
      if (rules.create !== undefined) collection.createRule = rules.create;
      if (rules.update !== undefined) collection.updateRule = rules.update;
      if (rules.delete !== undefined) collection.deleteRule = rules.delete;
      app.save(collection);
    };
    setRules("setting", {
      list: "", view: "", create: LOGIN, update: LOGIN, delete: LOGIN,
    });
    setRules("transaksi_sewa", {
      list: LOGIN, view: LOGIN, create: LOGIN, update: LOGIN, delete: LOGIN,
    });
    setRules("sawah", { list: "", view: LOGIN });
  },
);
