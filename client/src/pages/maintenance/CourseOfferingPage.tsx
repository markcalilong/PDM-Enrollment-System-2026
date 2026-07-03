import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { courseOfferingService, courseService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { CourseOffering, Course } from "@shared/types";

interface FormData {
  course_id: number;
  description_long: string;
  duration: string;
  degree_type: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
}

export function CourseOfferingPage() {
  const { items, loading, create, update, remove } = useCrud(courseOfferingService);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CourseOffering | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    courseService.getAll().then((res: any) => setCourses(res.data || []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ course_id: 0, description_long: "", duration: "", degree_type: "", sort_order: 0, is_featured: false, is_active: true });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: CourseOffering) => {
    setEditing(item);
    reset({
      course_id: item.course_id,
      description_long: item.description_long || "",
      duration: item.duration || "",
      degree_type: item.degree_type || "",
      sort_order: item.sort_order,
      is_featured: item.is_featured,
      is_active: item.is_active,
    });
    setError(null);
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      const payload = { ...data, course_id: Number(data.course_id) };
      editing ? await update(editing.id, payload as any) : await create(payload as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: CourseOffering) => {
    if (!confirm(`Delete this course offering?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="Course Offerings" subtitle="Manage courses displayed on the landing page" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "course_code", header: "Code", render: (item: CourseOffering) => <span className="font-medium">{item.course_code}</span> },
          { key: "course_name", header: "Course Name" },
          { key: "degree_type", header: "Degree Type", render: (item: CourseOffering) => item.degree_type || "-" },
          { key: "duration", header: "Duration", render: (item: CourseOffering) => item.duration || (item.duration_years ? `${item.duration_years} years` : "-") },
          {
            key: "is_featured", header: "Featured",
            render: (item: CourseOffering) =>
              item.is_featured
                ? <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">Featured</span>
                : <span className="text-xs text-gray-400">No</span>,
          },
          {
            key: "is_active", header: "Status",
            render: (item: CourseOffering) =>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Course Offering" : "Add Course Offering"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Course</label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              {...register("course_id", { required: "Required", validate: v => Number(v) > 0 || "Select a course" })}
            >
              <option value={0}>Select a course...</option>
              {courses.filter(c => c.is_active).map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.description}</option>
              ))}
            </select>
            {errors.course_id && <p className="text-sm text-red-600">{errors.course_id.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Long Description</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Detailed description for the landing page..."
              {...register("description_long")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Degree Type" placeholder="e.g. Bachelor of Science" {...register("degree_type")} />
            <Input label="Duration" placeholder="e.g. 4 Years" {...register("duration")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Sort Order" type="number" {...register("sort_order", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
            <div className="flex items-end gap-6 pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" {...register("is_featured")} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" {...register("is_active")} />
                Active
              </label>
            </div>
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
