import { useState } from "react";
import { HiOutlineQueueList } from "react-icons/hi2";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { subjectService, labTypeService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Subject } from "@shared/types";

interface FormData {
  code: string;
  description: string;
  units_lec: number;
  units_lab: number;
  lab_type: string;
}

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

export function SubjectPage() {
  const { items, loading, create, update, remove, fetchAll } = useCrud(subjectService);
  const [modalOpen, setModalOpen] = useState(false);
  const [prereqModalOpen, setPrereqModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [selectedPrereqs, setSelectedPrereqs] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const openCreate = () => { setEditing(null); reset({ code: "", description: "", units_lec: 3, units_lab: 0, lab_type: "" }); setError(null); setModalOpen(true); };
  const openEdit = (item: Subject) => { setEditing(item); reset({ code: item.code, description: item.description, units_lec: item.units_lec, units_lab: item.units_lab, lab_type: item.lab_type || "" }); setError(null); setModalOpen(true); };
  const openPrereqs = (item: Subject) => {
    setEditing(item);
    setSelectedPrereqs(item.prerequisites?.map((p) => p.id) || []);
    setPrereqModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      const payload = { ...data, lab_type: data.lab_type || null };
      editing ? await update(editing.id, payload as any) : await create(payload as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const savePrereqs = async () => {
    if (!editing) return;
    try {
      await subjectService.setPrerequisites(editing.id, selectedPrereqs);
      setPrereqModalOpen(false);
      fetchAll();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to save prerequisites"); }
  };

  const togglePrereq = (id: number) => {
    setSelectedPrereqs((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleDelete = async (item: Subject) => {
    if (!confirm(`Delete subject "${item.code}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Cannot delete: subject is in use"); }
  };

  return (
    <div>
      <PageHeader title="Subjects" subtitle="Manage subjects and prerequisites" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "code", header: "Code", render: (item: Subject) => <span className="font-medium">{item.code}</span> },
          { key: "description", header: "Description" },
          { key: "units_lec", header: "Lec" },
          { key: "units_lab", header: "Lab" },
          {
            key: "lab_type",
            header: "Lab Type",
            render: (item: Subject) =>
              item.lab_type ? (
                <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                  {LAB_TYPE_LABELS[item.lab_type] || item.lab_type}
                </span>
              ) : <span className="text-gray-500 text-xs">—</span>,
          },
          {
            key: "prerequisites",
            header: "Prerequisites",
            render: (item: Subject) => (
              <div className="flex flex-wrap gap-1">
                {item.prerequisites?.length ? item.prerequisites.map((p) => (
                  <span key={p.id} className="inline-flex rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{p.code}</span>
                )) : <span className="text-gray-500 text-xs">None</span>}
              </div>
            ),
          },
        ]}
        data={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        actions={(item) => (
          <button
            onClick={() => openPrereqs(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition"
            title="Manage prerequisites"
          >
            <HiOutlineQueueList className="h-4 w-4" />
          </button>
        )}
      />

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Subject" : "Add Subject"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Subject Code" placeholder="e.g. CS101" error={errors.code?.message} {...register("code", { required: "Required" })} />
          <Input label="Description" placeholder="e.g. Introduction to Computing" error={errors.description?.message} {...register("description", { required: "Required" })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lecture Units" type="number" step="0.5" error={errors.units_lec?.message} {...register("units_lec", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
            <Input label="Lab Units" type="number" step="0.5" error={errors.units_lab?.message} {...register("units_lab", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Lab Type</label>
            <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("lab_type")}>
              <option value="">None (no laboratory)</option>
              {Object.entries(LAB_TYPE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">Set if this subject requires a specific lab facility</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Prerequisites Modal */}
      <Modal open={prereqModalOpen} onClose={() => setPrereqModalOpen(false)} title={`Prerequisites for ${editing?.code || ""}`}>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {items.filter((s) => s.id !== editing?.id).map((s) => (
            <label key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selectedPrereqs.includes(s.id)} onChange={() => togglePrereq(s.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm"><strong>{s.code}</strong> - {s.description}</span>
            </label>
          ))}
          {items.filter((s) => s.id !== editing?.id).length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">No other subjects available</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => setPrereqModalOpen(false)}>Cancel</Button>
          <Button onClick={savePrereqs}>Save Prerequisites</Button>
        </div>
      </Modal>
    </div>
  );
}
