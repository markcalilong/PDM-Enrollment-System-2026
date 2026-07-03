import { useState, useEffect, useMemo } from "react";
import {
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineAcademicCap,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
} from "react-icons/hi2";
import { advisingService, admissionService, semesterService, schoolYearService } from "../../services/maintenanceService";
import { Button } from "../../components/ui/Button";
import { SearchSelect } from "../../components/ui/SearchSelect";
import type { SchoolYear, Semester } from "@shared/types";

export function AdvisingPage() {
  // List
  const [advisings, setAdvisings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for list
  const [filterSearch, setFilterSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [activeSY, setActiveSY] = useState<SchoolYear | null>(null);

  // Selected values
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number>(0);
  const [previewSubjects, setPreviewSubjects] = useState<any[]>([]);
  const [checkedSubjects, setCheckedSubjects] = useState<Set<number>>(new Set());
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail view
  const [selectedAdvising, setSelectedAdvising] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchAdvisings();
    admissionService.getAll().then((r) => setStudents(r.data || []));
    semesterService.getAll().then((r) => {
      const semData = r.data || [];
      setSemesters(semData);
      const activeSem = semData.find((s: any) => s.is_active);
      if (activeSem) setSelectedSemesterId(activeSem.id);
    });
    schoolYearService.getAll().then((r) => {
      const data = r.data || [];
      setSchoolYears(data);
      setActiveSY(data.find((sy: SchoolYear) => sy.is_active) || null);
    });
  }, []);

  const fetchAdvisings = async () => {
    setLoading(true);
    try {
      const res = await advisingService.getAll();
      setAdvisings(res.data || []);
    } finally { setLoading(false); }
  };

  // Eligible students for advising
  const eligibleStudents = useMemo(() =>
    students.filter((s: any) => s.status === "admitted" || s.status === "enrolled"),
    [students]
  );

  // Student options for SearchSelect
  const studentOptions = useMemo(() =>
    eligibleStudents.map((s: any) => ({
      value: s.id,
      label: `${s.last_name}, ${s.first_name} ${s.middle_name || ""}`.trim(),
      sublabel: `${s.student_no} — ${(s.course as any)?.code || ""} Year ${s.year_level}`,
    })),
    [eligibleStudents]
  );

  const selectedStudent = useMemo(() =>
    students.find((s: any) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  // Filtered advising list
  const filteredAdvisings = useMemo(() => {
    let result = advisings;
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      result = result.filter((a: any) =>
        a.student?.last_name?.toLowerCase().includes(q) ||
        a.student?.first_name?.toLowerCase().includes(q) ||
        a.student?.student_no?.toLowerCase().includes(q)
      );
    }
    if (filterSemester > 0) {
      result = result.filter((a: any) => a.semester_id === filterSemester);
    }
    if (filterStatus) {
      result = result.filter((a: any) => a.status === filterStatus);
    }
    return result;
  }, [advisings, filterSearch, filterSemester, filterStatus]);

  // Preview subjects when student + semester selected
  useEffect(() => {
    if (selectedStudentId && selectedSemesterId) {
      setPreviewing(true);
      setError(null);
      advisingService.preview(selectedStudentId, selectedSemesterId)
        .then((res) => {
          const subs = res.data || [];
          setPreviewSubjects(subs);
          setCheckedSubjects(new Set(subs.map((s: any) => s.id)));
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load subjects"))
        .finally(() => setPreviewing(false));
    } else {
      setPreviewSubjects([]);
      setCheckedSubjects(new Set());
    }
  }, [selectedStudentId, selectedSemesterId]);

  const toggleSubject = (id: number) => {
    setCheckedSubjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedSubjects.size === previewSubjects.length) {
      setCheckedSubjects(new Set());
    } else {
      setCheckedSubjects(new Set(previewSubjects.map((s: any) => s.id)));
    }
  };

  const totalUnits = useMemo(() =>
    previewSubjects
      .filter((s: any) => checkedSubjects.has(s.id))
      .reduce((sum: number, s: any) => sum + Number(s.units_lec) + Number(s.units_lab), 0),
    [previewSubjects, checkedSubjects]
  );

  const handleSubmit = async () => {
    if (!activeSY) { setError("No active school year"); return; }
    if (checkedSubjects.size === 0) { setError("Select at least one subject"); return; }

    setSaving(true);
    setError(null);
    try {
      await advisingService.create({
        student_id: selectedStudentId,
        school_year_id: activeSY.id,
        semester_id: selectedSemesterId,
        year_level: selectedStudent?.year_level || 1,
        status: "approved",
        subject_ids: Array.from(checkedSubjects),
      });
      setShowForm(false);
      fetchAdvisings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const viewDetail = async (adv: any) => {
    setDetailLoading(true);
    try {
      const res = await advisingService.getById(adv.id);
      setSelectedAdvising(res.data);
    } catch { setSelectedAdvising(null); }
    finally { setDetailLoading(false); }
  };

  const handleDelete = async (adv: any) => {
    const name = `${adv.student?.last_name}, ${adv.student?.first_name}`;
    if (!confirm(`Delete advising for ${name}?`)) return;
    try {
      await advisingService.remove(adv.id);
      if (selectedAdvising?.id === adv.id) setSelectedAdvising(null);
      fetchAdvisings();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  const openNewAdvising = () => {
    setSelectedStudentId(0);
    const activeSem = semesters.find((s: any) => (s as any).is_active);
    setSelectedSemesterId(activeSem ? activeSem.id : 0);
    setPreviewSubjects([]);
    setCheckedSubjects(new Set());
    setError(null);
    setShowForm(true);
  };

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    approved: "bg-green-50 text-green-700",
    enrolled: "bg-blue-50 text-blue-700",
  };

  const hasActiveFilters = filterSearch || filterSemester > 0 || filterStatus;

  // ─── NEW ADVISING FORM ────────────────────────────────
  if (showForm) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Advising</h1>
            <p className="mt-0.5 text-sm text-gray-600">Select a student and semester to advise subjects</p>
          </div>
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {/* Selection */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <SearchSelect
              label="Student"
              placeholder="Search by name or student no..."
              options={studentOptions}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Semester <span className="text-red-500">*</span></label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
              >
                <option value={0}>Select semester</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Info</label>
              <div className="flex flex-wrap gap-2 py-2.5">
                {selectedStudent ? (
                  <>
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {(selectedStudent.course as any)?.code} — Year {selectedStudent.year_level}
                    </span>
                    <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      SY {activeSY ? `${activeSY.year_start}-${activeSY.year_end}` : "Not set"}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">Select a student first</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subject preview */}
        {previewing ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
          </div>
        ) : previewSubjects.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50/80 px-5 py-3 border-b border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedSubjects.size === previewSubjects.length}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Subjects ({checkedSubjects.size}/{previewSubjects.length} selected)
                  </span>
                </label>
                <span className="text-xs text-gray-500">Total Units: <span className="font-bold text-gray-800">{totalUnits}</span></span>
              </div>

              <table className="min-w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-100">
                    <th className="px-5 py-2 w-10" />
                    <th className="px-4 py-2 text-left font-semibold w-28">Code</th>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                    <th className="px-4 py-2 text-center font-semibold w-14">Lec</th>
                    <th className="px-4 py-2 text-center font-semibold w-14">Lab</th>
                    <th className="px-4 py-2 text-center font-semibold w-14">Total</th>
                    <th className="px-4 py-2 text-left font-semibold w-40">Prerequisites</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewSubjects.map((s: any) => {
                    const lec = Number(s.units_lec);
                    const lab = Number(s.units_lab);
                    const checked = checkedSubjects.has(s.id);
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors cursor-pointer ${checked ? "bg-primary-50/30" : "hover:bg-gray-50/50"}`}
                        onClick={() => toggleSubject(s.id)}
                      >
                        <td className="px-5 py-3">
                          <input type="checkbox" checked={checked} onChange={() => toggleSubject(s.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 text-sm">{s.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.description}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{lec}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{lab}</td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">{lec + lab}</td>
                        <td className="px-4 py-3">
                          {s.prerequisites?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {s.prerequisites.map((p: any) => (
                                <span key={p.id} className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">{p.code}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} loading={saving} className="gap-1.5">
                <HiOutlineCheckCircle className="h-4 w-4" />
                Approve Advising ({checkedSubjects.size} subjects, {totalUnits} units)
              </Button>
            </div>
          </div>
        ) : selectedStudentId && selectedSemesterId && !previewing ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <HiOutlineAcademicCap className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-3 text-sm text-gray-500">No subjects found for this year level and semester in the student's curriculum</p>
          </div>
        ) : null}
      </div>
    );
  }

  // ─── LIST + DETAIL VIEW ────────────────────────────────
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Advising</h1>
          <p className="mt-0.5 text-sm text-gray-600">Manage student subject advising per semester</p>
        </div>
        <Button onClick={openNewAdvising} className="gap-1.5">
          <HiOutlinePlus className="h-4 w-4" />
          New Advising
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: advising list with filters */}
        <div className="col-span-5">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Search */}
            <div className="border-b border-gray-100 px-3 py-2.5">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Search student name or no..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 py-2 text-sm placeholder:text-gray-500 focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 outline-none transition"
                />
                {filterSearch && (
                  <button onClick={() => setFilterSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
              <HiOutlineFunnel className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(Number(e.target.value))}
                className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 bg-transparent"
              >
                <option value={0}>All Semesters</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 bg-transparent"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="enrolled">Enrolled</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterSearch(""); setFilterSemester(0); setFilterStatus(""); }}
                  className="ml-auto text-[11px] text-primary-600 hover:text-primary-800 font-medium"
                >
                  Clear
                </button>
              )}
              <span className="ml-auto text-[11px] text-gray-500">{filteredAdvisings.length} record{filteredAdvisings.length !== 1 ? "s" : ""}</span>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
              </div>
            ) : filteredAdvisings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  {hasActiveFilters ? "No matching records" : "No advising records yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
                {filteredAdvisings.map((adv: any) => {
                  const isSelected = selectedAdvising?.id === adv.id;
                  return (
                    <div
                      key={adv.id}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition ${
                        isSelected
                          ? "bg-primary-50 border-l-[3px] border-l-primary-600"
                          : "hover:bg-gray-50 border-l-[3px] border-l-transparent"
                      }`}
                      onClick={() => viewDetail(adv)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary-700" : "text-gray-800"}`}>
                          {adv.student?.last_name}, {adv.student?.first_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {adv.student?.student_no} — {adv.course?.code} Year {adv.year_level}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-gray-500">{adv.semester?.name}</span>
                          <span className="text-[11px] text-gray-500">SY {adv.school_year?.year_start}-{adv.school_year?.year_end}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[adv.status] || ""}`}>
                          {adv.status}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(adv); }}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className="col-span-7">
          {!selectedAdvising ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-24">
              <HiOutlineAcademicCap className="h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm text-gray-500">Select an advising record to view details</p>
            </div>
          ) : detailLoading ? (
            <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedAdvising.student?.last_name}, {selectedAdvising.student?.first_name} {selectedAdvising.student?.middle_name || ""}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedAdvising.student?.student_no} — {selectedAdvising.course?.code} Year {selectedAdvising.year_level}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[selectedAdvising.status] || ""}`}>
                    {selectedAdvising.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Semester:</span>
                    <span className="font-medium">{selectedAdvising.semester?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">SY:</span>
                    <span className="font-medium">{selectedAdvising.school_year?.year_start}-{selectedAdvising.school_year?.year_end}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Curriculum:</span>
                    <span className="font-medium text-primary-700">{selectedAdvising.curriculum?.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Total Units:</span>
                    <span className="font-bold text-gray-800">
                      {selectedAdvising.subjects?.reduce((sum: number, s: any) => sum + Number(s.subject?.units_lec || 0) + Number(s.subject?.units_lab || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subjects table */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Advised Subjects ({selectedAdvising.subjects?.length || 0})
                  </p>
                </div>
                <table className="min-w-full">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-gray-600 border-b border-gray-100">
                      <th className="px-4 py-2 text-left font-semibold w-28">Code</th>
                      <th className="px-4 py-2 text-left font-semibold">Description</th>
                      <th className="px-4 py-2 text-center font-semibold w-14">Lec</th>
                      <th className="px-4 py-2 text-center font-semibold w-14">Lab</th>
                      <th className="px-4 py-2 text-center font-semibold w-14">Total</th>
                      <th className="px-4 py-2 text-center font-semibold w-20">Lab Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedAdvising.subjects?.map((as2: any) => {
                      const sub = as2.subject;
                      const lec = Number(sub?.units_lec || 0);
                      const lab = Number(sub?.units_lab || 0);
                      return (
                        <tr key={as2.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{sub?.code}</td>
                          <td className="px-4 py-2.5 text-gray-600">{sub?.description}</td>
                          <td className="px-4 py-2.5 text-center text-gray-500">{lec}</td>
                          <td className="px-4 py-2.5 text-center text-gray-500">{lab}</td>
                          <td className="px-4 py-2.5 text-center font-medium text-gray-700">{lec + lab}</td>
                          <td className="px-4 py-2.5 text-center">
                            {sub?.lab_type ? (
                              <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700 capitalize">{sub.lab_type}</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/60 border-t border-gray-100">
                      <td colSpan={2} className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600">Total</td>
                      <td className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                        {selectedAdvising.subjects?.reduce((s: number, a: any) => s + Number(a.subject?.units_lec || 0), 0)}
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                        {selectedAdvising.subjects?.reduce((s: number, a: any) => s + Number(a.subject?.units_lab || 0), 0)}
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-bold text-gray-800">
                        {selectedAdvising.subjects?.reduce((s: number, a: any) => s + Number(a.subject?.units_lec || 0) + Number(a.subject?.units_lab || 0), 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
