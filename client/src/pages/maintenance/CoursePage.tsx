import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { courseService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Course } from "@shared/types";

interface FormData {
  code: string;
  description: string;
  duration_years: number;
  vision: string;
  mission: string;
}

export function CoursePage() {
  const { items, loading, create, update, remove } = useCrud(courseService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const openCreate = () => { setEditing(null); reset({ code: "", description: "", duration_years: 4, vision: "", mission: "" }); setError(null); setModalOpen(true); };
  const openEdit = (item: Course) => { setEditing(item); reset({ code: item.code, description: item.description, duration_years: item.duration_years, vision: item.vision || "", mission: item.mission || "" }); setError(null); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      const payload = { ...data, vision: data.vision || null, mission: data.mission || null };
      editing ? await update(editing.id, payload as any) : await create(payload as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: Course) => {
    if (!confirm(`Delete course "${item.code}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Cannot delete: course is in use"); }
  };

  return (
    <div>
      <PageHeader title="Courses" subtitle="Manage degree programs" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "code", header: "Code", render: (item: Course) => <span className="font-medium">{item.code}</span> },
          { key: "description", header: "Description" },
          { key: "duration_years", header: "Years" },
          {
            key: "is_active",
            header: "Status",
            render: (item: Course) =>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Course" : "Add Course"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Course Code" placeholder="e.g. BSCS" error={errors.code?.message} {...register("code", { required: "Required" })} />
          <Input label="Description" placeholder="e.g. Bachelor of Science in Computer Science" error={errors.description?.message} {...register("description", { required: "Required" })} />
          <Input label="Duration (Years)" type="number" error={errors.duration_years?.message} {...register("duration_years", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Min 1" }, max: { value: 6, message: "Max 6" } })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Vision</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 leading-relaxed"
              rows={3}
              placeholder="Write the course/program vision statement..."
              {...register("vision")}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Mission</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 leading-relaxed"
              rows={3}
              placeholder="Write the course/program mission statement..."
              {...register("mission")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
