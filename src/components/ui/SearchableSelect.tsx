import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Bila diisi, muncul opsi untuk mengosongkan pilihan (mis. "Semua Penyewa"). */
  emptyLabel?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Select yang bisa dicari (combobox). Dipakai untuk field Penyewa agar
 * pengguna bisa mengetik sebagian nama tanpa menggulir daftar panjang.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  emptyLabel,
  icon,
  size = "md",
  className = "",
  inputClassName = "",
  ariaLabel,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? options.filter((o) =>
          `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q),
        )
      : options;
    return emptyLabel ? [{ value: "", label: emptyLabel }, ...matched] : matched;
  }, [options, query, emptyLabel]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  const sizeClass = size === "sm" ? "py-2.5 text-xs" : "py-2.5 text-sm";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
      )}

      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        disabled={disabled}
        value={open ? query : (selected?.label ?? "")}
        placeholder={open ? (selected?.label ?? placeholder) : placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActive(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) =>
              open ? (i + 1 < list.length ? i + 1 : i) : 0,
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i > 0 ? i - 1 : 0));
          } else if (e.key === "Enter") {
            if (open && list[active]) {
              e.preventDefault();
              choose(list[active].value);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
          }
        }}
        onBlur={(e) => {
          const rt = e.relatedTarget as Node | null;
          if (!rootRef.current?.contains(rt)) {
            setOpen(false);
            setQuery("");
          }
        }}
        className={`w-full rounded-xl border bg-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-slate-800 ${icon ? "pl-10" : "pl-3"} pr-9 ${sizeClass} ${inputClassName || "border-slate-300"}`}
      />

      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
        {!emptyLabel && value && !disabled && (
          <button
            type="button"
            aria-label="Kosongkan pilihan"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose("")}
            className="p-0.5 hover:text-slate-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={16} />
      </span>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1 text-sm"
        >
          {list.length === 0 ? (
            <li className="px-3 py-2 text-xs italic text-slate-400">
              Tidak ada pilihan yang cocok.
            </li>
          ) : (
            list.map((o, i) => (
              <li
                key={o.value || "__empty__"}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
                onMouseEnter={() => setActive(i)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${i === active ? "bg-emerald-50" : ""}`}
              >
                <span className="truncate text-slate-700">
                  {o.label}
                  {o.hint && (
                    <span className="ml-1 text-xs text-slate-400">{o.hint}</span>
                  )}
                </span>
                {o.value === value && o.value !== "" && (
                  <Check size={14} className="text-emerald-600 shrink-0" />
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
