import { useState, useEffect, useRef, useCallback } from "react";
import { announcementService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Announcement } from "@shared/types";

const EMPTY = { title: "", content: "", category: "general", is_pinned: false, is_active: true };

export function AnnouncementPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isPinned, setIsPinned] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAll();
      setItems(res.data || res);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setTitle(EMPTY.title);
    setContent(EMPTY.content);
    setCategory(EMPTY.category);
    setIsPinned(EMPTY.is_pinned);
    setIsActive(EMPTY.is_active);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Announcement) => {
    setEditing(item);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setIsPinned(item.is_pinned);
    setIsActive(item.is_active);
    setImageFile(null);
    setImagePreview(item.image_path || null);
    setRemoveImage(false);
    setError(null);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("content", content.trim());
      fd.append("category", category);
      fd.append("is_pinned", String(isPinned));
      fd.append("is_active", String(isActive));
      if (imageFile) fd.append("image", imageFile);
      if (removeImage) fd.append("remove_image", "true");

      if (editing) {
        await announcementService.update(editing.id, fd);
      } else {
        await announcementService.create(fd);
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Announcement) => {
    if (!confirm(`Delete announcement "${item.title}"?`)) return;
    try {
      await announcementService.remove(item.id);
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const categoryColors: Record<string, string> = {
    general: "bg-blue-100 text-blue-700",
    enrollment: "bg-green-100 text-green-700",
    academic: "bg-purple-100 text-purple-700",
    event: "bg-orange-100 text-orange-700",
  };

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Manage landing page announcements" onAdd={openCreate} />
      <DataTable
        columns={[
          {
            key: "title", header: "Title",
            render: (item: Announcement) => (
              <div className="flex items-center gap-3">
                {item.image_path && (
                  <img src={item.image_path} alt="" className="h-10 w-14 rounded-lg object-cover border border-gray-200" />
                )}
                <div>
                  <span className="font-medium">{item.title}</span>
                  {item.is_pinned && <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pinned</span>}
                </div>
              </div>
            ),
          },
          {
            key: "category", header: "Category",
            render: (item: Announcement) => (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[item.category] || categoryColors.general}`}>
                {item.category}
              </span>
            ),
          },
          {
            key: "published_at", header: "Published",
            render: (item: Announcement) => new Date(item.published_at).toLocaleDateString(),
          },
          {
            key: "is_active", header: "Status",
            render: (item: Announcement) =>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Announcement" : "Add Announcement"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Title" placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Content</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={5}
              placeholder="Write the announcement content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Cover Image</label>
            {imagePreview && (
              <div className="relative overflow-hidden rounded-lg border border-gray-200">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div>
              <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleImageChange} className="hidden" />
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                {imagePreview ? "Change Image" : "Upload Image"}
              </Button>
              <span className="ml-3 text-xs text-gray-500">Optional. PNG, JPG, or WebP. Max 5MB.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800">Category</label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="general">General</option>
                <option value="enrollment">Enrollment</option>
                <option value="academic">Academic</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div className="flex items-end gap-6 pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
                Pinned
              </label>
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
