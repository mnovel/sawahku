import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, Eraser, Check } from "lucide-react";

// ==========================================
// FUNGSI PEMANGKAS CANVAS MANUAL
// ==========================================
const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  // Tambahkan willReadFrequently untuk menghilangkan warning
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const l = pixels.data.length;
  let bound = {
    top: null as number | null,
    left: null as number | null,
    right: null as number | null,
    bottom: null as number | null,
  };
  let x, y;

  for (let i = 0; i < l; i += 4) {
    // Cek pixel yang tidak transparan
    if (pixels.data[i + 3] !== 0) {
      x = (i / 4) % canvas.width;
      y = ~~(i / 4 / canvas.width);

      if (bound.top === null) bound.top = y;
      if (bound.left === null || x < bound.left) bound.left = x;
      if (bound.right === null || x > bound.right) bound.right = x;
      if (bound.bottom === null || y > bound.bottom) bound.bottom = y;
    }
  }

  if (bound.top === null) return canvas;

  const trimHeight = (bound.bottom as number) - (bound.top as number) + 1;
  const trimWidth = (bound.right as number) - (bound.left as number) + 1;

  const copy = document.createElement("canvas");
  copy.width = trimWidth;
  copy.height = trimHeight;

  const copyCtx = copy.getContext("2d", { willReadFrequently: true });
  if (!copyCtx) return canvas;

  // Isi background dengan warna putih (agar tidak hitam saat dijadikan gambar)
  copyCtx.fillStyle = "#ffffff";
  copyCtx.fillRect(0, 0, copy.width, copy.height);

  // Gunakan drawImage, JANGAN putImageData, agar background putih tidak tertimpa
  copyCtx.drawImage(
    canvas,
    bound.left as number,
    bound.top as number,
    trimWidth,
    trimHeight,
    0,
    0,
    trimWidth,
    trimHeight,
  );

  return copy;
};

// ==========================================
// KOMPONEN MODAL
// ==========================================
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
}

export default function TandaTanganModal({ isOpen, onClose, onSave }: Props) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => sigCanvas.current?.clear();

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Tanda tangan masih kosong!");
      return;
    }

    const rawCanvas = sigCanvas.current?.getCanvas();
    if (!rawCanvas) return;

    const trimmedCanvas = trimCanvas(rawCanvas);

    // UBAH KE PNG! Agar tidak ada kompresi aneh dan hasilnya transparan/putih bersih
    const dataUrl = trimmedCanvas.toDataURL("image/png");

    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm">
            Tanda Tangan Penyewa
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="#000000" // Warna tinta hitam
              canvasProps={{
                width: 500,
                height: 200,
                className: "w-full h-[200px] cursor-crosshair touch-none",
              }}
            />
            <div className="absolute bottom-2 left-0 w-full text-center pointer-events-none opacity-30">
              <span className="text-xs font-semibold">
                Goreskan Tanda Tangan di Sini
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button
            onClick={clear}
            className="px-4 py-2 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Eraser size={16} /> Hapus
          </button>
          <button
            onClick={save}
            className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <Check size={16} /> Simpan TTD
          </button>
        </div>
      </div>
    </div>
  );
}
