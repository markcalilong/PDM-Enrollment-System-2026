import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineHeart,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import { extensionProgramService, extensionActivityService } from "../../services/maintenanceService";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { ImageField, useImageField } from "../../components/ui/ImageField";
import { SdgBadge, SdgPicker } from "../../components/sdg/sdg";
import { formatDate } from "../../components/PublicPageShell";
import type { ExtensionProgram, ExtensionActivity } from "@shared/types";

const textareaClass =
  "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

interface ProgramFormData {
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface ActivityFormData {
  title: string;
  activity_date: string;
  location: string;
  beneficiaries: string;
  description: string;
  is_active: boolean;
}

export function ExtensionProgramPage() {
  const [programs, setPrograms] = useState<ExtensionProgram[]>([]);
  const [loading, setLoading] = useState(true);

  // Program modal state
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ExtensionProgram | null>(null);
  const [programError, setProgramError] = useState<string | null>(null);
  const [programSdgs, setProgramSdgs] = useState<number[]>([]);
  const programForm = useForm<ProgramFormData>();
  const programImage = useImageField();

  // Activity modal state
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityProgramId, setActivityProgramId] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<ExtensionActivity | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const activityForm = useForm<ActivityFormData>();
  const activityImage = useImageField();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await extensionProgramService.getAll();
      setPrograms((res.data as ExtensionProgram[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Program handlers ──────────────────────────────────
  const openCreateProgram = () => {
    setEditingProgram(null);
    programForm.reset({ title: "", description: "", sort_order: programs.length + 1, is_active: true });
    setProgramSdgs([]);
    programImage.reset(null);
    setProgramError(null);
    setProgramModalOpen(true);
  };

  const openEditProgram = (p: ExtensionProgram) => {
    setEditingProgram(p);
    programForm.reset({
      title: p.title,
      description: p.description || "",
      sort_order: p.sort_order,
      is_active: p.is_active,
    });
    setProgramSdgs(p.sdgs);
    programImage.reset(p.image_path);
    setProgramError(null);
    setProgramModalOpen(true);
  };

  const onSubmitProgram = async (data: ProgramFormData) => {
    try {
      setProgramError(null);
      const fd = new FormData();
      fd.append("title", data.title.trim());
      fd.append("description", data.description?.trim() || "");
      fd.append("sort_order", String(data.sort_order ?? 0));
      fd.append("is_active", String(data.is_active));
      fd.append("sdgs", JSON.stringify(programSdgs));
      programImage.appendTo(fd);

      if (editingProgram) {
        await extensionProgramService.update(editingProgram.id, fd);
      } else {
        await extensionProgramService.create(fd);
      }
      setProgramModalOpen(false);
      await load();
    } catch (err) {
      setProgramError(err instanceof Error ? err.message : "Failed to save program");
    }
  };

  const deleteProgram = async (p: ExtensionProgram) => {
    if (!confirm(`Delete program "${p.title}" and all its activities?`)) return;
    try {
      await extensionProgramService.remove(p.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // ─── Activity handlers ─────────────────────────────────
  const openCreateActivity = (programId: number) => {
    setActivityProgramId(programId);
    setEditingActivity(null);
    activityForm.reset({ title: "", activity_date: "", location: "", beneficiaries: "", description: "", is_active: true });
    activityImage.reset(null);
    setActivityError(null);
    setActivityModalOpen(true);
  };

  const openEditActivity = (a: ExtensionActivity) => {
    setActivityProgramId(a.program_id);
    setEditingActivity(a);
    activityForm.reset({
      title: a.title,
      activity_date: a.activity_date || "",
      location: a.location || "",
      beneficiaries: a.beneficiaries || "",
      description: a.description || "",
      is_active: a.is_active,
    });
    activityImage.reset(a.image_path);
    setActivityError(null);
    setActivityModalOpen(true);
  };

  const onSubmitActivity = async (data: ActivityFormData) => {
    if (activityProgramId == null) return;
    try {
      setActivityError(null);
      const fd = new FormData();
      fd.append("program_id", String(activityProgramId));
      fd.append("title", data.title.trim());
      fd.append("activity_date", data.activity_date || "");
      fd.append("location", data.location?.trim() || "");
      fd.append("beneficiaries", data.beneficiaries?.trim() || "");
      fd.append("description", data.description?.trim() || "");
      fd.append("is_active", String(data.is_active));
      activityImage.appendTo(fd);

      if (editingActivity) {
        await extensionActivityService.update(editingActivity.id, fd);
      } else {
        await extensionActivityService.create(fd);
      }
      setActivityModalOpen(false);
      await load();
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : "Failed to save activity");
    }
  };

  const deleteActivity = async (a: ExtensionActivity) => {
    if (!confirm(`Delete activity "${a.title}"?`)) return;
    try {
      await extensionActivityService.remove(a.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <PageHeader
        title="Extension Programs"
        subtitle="Manage the community extension programs and their activities shown on the public Extension page"
        onAdd={openCreateProgram}
        addLabel="Add Program"
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <HiOutlineHeart className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">No extension programs yet. Add one to get started (e.g. Community Literacy Program).</p>
        </div>
      ) : (
        <div className="space-y-5">
          {programs.map((program) => (
            <div key={program.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Program header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  {program.image_path ? (
                    <img src={program.image_path} alt="" className="h-14 w-20 shrink-0 rounded-lg border border-gray-200 object-cover" />
                  ) : (
                    <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <HiOutlineHeart className="h-6 w-6" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{program.title}</h3>
                      {!program.is_active && (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>
                      )}
                    </div>
                    {program.description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{program.description}</p>}
                    {program.sdgs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {program.sdgs.map((n) => <SdgBadge key={n} number={n} />)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openCreateActivity(program.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition"
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                    Add Activity
                  </button>
                  <button
                    onClick={() => openEditProgram(program)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                    title="Edit program"
                  >
                    <HiOutlinePencilSquare className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => deleteProgram(program)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                    title="Delete program"
                  >
                    <HiOutlineTrash className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Activities */}
              {program.activities && program.activities.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                  {program.activities.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {a.image_path ? (
                          <img src={a.image_path} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 object-cover" />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                            <HiOutlineCalendarDays className="h-6 w-6" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{a.title}</span>
                            {!a.is_active && (
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">Inactive</span>
                            )}
                          </div>
                          <p className="flex flex-wrap gap-x-3 text-sm text-gray-500">
                            {a.activity_date && <span>{formatDate(a.activity_date)}</span>}
                            {a.location && (
                              <span className="inline-flex items-center gap-0.5"><HiOutlineMapPin className="h-3.5 w-3.5" />{a.location}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => openEditActivity(a)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                          title="Edit activity"
                        >
                          <HiOutlinePencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteActivity(a)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete activity"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-gray-400">No activities yet.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Program Modal */}
      <Modal open={programModalOpen} onClose={() => setProgramModalOpen(false)} title={editingProgram ? "Edit Program" : "Add Program"} size="lg">
        <form onSubmit={programForm.handleSubmit(onSubmitProgram)} className="space-y-4">
          {programError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{programError}</div>}
          <Input label="Program Title" placeholder="e.g. Community Literacy Program" error={programForm.formState.errors.title?.message} {...programForm.register("title", { required: "Required" })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Description</label>
            <textarea className={textareaClass} rows={4} placeholder="Goals, target communities, partners..." {...programForm.register("description")} />
          </div>
          <ImageField label="Cover Image" field={programImage} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Sustainable Development Goals</label>
            <p className="text-xs text-gray-500">Tagged goals list this program on their public SDG page.</p>
            <SdgPicker value={programSdgs} onChange={setProgramSdgs} />
          </div>
          <Input label="Sort Order" type="number" error={programForm.formState.errors.sort_order?.message} {...programForm.register("sort_order", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" {...programForm.register("is_active")} />
            Active (show on public page)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setProgramModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={programForm.formState.isSubmitting}>{editingProgram ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Activity Modal */}
      <Modal open={activityModalOpen} onClose={() => setActivityModalOpen(false)} title={editingActivity ? "Edit Activity" : "Add Activity"} size="lg">
        <form onSubmit={activityForm.handleSubmit(onSubmitActivity)} className="space-y-4">
          {activityError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{activityError}</div>}
          <Input label="Activity Title" placeholder="e.g. Reading Camp at Brgy. Saog" error={activityForm.formState.errors.title?.message} {...activityForm.register("title", { required: "Required" })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Date" type="date" {...activityForm.register("activity_date")} />
            <Input label="Location" placeholder="e.g. Brgy. Saog, Marilao" {...activityForm.register("location")} />
          </div>
          <Input label="Beneficiaries" placeholder="e.g. 45 Grade 3 learners" {...activityForm.register("beneficiaries")} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Description</label>
            <textarea className={textareaClass} rows={4} placeholder="What was done, outcomes, partners involved..." {...activityForm.register("description")} />
          </div>
          <ImageField label="Photo" field={activityImage} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" {...activityForm.register("is_active")} />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setActivityModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={activityForm.formState.isSubmitting}>{editingActivity ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
