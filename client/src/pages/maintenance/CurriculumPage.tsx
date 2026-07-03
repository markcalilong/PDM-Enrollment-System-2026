import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineBookOpen,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import { useCrud } from "../../hooks/useCrud";
import { curriculumService, courseService, subjectService, semesterService } from "../../services/maintenanceService";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import type { Curriculum, Course, Subject, Semester, CurriculumSubject } from "@shared/types";

interface FormData {
  code: string;
  course_id: number;
  year_effective: number;
  description: string;
}

export function CurriculumPage() {
  const { items, loading, create, update, remove, fetchAll } = useCrud(curriculumService);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Selection & detail
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Curriculum | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Curriculum | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>();

  // Add subject form
  const [addSubjectId, setAddSubjectId] = useState<number>(0);
  const [addSemesterId, setAddSemesterId] = useState<number>(0);
  const [addYearLevel, setAddYearLevel] = useState<number>(1);

  useEffect(() => {
    courseService.getAll().then((r) => setCourses(r.data || []));
    subjectService.getAll().then((r) => setSubjects(r.data || []));
    semesterService.getAll().then((r) => setSemesters(r.data || []));
  }, []);

  // Auto-generate code
  const watchCourseId = watch("course_id");
  const watchYear = watch("year_effective");
  useEffect(() => {
    if (watchCourseId && watchYear) {
      const course = courses.find((c) => c.id === Number(watchCourseId));
      if (course) setValue("code", `${course.code}-${watchYear}`);
    }
  }, [watchCourseId, watchYear, courses, setValue]);

  // Load detail when selected
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    curriculumService.getById(selectedId)
      .then((res) => setDetail(res.data || null))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const refreshDetail = async () => {
    if (!selectedId) return;
    const res = await curriculumService.getById(selectedId);
    setDetail(res.data || null);
  };

  // Modals
  const openCreate = () => { setEditing(null); reset({ code: "", course_id: 0, year_effective: new Date().getFullYear(), description: "" }); setError(null); setModalOpen(true); };
  const openEdit = (item: Curriculum) => { setEditing(item); reset({ code: item.code, course_id: item.course_id, year_effective: item.year_effective, description: item.description || "" }); setError(null); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      const payload = { ...data, course_id: Number(data.course_id) } as any;
      if (editing) {
        await update(editing.id, payload);
        if (selectedId === editing.id) refreshDetail();
      } else {
        const created = await create(payload);
        if (created) setSelectedId((created as any).id);
      }
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: Curriculum) => {
    if (!confirm(`Delete curriculum "${item.code}"?`)) return;
    try {
      await remove(item.id);
      if (selectedId === item.id) { setSelectedId(null); setDetail(null); }
    } catch (err) { alert(err instanceof Error ? err.message : "Cannot delete: curriculum is in use"); }
  };

  // Subject management
  const handleAddSubject = async () => {
    if (!selectedId || !addSubjectId || !addSemesterId) return;
    try {
      await curriculumService.addSubject(selectedId, { subject_id: addSubjectId, semester_id: addSemesterId, year_level: addYearLevel });
      await refreshDetail();
      setAddSubjectId(0);
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to add subject"); }
  };

  const handleRemoveSubject = async (csId: number) => {
    if (!selectedId) return;
    try {
      await curriculumService.removeSubject(selectedId, csId);
      await refreshDetail();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to remove"); }
  };

  // Structure: { yearLevel: { semesterId: CurriculumSubject[] } }
  interface YearSemGroup {
    yearLevel: number;
    semesters: {
      semesterId: number;
      semName: string;
      semCode: string;
      subjects: CurriculumSubject[];
      lec: number;
      lab: number;
      total: number;
    }[];
    lec: number;
    lab: number;
    total: number;
  }

  const structured = useMemo((): YearSemGroup[] => {
    if (!detail?.subjects || detail.subjects.length === 0) return [];

    // Group by year then semester
    const yearMap = new Map<number, Map<number, CurriculumSubject[]>>();
    for (const cs of detail.subjects) {
      if (!yearMap.has(cs.year_level)) yearMap.set(cs.year_level, new Map());
      const semMap = yearMap.get(cs.year_level)!;
      if (!semMap.has(cs.semester_id)) semMap.set(cs.semester_id, []);
      semMap.get(cs.semester_id)!.push(cs);
    }

    // Sort by year, then by semester sort order
    const years = Array.from(yearMap.keys()).sort((a, b) => a - b);
    return years.map((yearLevel) => {
      const semMap = yearMap.get(yearLevel)!;
      const semEntries = Array.from(semMap.entries())
        .sort((a, b) => {
          const semA = semesters.find((s) => s.id === a[0]);
          const semB = semesters.find((s) => s.id === b[0]);
          return (semA?.sort_order || 0) - (semB?.sort_order || 0);
        })
        .map(([semId, subjects]) => {
          const sem = semesters.find((s) => s.id === semId);
          const lec = subjects.reduce((s, cs) => s + Number((cs.subject as any)?.units_lec || 0), 0);
          const lab = subjects.reduce((s, cs) => s + Number((cs.subject as any)?.units_lab || 0), 0);
          return {
            semesterId: semId,
            semName: sem?.name || "",
            semCode: sem?.code || "",
            subjects,
            lec,
            lab,
            total: lec + lab,
          };
        });

      const lec = semEntries.reduce((s, e) => s + e.lec, 0);
      const lab = semEntries.reduce((s, e) => s + e.lab, 0);
      return { yearLevel, semesters: semEntries, lec, lab, total: lec + lab };
    });
  }, [detail, semesters]);

  // Grand totals
  const totalUnits = useMemo(() => {
    const lec = structured.reduce((s, y) => s + y.lec, 0);
    const lab = structured.reduce((s, y) => s + y.lab, 0);
    return { lec, lab, total: lec + lab, subjects: structured.reduce((s, y) => s + y.semesters.reduce((ss, sem) => ss + sem.subjects.length, 0), 0) };
  }, [structured]);

  // Already-added subject IDs to filter the dropdown
  const addedSubjectIds = new Set(detail?.subjects?.map((cs) => cs.subject_id) || []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Curricula</h1>
          <p className="mt-0.5 text-sm text-gray-600">Manage curriculum per course with subject breakdown</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <HiOutlinePlus className="h-4 w-4" />
          Add Curriculum
        </Button>
      </div>

      {/* Master-Detail layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Curriculum list */}
        <div className="col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Curricula ({items.length})
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">No curricula yet</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin">
                {items.map((item) => {
                  const course = (item as any).course;
                  const isSelected = selectedId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                        isSelected
                          ? "bg-primary-50 border-l-[3px] border-l-primary-600"
                          : "hover:bg-gray-50 border-l-[3px] border-l-transparent"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary-700" : "text-gray-800"}`}>
                          {item.code}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {course?.code ? `${course.code} — ` : ""}{item.year_effective}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.is_active ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-green-500" title="Active" />
                        ) : (
                          <span className="inline-flex h-2 w-2 rounded-full bg-gray-300" title="Inactive" />
                        )}
                        <HiOutlineChevronRight className={`h-4 w-4 ${isSelected ? "text-primary-600" : "text-gray-400"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="col-span-8">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-24">
              <HiOutlineBookOpen className="h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm text-gray-500">Select a curriculum to view its subjects</p>
            </div>
          ) : detailLoading ? (
            <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Detail header */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{detail.code}</h2>
                    <p className="text-sm text-gray-500">
                      {(detail.course as any)?.description || ""} — Effective {detail.year_effective}
                    </p>
                    {detail.description && (
                      <p className="mt-1 text-xs text-gray-500">{detail.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(detail)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-primary-50 hover:text-primary-600 transition"
                      title="Edit curriculum"
                    >
                      <HiOutlinePencilSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(detail)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete curriculum"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                  <div className="flex-1 px-5 py-3 text-center">
                    <p className="text-xs text-gray-500">Subjects</p>
                    <p className="text-lg font-bold text-gray-800">{totalUnits.subjects}</p>
                  </div>
                  <div className="flex-1 px-5 py-3 text-center">
                    <p className="text-xs text-gray-500">Lec Units</p>
                    <p className="text-lg font-bold text-gray-800">{totalUnits.lec}</p>
                  </div>
                  <div className="flex-1 px-5 py-3 text-center">
                    <p className="text-xs text-gray-500">Lab Units</p>
                    <p className="text-lg font-bold text-gray-800">{totalUnits.lab}</p>
                  </div>
                  <div className="flex-1 px-5 py-3 text-center">
                    <p className="text-xs text-gray-500">Total Units</p>
                    <p className="text-lg font-bold text-primary-700">{totalUnits.total}</p>
                  </div>
                </div>
              </div>

              {/* Add subject form — placed on top for easy access */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Add Subject</p>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      value={addSubjectId}
                      onChange={(e) => setAddSubjectId(Number(e.target.value))}
                    >
                      <option value={0}>Select subject</option>
                      {subjects
                        .filter((s) => !addedSubjectIds.has(s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.code} — {s.description}</option>
                        ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      value={addSemesterId}
                      onChange={(e) => setAddSemesterId(Number(e.target.value))}
                    >
                      <option value={0}>Select semester</option>
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year Level</label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      value={addYearLevel}
                      onChange={(e) => setAddYearLevel(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((y) => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <Button
                      onClick={handleAddSubject}
                      disabled={!addSubjectId || !addSemesterId}
                      className="w-full gap-1.5"
                    >
                      <HiOutlinePlus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Subject breakdown — Year → Semester hierarchy */}
              {structured.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-10 text-center">
                  <p className="text-sm text-gray-500">No subjects added yet. Use the form above to add subjects.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {structured.map((yearGroup) => (
                    <div key={yearGroup.yearLevel} className="space-y-3">
                      {/* Year header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800">
                          Year {yearGroup.yearLevel}
                        </h3>
                        <span className="text-[11px] text-gray-500">
                          {yearGroup.semesters.reduce((s, sem) => s + sem.subjects.length, 0)} subjects &middot; {yearGroup.lec} Lec &middot; {yearGroup.lab} Lab &middot; <span className="font-semibold text-gray-600">{yearGroup.total} Total</span>
                        </span>
                      </div>

                      {/* Semester tables */}
                      {yearGroup.semesters.map((sem) => (
                        <div key={sem.semesterId} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                          {/* Semester header */}
                          <div className="flex items-center justify-between bg-gray-50/80 px-4 py-2.5 border-b border-gray-100">
                            <p className="text-[12px] font-semibold text-gray-700">{sem.semName}</p>
                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                              <span>{sem.subjects.length} subj</span>
                              <span>Lec: <span className="text-gray-600 font-medium">{sem.lec}</span></span>
                              <span>Lab: <span className="text-gray-600 font-medium">{sem.lab}</span></span>
                              <span>Total: <span className="text-gray-800 font-semibold">{sem.total}</span></span>
                            </div>
                          </div>

                          <table className="min-w-full">
                            <thead>
                              <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-100">
                                <th className="px-4 py-2 text-left font-semibold w-28">Code</th>
                                <th className="px-4 py-2 text-left font-semibold">Description</th>
                                <th className="px-4 py-2 text-center font-semibold w-16">Lec</th>
                                <th className="px-4 py-2 text-center font-semibold w-16">Lab</th>
                                <th className="px-4 py-2 text-center font-semibold w-16">Total</th>
                                <th className="px-2 py-2 w-10" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {sem.subjects.map((cs) => {
                                const sub = cs.subject as any;
                                const lec = Number(sub?.units_lec || 0);
                                const lab = Number(sub?.units_lab || 0);
                                return (
                                  <tr key={cs.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                    <td className="px-4 py-2.5 font-medium text-gray-800">{sub?.code}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{sub?.description}</td>
                                    <td className="px-4 py-2.5 text-center text-gray-500">{lec}</td>
                                    <td className="px-4 py-2.5 text-center text-gray-500">{lab}</td>
                                    <td className="px-4 py-2.5 text-center font-medium text-gray-700">{lec + lab}</td>
                                    <td className="px-2 py-2.5">
                                      <button
                                        onClick={() => handleRemoveSubject(cs.id)}
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                                        title="Remove subject"
                                      >
                                        <HiOutlineXMark className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            {/* Semester subtotal footer */}
                            <tfoot>
                              <tr className="bg-gray-50/60 border-t border-gray-100">
                                <td colSpan={2} className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600">Subtotal</td>
                                <td className="px-4 py-2 text-center text-xs font-semibold text-gray-600">{sem.lec}</td>
                                <td className="px-4 py-2 text-center text-xs font-semibold text-gray-600">{sem.lab}</td>
                                <td className="px-4 py-2 text-center text-xs font-bold text-gray-800">{sem.total}</td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>

      {/* Create/Edit Modal — only for curriculum header info */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Curriculum" : "New Curriculum"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Course</label>
            <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("course_id", { required: "Required" })}>
              <option value="">Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.description}</option>)}
            </select>
            {errors.course_id && <p className="text-sm text-red-600 mt-1">{errors.course_id.message}</p>}
          </div>
          <Input label="Effective Year" type="number" error={errors.year_effective?.message} {...register("year_effective", { required: "Required", valueAsNumber: true })} />
          <Input label="Code" error={errors.code?.message} {...register("code", { required: "Required" })} />
          <Input label="Description (Optional)" placeholder="e.g. Curriculum effective AY 2026-2027" {...register("description")} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
