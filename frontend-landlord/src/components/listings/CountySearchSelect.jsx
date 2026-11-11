import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";

export default function CountySearchSelect({ id = "county", value, options, onChange, disabled = false, invalid = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return term ? options.filter((option) => option.label.toLocaleLowerCase().includes(term)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (option) => {
    onChange({ target: { name: "county", value: option.value } });
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border-2 bg-white px-4 py-3 text-left outline-none focus:border-[#126542] disabled:cursor-not-allowed disabled:bg-slate-100 ${invalid ? "border-red-400 bg-red-50" : "border-[#E2E8F0]"}`}
      >
        <span className={selected ? "text-slate-900" : "text-slate-500"}>{selected?.label || "Select County"}</span>
        <FiChevronDown aria-hidden="true" className={`shrink-0 text-[#126542] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-100 p-2">
          <div className="relative">
            <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search counties" aria-label="Search counties" className="h-10 w-full border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#126542]" />
          </div>
        </div>
        <ul role="listbox" aria-label="Counties" className="max-h-60 overflow-y-auto py-1">
          {filteredOptions.length ? filteredOptions.map((option) => <li key={option.value} role="option" aria-selected={value === option.value}>
            <button type="button" onClick={() => choose(option)} className="flex min-h-10 w-full items-center justify-between px-3 text-left text-sm text-slate-800 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none">
              {option.label}{value === option.value && <FiCheck aria-hidden="true" className="text-emerald-700" />}
            </button>
          </li>) : <li className="px-3 py-4 text-sm text-slate-500">No counties found</li>}
        </ul>
      </div>}
    </div>
  );
}
