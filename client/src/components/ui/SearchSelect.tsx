import { useState, useRef, useEffect } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineChevronUpDown } from "react-icons/hi2";

interface Option {
  value: number;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  label: string;
  placeholder?: string;
  options: Option[];
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}

export function SearchSelect({ label, placeholder = "Search...", options, value, onChange, required }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.sublabel?.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt: Option) => {
    onChange(opt.value);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-800 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition ${
          open ? "border-primary-500 ring-1 ring-primary-500" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="truncate font-medium text-gray-800">{selected.label}</span>
            {selected.sublabel && <span className="truncate text-xs text-gray-500">{selected.sublabel}</span>}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selected && (
            <span onClick={handleClear} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700">
              <HiOutlineXMark className="h-3.5 w-3.5" />
            </span>
          )}
          <HiOutlineChevronUpDown className="h-4 w-4 text-gray-500" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg animate-in">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <HiOutlineMagnifyingGlass className="h-4 w-4 text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full text-sm outline-none placeholder:text-gray-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-500 hover:text-gray-700">
                <HiOutlineXMark className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto scrollbar-thin py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                    opt.value === value
                      ? "bg-primary-50 text-primary-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${opt.value === value ? "font-semibold" : "font-medium"}`}>{opt.label}</p>
                    {opt.sublabel && <p className="truncate text-xs text-gray-500">{opt.sublabel}</p>}
                  </div>
                  {opt.value === value && (
                    <svg className="h-4 w-4 text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
