import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineLightBulb } from "react-icons/hi2";
import { sdgGoalService, sdgInitiativeService } from "../../services/maintenanceService";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { ImageField, useImageField } from "../../components/ui/ImageField";
import { SdgBadge, SdgPicker } from "../../components/sdg/sdg";
import type { SdgGoal, SdgInitiative } from "@shared/types";

const textareaClass =
  "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

interface InitiativeFormData {
  title: string;
  description: string;
  link: string;
  sort_order: number;
  is_active: boolean;
}

type Tab = "initiatives" | "goals";

export function SdgAdminPage() {
  const [tab, setTab] = useState<Tab>("initiatives");
  const [goals, setGoals] = useState<SdgGoal[]>([]);
  const [initiatives, setInitiatives] = useState<SdgInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);

  // Initiative modal state
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [editingInit, setEditingInit] = useState<SdgInitiative | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [initSdgs, setInitSdgs] = useState<number[]>([]);
  const initForm = useForm<InitiativeFormData>();
  const initImage = useImageField();

  // Goal description modal state
  const [editingGoal, setEditingGoal] = useState<SdgGoal | null>(null);
  const [goalDescription, setGoalDescription] = useState("");
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, i] = await Promise.all([sdgGoalService.getAll(), sdgInitiativeService.getAll()]);
      setGoals((g.data as SdgGoal[]) || []);
      setInitiatives((i.data as SdgInitiative[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Initiative handlers ───────────────────────────────
  const openCreateInit = () => {
    setEditingInit(null);
    initForm.reset({ title: "", description: "", link: "", sort_order: initiatives.length + 1, is_active: true });
    setInitSdgs(filter ? [filter] : []);
    initImage.reset(null);
    setInitError(null);
    setInitModalOpen(true);
  };

  const openEditInit = (i: SdgInitiative) => {
    setEditingInit(i);
    initForm.reset({
      title: i.title,
      description: i.description || "",
      link: i.link || "",
      sort_order: i.sort_order,
      is_active: i.is_active,
    });
    setInitSdgs(i.sdgs);
    initImage.reset(i.image_path);
    setInitError(null);
    setInitModalOpen(true);
  };

  const onSubmitInit = async (data: InitiativeFormData) => {
    if (initSdgs.length === 0) {
      setInitError("Select at least one SDG.");
      return;
    }
    try {
      setInitError(null);
      const fd = new FormData();
      fd.append("title", data.title.trim());
      fd.append("description", data.description?.trim() || "");
      fd.append("link", data.link?.trim() || "");
      fd.append("sort_order", String(data.sort_order ?? 0));
      fd.append("is_active", String(data.is_active));
      fd.append("sdgs", JSON.stringify(initSdgs));
      initImage.appendTo(fd);

      if (editingInit) {
        await sdgInitiativeService.update(editingInit.id, fd);
      } else {
        await sdgInitiativeService.create(fd);
      }
      setInitModalOpen(false);
      await load();
    } catch (err) {
      setInitError(err instanceof Error ? err.message : "Failed to save initiative");
    }
  };

  const deleteInit = async (i: SdgInitiative) => {
    if (!confirm(`Delete initiative "${i.title}"?`)) return;
    try {
      await sdgInitiativeService.remove(i.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // ─── Goal description handlers ─────────────────────────
  const openEditGoal = (g: SdgGoal) => {
    setEditingGoal(g);
    setGoalDescription(g.description || "");
    setGoalError(null);
  };

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    setGoalSaving(true);
    try {
      await sdgGoalService.update(editingGoal.number, { description: goalDescription.trim() || null });
      setEditingGoal(null);
      await load();
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setGoalSaving(false);
    }
  };

  const visible = filter ? initiatives.filter((i) => i.sdgs.includes(filter)) : initiatives;

  return (
    <div>
      <PageHeader
        title="Sustainable Development Goals"
        subtitle="Map the institution's initiatives to the 17 UN SDGs shown on the public SDG page (WURI)"
        onAdd={tab === "initiatives" ? openCreateInit : undefined}
        addLabel="Add Initiative"
      />

      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {([
          ["initiatives", `Initiatives (${initiatives.length})`],
          ["goals", "Goal Descriptions"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === key ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
        </div>
      ) : tab === "initiatives" ? (
        <>
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter by goal:</label>
            <select
              value={filter ?? ""}
              onChange={(e) => setFilter(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All goals</option>
              {goals.map((g) => (
                <option key={g.number} value={g.number}>SDG {g.number} · {g.title}</option>
              ))}
            </select>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
              <HiOutlineLightBulb className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm text-gray-600">No initiatives yet. Add one and tag the SDGs it supports.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
              {visible.map((i) => (
                <div key={i.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    {i.image_path ? (
                      <img src={i.image_path} alt="" className="h-14 w-20 shrink-0 rounded-lg border border-gray-200 object-cover" />
                    ) : (
                      <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                        <HiOutlineLightBulb className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{i.title}</span>
                        {!i.is_active && (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">Inactive</span>
                        )}
                      </div>
                      {i.description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{i.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {i.sdgs.map((n) => <SdgBadge key={n} number={n} />)}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => openEditInit(i)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Edit">
                      <HiOutlinePencilSquare className="h-4.5 w-4.5" />
                    </button>
                    <button onClick={() => deleteInit(i)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition" title="Delete">
                      <HiOutlineTrash className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {goals.map((g) => (
            <div key={g.number} className="flex items-start gap-4 px-5 py-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-extrabold text-white"
                style={{ backgroundColor: g.color }}
              >
                {g.number}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{g.title}</span>
                  <span className="text-xs text-gray-500">
                    {g.initiative_count || 0} initiatives · {g.program_count || 0} extension programs
                  </span>
                </div>
                {g.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{g.description}</p>
                ) : (
                  <p className="mt-1 text-sm italic text-gray-400">No commitment statement yet.</p>
                )}
              </div>
              <button onClick={() => openEditGoal(g)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Edit description">
                <HiOutlinePencilSquare className="h-4.5 w-4.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Initiative Modal */}
      <Modal open={initModalOpen} onClose={() => setInitModalOpen(false)} title={editingInit ? "Edit Initiative" : "Add Initiative"} size="lg">
        <form onSubmit={initForm.handleSubmit(onSubmitInit)} className="space-y-4">
          {initError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{initError}</div>}
          <Input label="Title" placeholder="e.g. Free Tertiary Education for Marilaeños" error={initForm.formState.errors.title?.message} {...initForm.register("title", { required: "Required" })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Description</label>
            <textarea className={textareaClass} rows={4} placeholder="What the initiative is, its reach and measurable results..." {...initForm.register("description")} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Sustainable Development Goals</label>
            <SdgPicker value={initSdgs} onChange={setInitSdgs} />
          </div>
          <ImageField field={initImage} />
          <Input label="Link (optional)" placeholder="https://..." {...initForm.register("link")} />
          <Input label="Sort Order" type="number" error={initForm.formState.errors.sort_order?.message} {...initForm.register("sort_order", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" {...initForm.register("is_active")} />
            Active (show on public page)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setInitModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={initForm.formState.isSubmitting}>{editingInit ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Goal Description Modal */}
      <Modal open={!!editingGoal} onClose={() => setEditingGoal(null)} title={editingGoal ? `SDG ${editingGoal.number}: ${editingGoal.title}` : ""}>
        <form onSubmit={saveGoal} className="space-y-4">
          {goalError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{goalError}</div>}
          <p className="text-sm italic text-gray-500">{editingGoal?.tagline}</p>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Our commitment to this goal</label>
            <textarea
              className={textareaClass}
              rows={6}
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="Describe how the institution contributes to this goal. Shown at the top of the public goal page."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditingGoal(null)}>Cancel</Button>
            <Button type="submit" loading={goalSaving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
