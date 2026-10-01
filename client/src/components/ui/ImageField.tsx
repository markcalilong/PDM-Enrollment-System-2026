import { useRef, useState } from "react";
import { HiOutlinePhoto, HiOutlineXMark } from "react-icons/hi2";
import { Button } from "./Button";

/** State for an optional image upload with preview + remove (sent as `image` / `remove_image`). */
export function useImageField() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  return {
    file,
    preview,
    reset(existing: string | null) {
      setFile(null);
      setPreview(existing);
      setRemoved(false);
    },
    select(f: File) {
      setFile(f);
      setRemoved(false);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    },
    remove() {
      setFile(null);
      setPreview(null);
      setRemoved(true);
    },
    appendTo(fd: FormData) {
      if (file) fd.append("image", file);
      if (removed) fd.append("remove_image", "true");
    },
  };
}

export function ImageField({ label = "Image", field }: { label?: string; field: ReturnType<typeof useImageField> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {field.preview ? (
            <>
              <img src={field.preview} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  field.remove();
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <HiOutlinePhoto className="h-10 w-10" />
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) field.select(f);
            }}
            className="hidden"
          />
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            {field.preview ? "Change Image" : "Upload Image"}
          </Button>
          <p className="mt-1.5 text-xs text-gray-500">Optional. PNG, JPG, or WebP. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}
