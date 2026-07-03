import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { highlightService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Highlight } from "@shared/types";

const ICON_OPTIONS = [
  { value: "star", label: "Star" },
  { value: "academic", label: "Academic Cap" },
  { value: "book", label: "Book" },
  { value: "trophy", label: "Trophy" },
  { value: "users", label: "Users" },
  { value: "building", label: "Building" },
  { value: "globe", label: "Globe" },
  { value: "lightbulb", label: "Lightbulb" },
  { value: "sparkles", label: "Sparkles" },
];

interface FormData {
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export function HighlightPage() {
  const { items, loading, create, update, remove } = useCrud(highlightService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Highlight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", description: "", icon: "star", sort_order: 0, is_active: true });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Highlight) => {
    setEditing(item);
    reset({ title: item.title, description: item.description, icon: item.icon, sort_order: item.sort_order, is_active: item.is_active });
    setError(null);
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      editing ? await update(editing.id, data as any) : await create(data as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: Highlight) => {
    if (!confirm(`Delete highlight "${item.title}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="Highlights" subtitle="Manage landing page highlights (Why Choose Us)" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "title", header: "Title", render: (item: Highlight) => <span className="font-medium">{item.title}</span> },
          { key: "icon", header: "Icon", render: (item: Highlight) => (
            <span className="inline-flex rounded-lg bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">{item.icon}</span>
          )},
          { key: "sort_order", header: "Order" },
          {
            key: "is_active", header: "Status",
            render: (item: Highlight) =>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Highlight" : "Add Highlight"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Title" placeholder="e.g. Quality Education" error={errors.title?.message} {...register("title", { required: "Required" })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Description</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Describe this highlight..."
              {...register("description", { required: "Required" })}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800">Icon</label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...register("icon")}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Input label="Sort Order" type="number" error={errors.sort_order?.message} {...register("sort_order", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" {...register("is_active")} />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
