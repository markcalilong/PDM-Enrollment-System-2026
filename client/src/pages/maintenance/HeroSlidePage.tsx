import { useState, useEffect, useCallback, useRef } from "react";
import { heroSlideService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { HiOutlinePhoto } from "react-icons/hi2";
import type { HeroSlide } from "@shared/types";

export function HeroSlidePage() {
  const [items, setItems] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await heroSlideService.getAll();
      setItems((res as any).data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setTitle(""); setSubtitle(""); setButtonText(""); setButtonLink("");
    setSortOrder(0); setIsActive(true); setPreview(null); setError(null);
    if (fileRef.current) fileRef.current.value = "";
    setModalOpen(true);
  };

  const openEdit = (item: HeroSlide) => {
    setEditing(item);
    setTitle(item.title); setSubtitle(item.subtitle || "");
    setButtonText(item.button_text || ""); setButtonLink(item.button_link || "");
    setSortOrder(item.sort_order); setIsActive(item.is_active);
    setPreview(item.image_path); setError(null);
    if (fileRef.current) fileRef.current.value = "";
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (!editing && !fileRef.current?.files?.[0]) { setError("Image is required"); return; }

    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("subtitle", subtitle);
      fd.append("button_text", buttonText);
      fd.append("button_link", buttonLink);
      fd.append("sort_order", String(sortOrder));
      fd.append("is_active", String(isActive));
      const file = fileRef.current?.files?.[0];
      if (file) fd.append("image", file);

      if (editing) {
        await heroSlideService.update(editing.id, fd);
      } else {
        await heroSlideService.create(fd);
      }
      setModalOpen(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async (item: HeroSlide) => {
    if (!confirm(`Delete slide "${item.title}"?`)) return;
    try {
      await heroSlideService.remove(item.id);
      await fetchAll();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="Hero Slides" subtitle="Manage the image slider on the landing page" onAdd={openCreate} />
      <DataTable
        columns={[
          {
            key: "image_path", header: "Image",
            render: (item: HeroSlide) => (
              <img src={item.image_path} alt="" className="h-12 w-20 rounded-lg object-cover" />
            ),
          },
          { key: "title", header: "Title", render: (item: HeroSlide) => <span className="font-medium">{item.title}</span> },
          { key: "subtitle", header: "Subtitle", render: (item: HeroSlide) => item.subtitle || <span className="text-gray-400">-</span> },
          { key: "sort_order", header: "Order" },
          {
            key: "is_active", header: "Status",
            render: (item: HeroSlide) =>
              item.is_active
                ? <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Active</span>
                : <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Inactive</span>,
          },
        ]}
        data={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Slide" : "Add Slide"} size="lg">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {/* Image Upload */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">
              Slide Image {!editing && <span className="text-red-500">*</span>}
            </label>
            <div
              className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 hover:border-primary-400 transition cursor-pointer overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="h-40 w-full rounded-lg object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
                  <HiOutlinePhoto className="h-10 w-10" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs text-gray-400">JPG, PNG or WebP (max 5MB)</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <Input label="Title" placeholder="e.g. Welcome to our campus" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Subtitle" placeholder="e.g. Empowering students since 1990" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Button Text" placeholder="e.g. Enroll Now" value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
            <Input label="Button Link" placeholder="e.g. /register" value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Sort Order" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
