import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { roomService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Room } from "@shared/types";

interface FormData {
  code: string;
  name: string;
  capacity: number;
}

export function RoomPage() {
  const { items, loading, create, update, remove } = useCrud(roomService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const openCreate = () => { setEditing(null); reset({ code: "", name: "", capacity: 40 }); setError(null); setModalOpen(true); };
  const openEdit = (item: Room) => { setEditing(item); reset({ code: item.code, name: item.name, capacity: item.capacity }); setError(null); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      editing ? await update(editing.id, data as any) : await create(data as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: Room) => {
    if (!confirm(`Delete room "${item.code}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="Rooms" subtitle="Manage classroom rooms" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "code", header: "Code", render: (item: Room) => <span className="font-medium">{item.code}</span> },
          { key: "name", header: "Name" },
          { key: "capacity", header: "Capacity" },
          {
            key: "is_active",
            header: "Status",
            render: (item: Room) =>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Room" : "Add Room"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Room Code" placeholder="e.g. RM101" error={errors.code?.message} {...register("code", { required: "Required" })} />
          <Input label="Room Name" placeholder="e.g. Room 101" error={errors.name?.message} {...register("name", { required: "Required" })} />
          <Input label="Capacity" type="number" error={errors.capacity?.message} {...register("capacity", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Min 1" } })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
