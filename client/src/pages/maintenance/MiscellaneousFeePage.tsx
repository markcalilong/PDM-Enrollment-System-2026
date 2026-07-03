import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { miscellaneousFeeService, courseService, labTypeService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { MiscellaneousFee, Course } from "@shared/types";

interface FormData {
  name: string;
  amount: number;
  description: string;
  applicability: string;
  frequency: string;
  course_id: number | null;
  lab_type: string;
  year_level: number | null;
}

const APPLICABILITY_LABELS: Record<string, string> = {
  all: "All Students",
  new_students: "New Students Only",
  course_specific: "Course Specific",
  lab_specific: "Lab Specific",
  year_level: "Year Level",
};

const FREQUENCY_LABELS: Record<string, string> = {
  per_semester: "Per Semester",
  one_time: "One-Time",
  per_subject: "Per Subject",
};

const APPLICABILITY_COLORS: Record<string, string> = {
  all: "bg-blue-50 text-blue-700",
  new_students: "bg-amber-50 text-amber-700",
  course_specific: "bg-emerald-50 text-emerald-700",
  lab_specific: "bg-violet-50 text-violet-700",
  year_level: "bg-rose-50 text-rose-700",
};

const LAB_TYPE_LABELS: Record<string, string> = {
  computer: "Computer Lab",
  physics: "Physics Lab",
  chemistry: "Chemistry Lab",
  biology: "Biology Lab",
  digital: "Digital Lab",
  electronics: "Electronics Lab",
  engineering: "Engineering Lab",
  other: "Other Lab",
};

export function MiscellaneousFeePage() {
  const { items, loading, create, update, remove } = useCrud(miscellaneousFeeService);
  const [courses, setCourses] = useState<Course[]>([]);
  const [labTypes, setLabTypes] = useState<{ code: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MiscellaneousFee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>();

  const watchApplicability = useWatch({ control, name: "applicability", defaultValue: "all" });

  useEffect(() => {
    courseService.getAll().then((r) => setCourses(r.data || []));
    labTypeService.getAll().then((r) => setLabTypes(r.data || []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", amount: 0, description: "", applicability: "all", frequency: "per_semester", course_id: null, lab_type: "", year_level: null });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: MiscellaneousFee) => {
    setEditing(item);
    reset({
      name: item.name,
      amount: Number(item.amount),
      description: item.description || "",
      applicability: item.applicability,
      frequency: item.frequency,
      course_id: item.course_id,
      lab_type: item.lab_type || "",
      year_level: item.year_level,
    });
    setError(null);
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      const payload = {
        ...data,
        course_id: data.applicability === "course_specific" ? Number(data.course_id) || null : null,
        lab_type: data.applicability === "lab_specific" ? data.lab_type || null : null,
        year_level: data.applicability === "year_level" ? Number(data.year_level) || null : null,
      };
      editing ? await update(editing.id, payload as any) : await create(payload as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: MiscellaneousFee) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  // Build the "applies to" display text
  const appliesTo = (item: MiscellaneousFee): string => {
    switch (item.applicability) {
      case "course_specific":
        return (item.course as any)?.code || "—";
      case "lab_specific":
        return LAB_TYPE_LABELS[item.lab_type || ""] || item.lab_type || "—";
      case "year_level":
        return `Year ${item.year_level}`;
      default:
        return "";
    }
  };

  return (
    <div>
      <PageHeader title="Miscellaneous Fees" subtitle="Manage fee items with applicability rules" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "name", header: "Fee Name", render: (item: MiscellaneousFee) => <span className="font-medium">{item.name}</span> },
          {
            key: "amount",
            header: "Amount",
            render: (item: MiscellaneousFee) => <span className="font-medium">&#8369; {Number(item.amount).toFixed(2)}</span>,
          },
          {
            key: "applicability",
            header: "Applies To",
            render: (item: MiscellaneousFee) => (
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${APPLICABILITY_COLORS[item.applicability] || "bg-gray-100 text-gray-700"}`}>
                  {APPLICABILITY_LABELS[item.applicability] || item.applicability}
                </span>
                {(item.applicability === "course_specific" || item.applicability === "lab_specific" || item.applicability === "year_level") && (
                  <span className="text-xs text-gray-500">{appliesTo(item)}</span>
                )}
              </div>
            ),
          },
          {
            key: "frequency",
            header: "Frequency",
            render: (item: MiscellaneousFee) => (
              <span className="text-xs text-gray-600">{FREQUENCY_LABELS[item.frequency] || item.frequency}</span>
            ),
          },
          {
            key: "is_active",
            header: "Status",
            render: (item: MiscellaneousFee) =>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Fee" : "Add Fee"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Fee Name" placeholder="e.g. Library Fee" error={errors.name?.message} {...register("name", { required: "Required" })} />
            <Input label="Amount" type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register("amount", { required: "Required", valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
          </div>

          <Input label="Description (Optional)" placeholder="Additional details about this fee" {...register("description")} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Applicability</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("applicability")}>
                {Object.entries(APPLICABILITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">Who does this fee apply to?</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Frequency</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("frequency")}>
                {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">How often is this charged?</p>
            </div>
          </div>

          {/* Conditional fields based on applicability */}
          {watchApplicability === "course_specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Course</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("course_id")}>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.description}</option>)}
              </select>
            </div>
          )}

          {watchApplicability === "lab_specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Lab Type</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("lab_type")}>
                <option value="">Select lab type</option>
                {labTypes.map((lt) => <option key={lt.code} value={lt.code}>{lt.name}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">Fee applies to subjects with this lab type</p>
            </div>
          )}

          {watchApplicability === "year_level" && (
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Year Level</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("year_level", { valueAsNumber: true })}>
                <option value="">Select year level</option>
                {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
