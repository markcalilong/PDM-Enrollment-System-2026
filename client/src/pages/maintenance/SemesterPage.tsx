import { useState } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { semesterService } from "../../services/maintenanceService";
import { api } from "../../services/api";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Semester } from "@shared/types";

interface FormData {
  code: string;
  name: string;
  sort_order: number;
}

export function SemesterPage() {
  const { items, loading, create, update, remove, fetchAll } = useCrud(semesterService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const openCreate = () => { setEditing(null); reset({ code: "", name: "", sort_order: 0 }); setError(null); setModalOpen(true); };
  const openEdit = (item: Semester) => { setEditing(item); reset({ code: item.code, name: item.name, sort_order: item.sort_order }); setError(null); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      editing ? await update(editing.id, data as any) : await create(data as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleSetActive = async (item: Semester) => {
    try {
      await api.patch(`/maintenance/semesters/${item.id}/activate`);
      fetchAll();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to set active"); }
  };

  const handleDelete = async (item: Semester) => {
    if (!confirm(`Delete semester "${item.name}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="Semesters" subtitle="Manage semester periods and set the active semester" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "code", header: "Code" },
          { key: "name", header: "Name" },
          { key: "sort_order", header: "Order" },
          {
            key: "is_active",
            header: "Status",
            render: (item: Semester) =>
              (item as any).is_active ? (
                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Active</span>
              ) : (
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Inactive</span>
              ),
          },
        ]}
        data={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        actions={(item) =>
          !(item as any).is_active ? (
            <button
              onClick={() => handleSetActive(item)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-600 transition"
              title="Set as active semester"
            >
              <HiOutlineCheckCircle className="h-4 w-4" />
            </button>
          ) : null
        }
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Semester" : "Add Semester"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Code" placeholder="e.g. 1, 2, S" error={errors.code?.message} {...register("code", { required: "Required" })} />
          <Input label="Name" placeholder="e.g. 1st Semester" error={errors.name?.message} {...register("name", { required: "Required" })} />
          <Input label="Sort Order" type="number" error={errors.sort_order?.message} {...register("sort_order", { valueAsNumber: true })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
