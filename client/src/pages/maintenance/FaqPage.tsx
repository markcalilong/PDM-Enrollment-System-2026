import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { faqService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Faq } from "@shared/types";

interface FormData {
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export function FaqPage() {
  const { items, loading, create, update, remove } = useCrud(faqService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const openCreate = () => {
    setEditing(null);
    reset({ question: "", answer: "", sort_order: 0, is_active: true });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Faq) => {
    setEditing(item);
    reset({ question: item.question, answer: item.answer, sort_order: item.sort_order, is_active: item.is_active });
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

  const handleDelete = async (item: Faq) => {
    if (!confirm(`Delete FAQ "${item.question}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="FAQs" subtitle="Manage landing page frequently asked questions" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "question", header: "Question", render: (item: Faq) => <span className="font-medium">{item.question}</span> },
          { key: "answer", header: "Answer", render: (item: Faq) => (
            <span className="line-clamp-1 text-gray-600">{item.answer}</span>
          )},
          { key: "sort_order", header: "Order" },
          {
            key: "is_active", header: "Status",
            render: (item: Faq) =>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit FAQ" : "Add FAQ"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Question" placeholder="e.g. Who is eligible to enroll?" error={errors.question?.message} {...register("question", { required: "Required" })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Answer</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="Provide a clear, helpful answer..."
              {...register("answer", { required: "Required" })}
            />
            {errors.answer && <p className="text-sm text-red-600">{errors.answer.message}</p>}
          </div>
          <Input label="Sort Order" type="number" error={errors.sort_order?.message} {...register("sort_order", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
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
