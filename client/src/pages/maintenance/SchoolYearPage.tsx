import { useState } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { schoolYearService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { SchoolYear } from "@shared/types";

interface FormData {
  year_start: number;
  year_end: number;
}

export function SchoolYearPage() {
  const { items, loading, create, update, remove, fetchAll } = useCrud(schoolYearService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolYear | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>();

  const openCreate = () => { setEditing(null); reset({ year_start: new Date().getFullYear(), year_end: new Date().getFullYear() + 1 }); setError(null); setModalOpen(true); };
  const openEdit = (item: SchoolYear) => { setEditing(item); reset({ year_start: item.year_start, year_end: item.year_end }); setError(null); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      if (editing) {
        await update(editing.id, data as any);
      } else {
        await create(data as any);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleSetActive = async (item: SchoolYear) => {
    try {
      await schoolYearService.setActive(item.id);
      fetchAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to set active");
    }
  };

  const handleDelete = async (item: SchoolYear) => {
    if (!confirm(`Delete school year ${item.year_start}-${item.year_end}?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  const columns = [
    { key: "year_start", header: "Start Year" },
    { key: "year_end", header: "End Year" },
    {
      key: "is_active",
      header: "Status",
      render: (item: SchoolYear) =>
        item.is_active ? (
          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Active</span>
        ) : (
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Inactive</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="School Years" subtitle="Manage academic school years" onAdd={openCreate} />
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        actions={(item) =>
          !item.is_active ? (
            <button
              onClick={() => handleSetActive(item)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-600 transition"
              title="Set as active school year"
            >
              <HiOutlineCheckCircle className="h-4 w-4" />
            </button>
          ) : null
        }
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit School Year" : "Add School Year"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Start Year" type="number" error={errors.year_start?.message}
            {...register("year_start", { required: "Required", valueAsNumber: true, onChange: (e) => setValue("year_end", Number(e.target.value) + 1) })} />
          <Input label="End Year" type="number" error={errors.year_end?.message}
            {...register("year_end", { required: "Required", valueAsNumber: true })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
