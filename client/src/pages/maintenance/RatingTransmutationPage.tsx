import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { ratingTransmutationService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { RatingTransmutation } from "@shared/types";

interface FormData {
  min_score: number;
  max_score: number;
  transmuted_grade: number;
}

export function RatingTransmutationPage() {
  const { items, loading, create, update, remove } = useCrud(ratingTransmutationService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RatingTransmutation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const openCreate = () => { setEditing(null); reset({ min_score: 0, max_score: 0, transmuted_grade: 0 }); setError(null); setModalOpen(true); };
  const openEdit = (item: RatingTransmutation) => { setEditing(item); reset({ min_score: Number(item.min_score), max_score: Number(item.max_score), transmuted_grade: Number(item.transmuted_grade) }); setError(null); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      if (data.min_score > data.max_score) { setError("Min score cannot exceed max score"); return; }
      editing ? await update(editing.id, data as any) : await create(data as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: RatingTransmutation) => {
    if (!confirm(`Delete transmutation ${item.min_score}-${item.max_score} = ${item.transmuted_grade}?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="Rating Transmutations" subtitle="Grade transmutation table" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "min_score", header: "Min Score", render: (item: RatingTransmutation) => Number(item.min_score).toFixed(2) },
          { key: "max_score", header: "Max Score", render: (item: RatingTransmutation) => Number(item.max_score).toFixed(2) },
          { key: "transmuted_grade", header: "Grade", render: (item: RatingTransmutation) => <span className="font-semibold text-primary-700">{Number(item.transmuted_grade).toFixed(2)}</span> },
        ]}
        data={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Transmutation" : "Add Transmutation"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Score" type="number" step="0.01" error={errors.min_score?.message} {...register("min_score", { required: "Required", valueAsNumber: true })} />
            <Input label="Max Score" type="number" step="0.01" error={errors.max_score?.message} {...register("max_score", { required: "Required", valueAsNumber: true })} />
          </div>
          <Input label="Transmuted Grade" type="number" step="0.01" placeholder="e.g. 1.75" error={errors.transmuted_grade?.message} {...register("transmuted_grade", { required: "Required", valueAsNumber: true })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
