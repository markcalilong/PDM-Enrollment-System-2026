import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { admissionRequirementService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { AdmissionRequirement } from "@shared/types";

interface FormData {
  name: string;
  description: string;
  sort_order: number;
}

export function AdmissionRequirementPage() {
  const { items, loading, create, update, remove } = useCrud(admissionRequirementService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdmissionRequirement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const openCreate = () => { setEditing(null); reset({ name: "", description: "", sort_order: 0 }); setError(null); setModalOpen(true); };
  const openEdit = (item: AdmissionRequirement) => { setEditing(item); reset({ name: item.name, description: item.description || "", sort_order: item.sort_order }); setError(null); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      editing ? await update(editing.id, data as any) : await create(data as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: AdmissionRequirement) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="Admission Requirements" subtitle="Manage requirements for new enrollees" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "name", header: "Requirement", render: (item: AdmissionRequirement) => <span className="font-medium">{item.name}</span> },
          { key: "description", header: "Description", render: (item: AdmissionRequirement) => item.description || <span className="text-gray-500">-</span> },
          { key: "sort_order", header: "Order" },
          {
            key: "is_active",
            header: "Status",
            render: (item: AdmissionRequirement) =>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Requirement" : "Add Requirement"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Name" placeholder="e.g. Form 138 (Report Card)" error={errors.name?.message} {...register("name", { required: "Required" })} />
          <Input label="Description (Optional)" placeholder="Additional details" {...register("description")} />
          <Input label="Sort Order" type="number" {...register("sort_order", { valueAsNumber: true })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
