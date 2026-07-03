import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineUserCircle,
  HiOutlineXMark,
} from "react-icons/hi2";
import { officialSectionService, officialService } from "../../services/maintenanceService";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { OfficialSection, Official } from "@shared/types";

interface SectionFormData {
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface OfficialFormData {
  name: string;
  position: string;
  sort_order: number;
  is_active: boolean;
}

export function SchoolOfficialPage() {
  const [sections, setSections] = useState<OfficialSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Section modal state
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<OfficialSection | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const sectionForm = useForm<SectionFormData>();

  // Official modal state
  const [officialModalOpen, setOfficialModalOpen] = useState(false);
  const [officialSectionId, setOfficialSectionId] = useState<number | null>(null);
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [officialError, setOfficialError] = useState<string | null>(null);
  const officialForm = useForm<OfficialFormData>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await officialSectionService.getAll();
      setSections((res.data as OfficialSection[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Section handlers ──────────────────────────────────
  const openCreateSection = () => {
    setEditingSection(null);
    sectionForm.reset({ name: "", description: "", sort_order: sections.length + 1, is_active: true });
    setSectionError(null);
    setSectionModalOpen(true);
  };

  const openEditSection = (s: OfficialSection) => {
    setEditingSection(s);
    sectionForm.reset({
      name: s.name,
      description: s.description || "",
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setSectionError(null);
    setSectionModalOpen(true);
  };

  const onSubmitSection = async (data: SectionFormData) => {
    try {
      setSectionError(null);
      if (editingSection) {
        await officialSectionService.update(editingSection.id, data);
      } else {
        await officialSectionService.create(data);
      }
      setSectionModalOpen(false);
      await load();
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : "Failed to save section");
    }
  };

  const deleteSection = async (s: OfficialSection) => {
    if (!confirm(`Delete section "${s.name}" and all its members?`)) return;
    try {
      await officialSectionService.remove(s.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // ─── Official handlers ─────────────────────────────────
  const openCreateOfficial = (sectionId: number, count: number) => {
    setOfficialSectionId(sectionId);
    setEditingOfficial(null);
    officialForm.reset({ name: "", position: "", sort_order: count + 1, is_active: true });
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    if (fileRef.current) fileRef.current.value = "";
    setOfficialError(null);
    setOfficialModalOpen(true);
  };

  const openEditOfficial = (o: Official) => {
    setOfficialSectionId(o.section_id);
    setEditingOfficial(o);
    officialForm.reset({
      name: o.name,
      position: o.position || "",
      sort_order: o.sort_order,
      is_active: o.is_active,
    });
    setImageFile(null);
    setImagePreview(o.image_path || null);
    setRemoveImage(false);
    if (fileRef.current) fileRef.current.value = "";
    setOfficialError(null);
    setOfficialModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmitOfficial = async (data: OfficialFormData) => {
    if (officialSectionId == null) return;
    try {
      setOfficialError(null);
      const fd = new FormData();
      fd.append("section_id", String(officialSectionId));
      fd.append("name", data.name.trim());
      fd.append("position", data.position?.trim() || "");
      fd.append("sort_order", String(data.sort_order ?? 0));
      fd.append("is_active", String(data.is_active));
      if (imageFile) fd.append("image", imageFile);
      if (removeImage) fd.append("remove_image", "true");

      if (editingOfficial) {
        await officialService.update(editingOfficial.id, fd);
      } else {
        await officialService.create(fd);
      }
      setOfficialModalOpen(false);
      await load();
    } catch (err) {
      setOfficialError(err instanceof Error ? err.message : "Failed to save member");
    }
  };

  const deleteOfficial = async (o: Official) => {
    if (!confirm(`Remove "${o.name}" from this section?`)) return;
    try {
      await officialService.remove(o.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <PageHeader
        title="School Officials"
        subtitle="Manage the officials shown on the public School Officials page, grouped by section"
        onAdd={openCreateSection}
        addLabel="Add Section"
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <HiOutlineUserGroup className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">No sections yet. Add one to get started (e.g. Board of Trustees).</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Section header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{section.name}</h3>
                    {!section.is_active && (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>
                    )}
                  </div>
                  {section.description && <p className="mt-0.5 text-sm text-gray-500">{section.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openCreateOfficial(section.id, section.officials?.length || 0)}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition"
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                    Add Member
                  </button>
                  <button
                    onClick={() => openEditSection(section)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                    title="Edit section"
                  >
                    <HiOutlinePencilSquare className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => deleteSection(section)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                    title="Delete section"
                  >
                    <HiOutlineTrash className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Members */}
              {section.officials && section.officials.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                  {section.officials.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {o.image_path ? (
                          <img src={o.image_path} alt="" className="h-11 w-11 shrink-0 rounded-full border border-gray-200 object-cover" />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                            <HiOutlineUserCircle className="h-7 w-7" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{o.name}</span>
                            {!o.is_active && (
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">Inactive</span>
                            )}
                          </div>
                          {o.position && <p className="text-sm text-gray-500">{o.position}</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => openEditOfficial(o)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                          title="Edit member"
                        >
                          <HiOutlinePencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteOfficial(o)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                          title="Remove member"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-gray-400">No members yet.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section Modal */}
      <Modal open={sectionModalOpen} onClose={() => setSectionModalOpen(false)} title={editingSection ? "Edit Section" : "Add Section"}>
        <form onSubmit={sectionForm.handleSubmit(onSubmitSection)} className="space-y-4">
          {sectionError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{sectionError}</div>}
          <Input label="Section Name" placeholder="e.g. Board of Trustees" error={sectionForm.formState.errors.name?.message} {...sectionForm.register("name", { required: "Required" })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-800">Description (optional)</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={2}
              placeholder="Short description shown under the section title..."
              {...sectionForm.register("description")}
            />
          </div>
          <Input label="Sort Order" type="number" error={sectionForm.formState.errors.sort_order?.message} {...sectionForm.register("sort_order", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" {...sectionForm.register("is_active")} />
            Active (show on public page)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSectionModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingSection ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Official Modal */}
      <Modal open={officialModalOpen} onClose={() => setOfficialModalOpen(false)} title={editingOfficial ? "Edit Member" : "Add Member"}>
        <form onSubmit={officialForm.handleSubmit(onSubmitOfficial)} className="space-y-4">
          {officialError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{officialError}</div>}
          <Input label="Name" placeholder="e.g. Dr. Maria Santos" error={officialForm.formState.errors.name?.message} {...officialForm.register("name", { required: "Required" })} />
          <Input label="Position" placeholder="e.g. Chairperson" error={officialForm.formState.errors.position?.message} {...officialForm.register("position")} />

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Photo</label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition"
                    >
                      <HiOutlineXMark className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <HiOutlineUserCircle className="h-16 w-16" />
                  </div>
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleImageChange} className="hidden" />
                <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                  {imagePreview ? "Change Photo" : "Upload Photo"}
                </Button>
                <p className="mt-1.5 text-xs text-gray-500">Optional. PNG, JPG, or WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          <Input label="Sort Order" type="number" error={officialForm.formState.errors.sort_order?.message} {...officialForm.register("sort_order", { valueAsNumber: true, min: { value: 0, message: "Min 0" } })} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" {...officialForm.register("is_active")} />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOfficialModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingOfficial ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
