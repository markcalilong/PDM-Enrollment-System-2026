import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { tuitionRateService, schoolYearService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { SchoolYear } from "@shared/types";

interface TuitionRate {
  id: number;
  school_year_id: number;
  rate_per_unit: number;
  down_payment_2: number;
  down_payment_3: number;
  down_payment_4: number;
  school_year?: SchoolYear;
  created_at: string;
  updated_at: string;
}

interface FormData {
  school_year_id: number;
  rate_per_unit: number;
  down_payment_2: number;
  down_payment_3: number;
  down_payment_4: number;
}

export function TuitionRatePage() {
  const { items, loading, create, update, remove } = useCrud(tuitionRateService);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TuitionRate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    schoolYearService.getAll().then((r) => setSchoolYears(r.data || []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ school_year_id: 0, rate_per_unit: 0, down_payment_2: 60, down_payment_3: 40, down_payment_4: 30 });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: TuitionRate) => {
    setEditing(item);
    reset({
      school_year_id: item.school_year_id,
      rate_per_unit: Number(item.rate_per_unit),
      down_payment_2: Number(item.down_payment_2),
      down_payment_3: Number(item.down_payment_3),
      down_payment_4: Number(item.down_payment_4),
    });
    setError(null);
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      editing ? await update(editing.id, data as any) : await create(data as any);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (item: TuitionRate) => {
    if (!confirm("Delete this tuition rate?")) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  return (
    <div>
      <PageHeader title="Tuition Rates" subtitle="Set the price per unit and installment down-payment percentages per school year" onAdd={openCreate} />
      <DataTable
        columns={[
          {
            key: "school_year",
            header: "School Year",
            render: (item: TuitionRate) => (
              <span className="font-medium">
                {item.school_year ? `${item.school_year.year_start}-${item.school_year.year_end}` : "—"}
              </span>
            ),
          },
          {
            key: "rate_per_unit",
            header: "Rate Per Unit",
            render: (item: TuitionRate) => (
              <span className="font-semibold text-emerald-700">&#8369; {Number(item.rate_per_unit).toFixed(2)}</span>
            ),
          },
          {
            key: "down_payment_2",
            header: "2-Pay DP%",
            render: (item: TuitionRate) => <span className="text-gray-700">{Number(item.down_payment_2)}%</span>,
          },
          {
            key: "down_payment_3",
            header: "3-Pay DP%",
            render: (item: TuitionRate) => <span className="text-gray-700">{Number(item.down_payment_3)}%</span>,
          },
          {
            key: "down_payment_4",
            header: "4-Pay DP%",
            render: (item: TuitionRate) => <span className="text-gray-700">{Number(item.down_payment_4)}%</span>,
          },
        ]}
        data={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Tuition Rate" : "Add Tuition Rate"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">School Year <span className="text-red-500">*</span></label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                {...register("school_year_id", { required: "Required", valueAsNumber: true, validate: (v) => v > 0 || "Required" })}
              >
                <option value={0}>Select school year</option>
                {schoolYears.map((sy) => (
                  <option key={sy.id} value={sy.id}>{sy.year_start}-{sy.year_end}</option>
                ))}
              </select>
              {errors.school_year_id && <p className="mt-1 text-xs text-red-600">{errors.school_year_id.message}</p>}
            </div>

            <Input
              label="Rate Per Unit (₱)"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.rate_per_unit?.message}
              {...register("rate_per_unit", { required: "Required", valueAsNumber: true, min: { value: 0, message: "Min 0" } })}
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">Installment Down-Payment Percentages</p>
            <p className="text-xs text-gray-500 mb-3">
              The percentage of tuition included in the 1st payment. The remaining balance is split equally across subsequent payments.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Option A (2 Payments)"
                type="number"
                step="0.01"
                placeholder="60"
                error={errors.down_payment_2?.message}
                {...register("down_payment_2", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Min 1%" }, max: { value: 99, message: "Max 99%" } })}
              />
              <Input
                label="Option B (3 Payments)"
                type="number"
                step="0.01"
                placeholder="40"
                error={errors.down_payment_3?.message}
                {...register("down_payment_3", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Min 1%" }, max: { value: 99, message: "Max 99%" } })}
              />
              <Input
                label="Option C (4 Payments)"
                type="number"
                step="0.01"
                placeholder="30"
                error={errors.down_payment_4?.message}
                {...register("down_payment_4", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Min 1%" }, max: { value: 99, message: "Max 99%" } })}
              />
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
