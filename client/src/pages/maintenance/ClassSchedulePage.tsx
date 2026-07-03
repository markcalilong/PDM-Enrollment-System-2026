import { useState, useEffect, useMemo } from "react";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineCalendarDays,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { classScheduleService, schoolYearService, semesterService, courseService, roomService } from "../../services/maintenanceService";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT: Record<string, string> = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat" };

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 7; h <= 20; h++) {
    for (const m of ["00", "30"]) slots.push(`${String(h).padStart(2, "0")}:${m}`);
  }
  return slots;
})();

const formatTime12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export function ClassSchedulePage() {
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSY, setSelectedSY] = useState<number>(0);
  const [selectedSem, setSelectedSem] = useState<number>(0);

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number>(0);

  const [sections, setSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<any | null>(null);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [schedLoading, setSchedLoading] = useState(false);

  const [rooms, setRooms] = useState<any[]>([]);
  const [sectionSubjects, setSectionSubjects] = useState<any[]>([]);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSubjectId, setFormSubjectId] = useState<number>(0);
  const [formRoomId, setFormRoomId] = useState<number>(0);
  const [formDay, setFormDay] = useState("Monday");
  const [formStart, setFormStart] = useState("07:00");
  const [formEnd, setFormEnd] = useState("08:00");
  const [formInstructor, setFormInstructor] = useState("");
  const [formScheduleType, setFormScheduleType] = useState<"lecture" | "laboratory">("lecture");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  useEffect(() => {
    schoolYearService.getAll().then((r) => {
      const data = r.data || [];
      setSchoolYears(data);
      const active = data.find((sy: any) => sy.is_active);
      if (active) setSelectedSY(active.id);
    });
    semesterService.getAll().then((r) => {
      const data = r.data || [];
      setSemesters(data);
      const active = data.find((s: any) => s.is_active);
      if (active) setSelectedSem(active.id);
    });
    roomService.getAll().then((r) => setRooms((r.data || []).filter((rm: any) => rm.is_active)));
    courseService.getAll().then((r) => setCourses(r.data || []));
  }, []);

  useEffect(() => {
    if (selectedSY && selectedSem) {
      fetchSections();
      setSelectedCourse(0);
      setSelectedSectionId(0);
      setSelectedSection(null);
      setSchedules([]);
    }
  }, [selectedSY, selectedSem]);

  useEffect(() => {
    setSelectedSectionId(0);
    setSelectedSection(null);
    setSchedules([]);
  }, [selectedCourse]);

  const filteredSections = useMemo(() => {
    if (!selectedCourse) return sections;
    return sections.filter((s: any) => s.course_id === selectedCourse);
  }, [sections, selectedCourse]);

  useEffect(() => {
    if (selectedSectionId) {
      const sec = sections.find((s: any) => s.id === selectedSectionId);
      setSelectedSection(sec || null);
      loadSchedule(selectedSectionId);
    } else {
      setSelectedSection(null);
      setSchedules([]);
      setSectionSubjects([]);
    }
  }, [selectedSectionId]);

  const fetchSections = async () => {
    setSectionsLoading(true);
    try {
      const res = await classScheduleService.getSections(selectedSY, selectedSem);
      setSections(res.data || []);
    } finally { setSectionsLoading(false); }
  };

  const loadSchedule = async (sectionId: number) => {
    setSchedLoading(true);
    try {
      const [schedRes, subRes] = await Promise.all([
        classScheduleService.getBySection(sectionId),
        classScheduleService.getSubjectsForSection(sectionId),
      ]);
      setSchedules(schedRes.data || []);
      setSectionSubjects(subRes.data || []);
    } finally { setSchedLoading(false); }
  };

  const refreshSchedules = async () => {
    if (!selectedSectionId) return;
    const res = await classScheduleService.getBySection(selectedSectionId);
    setSchedules(res.data || []);
    fetchSections();
  };

  // ─── Form handlers ───────────────────────────────────
  const selectedSubject = useMemo(() => sectionSubjects.find((s: any) => s.id === formSubjectId), [sectionSubjects, formSubjectId]);

  const openNewForm = () => {
    setEditingId(null);
    setFormSubjectId(0);
    setFormRoomId(0);
    setFormDay("Monday");
    setFormStart("07:00");
    setFormEnd("08:00");
    setFormInstructor("");
    setFormScheduleType("lecture");
    setError(null);
    setConflicts([]);
    setShowForm(true);
  };

  const openEditForm = (sched: any) => {
    setEditingId(sched.id);
    setFormSubjectId(sched.subject_id);
    setFormRoomId(sched.room_id);
    setFormDay(sched.day_of_week);
    setFormStart(sched.start_time?.slice(0, 5));
    setFormEnd(sched.end_time?.slice(0, 5));
    setFormInstructor(sched.instructor || "");
    setFormScheduleType(sched.schedule_type || "lecture");
    setError(null);
    setConflicts([]);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedSectionId || !formSubjectId || !formRoomId || !formDay || !formStart || !formEnd) {
      setError("Please fill in all required fields.");
      return;
    }
    if (formEnd <= formStart) {
      setError("End time must be after start time.");
      return;
    }
    setSaving(true);
    setError(null);
    setConflicts([]);
    try {
      const payload = {
        section_id: selectedSectionId,
        subject_id: formSubjectId,
        room_id: formRoomId,
        day_of_week: formDay,
        start_time: formStart,
        end_time: formEnd,
        instructor: formInstructor.trim() || null,
        schedule_type: formScheduleType,
      };
      if (editingId) await classScheduleService.update(editingId, payload);
      else await classScheduleService.create(payload);
      setShowForm(false);
      refreshSchedules();
    } catch (err: any) {
      if (err?.conflicts) {
        setConflicts(err.conflicts);
        setError("Schedule conflict detected. See details below.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to save schedule");
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this schedule entry?")) return;
    try {
      await classScheduleService.remove(id);
      refreshSchedules();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  };

  // ─── Group schedules by day ───────────────────────────
  const schedulesByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const day of DAYS) map[day] = [];
    for (const s of schedules) {
      if (map[s.day_of_week]) map[s.day_of_week].push(s);
    }
    return map;
  }, [schedules]);

  const totalSlots = schedules.length;
  const lecCount = schedules.filter((s) => s.schedule_type === "lecture").length;
  const labCount = schedules.filter((s) => s.schedule_type === "laboratory").length;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Class Schedule</h1>
          <p className="mt-0.5 text-sm text-gray-600">Manage class schedules per section</p>
        </div>
        {selectedSectionId > 0 && (
          <Button onClick={openNewForm} className="gap-1.5">
            <HiOutlinePlus className="h-4 w-4" />
            Add Schedule
          </Button>
        )}
      </div>

      {/* ─── Top Bar: SY / Semester / Section selector ─── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 mb-5">
        <div className="flex items-end gap-4">
          <div className="w-44">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">School Year</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" value={selectedSY} onChange={(e) => setSelectedSY(Number(e.target.value))}>
              <option value={0}>Select...</option>
              {schoolYears.map((sy: any) => <option key={sy.id} value={sy.id}>{sy.year_start}-{sy.year_end}{sy.is_active ? " *" : ""}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Semester</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" value={selectedSem} onChange={(e) => setSelectedSem(Number(e.target.value))}>
              <option value={0}>Select...</option>
              {semesters.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.is_active ? " *" : ""}</option>)}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Course</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" value={selectedCourse} onChange={(e) => setSelectedCourse(Number(e.target.value))} disabled={!selectedSY || !selectedSem}>
              <option value={0}>All Courses</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.description}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Section</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(Number(e.target.value))}
              disabled={!selectedSY || !selectedSem || sectionsLoading}
            >
              <option value={0}>{sectionsLoading ? "Loading..." : filteredSections.length === 0 ? "No sections available" : "Select a section..."}</option>
              {filteredSections.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.code} — Year {sec.year_level} ({sec.schedule_count} slot{sec.schedule_count !== 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Schedule Content ─── */}
      {!selectedSectionId ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20">
          <HiOutlineCalendarDays className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Select a section above to view and manage its class schedule</p>
        </div>
      ) : schedLoading ? (
        <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
        </div>
      ) : (
        <div>
          {/* Section info + stats bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">{selectedSection?.code}</h2>
              <span className="text-sm text-gray-500">{selectedSection?.course?.code} — {selectedSection?.course?.description} | Year {selectedSection?.year_level}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">{totalSlots} total</span>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">{lecCount} Lecture</span>
              <span className="rounded-full bg-purple-50 px-2.5 py-1 font-medium text-purple-700">{labCount} Lab</span>
            </div>
          </div>

          {schedules.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <HiOutlineCalendarDays className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No schedules yet. Click "Add Schedule" to start.</p>
            </div>
          ) : (
            /* ─── Timetable Grid ─── */
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-6 divide-x divide-gray-200">
                {DAYS.map((day) => {
                  const dayScheds = schedulesByDay[day];
                  return (
                    <div key={day} className="min-w-0">
                      {/* Day header */}
                      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2.5 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700">{DAY_SHORT[day]}</p>
                        <p className="text-[10px] text-gray-400">{dayScheds.length} slot{dayScheds.length !== 1 ? "s" : ""}</p>
                      </div>
                      {/* Slots */}
                      <div className="divide-y divide-gray-100 min-h-[200px]">
                        {dayScheds.length === 0 ? (
                          <div className="flex items-center justify-center py-10">
                            <p className="text-[10px] text-gray-400">No class</p>
                          </div>
                        ) : (
                          dayScheds.map((sched: any) => (
                            <div key={sched.id} className="group relative px-2.5 py-2.5 hover:bg-gray-50/80 transition">
                              {/* Time */}
                              <p className="text-[10px] font-semibold text-gray-500 mb-1">
                                {formatTime12(sched.start_time)} – {formatTime12(sched.end_time)}
                              </p>
                              {/* Subject + type badge */}
                              <div className="flex items-start gap-1 mb-1">
                                <p className="text-xs font-bold text-gray-800 leading-tight flex-1">{sched.subject?.code}</p>
                                <span className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase leading-none ${
                                  sched.schedule_type === "laboratory" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
                                }`}>
                                  {sched.schedule_type === "laboratory" ? "LAB" : "LEC"}
                                </span>
                              </div>
                              {/* Room */}
                              <p className="text-[10px] text-gray-500">
                                <span className="inline-flex items-center gap-0.5">
                                  <span className="font-medium text-blue-700">{sched.room?.code}</span>
                                </span>
                              </p>
                              {/* Instructor */}
                              {sched.instructor && (
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{sched.instructor}</p>
                              )}
                              {/* Hover actions */}
                              <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-0.5 bg-white rounded-md shadow-sm border border-gray-200 p-0.5">
                                <button onClick={() => openEditForm(sched)} className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition" title="Edit">
                                  <HiOutlinePencilSquare className="h-3 w-3" />
                                </button>
                                <button onClick={() => handleDelete(sched.id)} className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-red-50 hover:text-red-500 transition" title="Delete">
                                  <HiOutlineTrash className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Schedule Form Modal ═══ */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit Schedule" : "Add Schedule"} size="lg">
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <HiOutlineExclamationTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {conflicts.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {conflicts.map((c, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">•</span>{c}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Subject <span className="text-red-500">*</span></label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" value={formSubjectId} onChange={(e) => { setFormSubjectId(Number(e.target.value)); setFormScheduleType("lecture"); }}>
                <option value={0}>Select subject...</option>
                {sectionSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.code} — {s.description} ({s.units_lec}L{Number(s.units_lab) > 0 ? `/${s.units_lab}Lab` : ""})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Room <span className="text-red-500">*</span></label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" value={formRoomId} onChange={(e) => setFormRoomId(Number(e.target.value))}>
                <option value={0}>Select room...</option>
                {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.code} — {r.name} (Cap: {r.capacity})</option>)}
              </select>
            </div>
          </div>

          {/* Schedule Type */}
          {selectedSubject && (
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Schedule Type <span className="text-red-500">*</span></label>
              {Number(selectedSubject.units_lab) > 0 ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormScheduleType("lecture")}
                    className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-center text-sm font-medium transition ${formScheduleType === "lecture" ? "border-sky-500 bg-sky-50 text-sky-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                    <p className="font-semibold">Lecture</p>
                    <p className="text-[10px] mt-0.5 opacity-75">{selectedSubject.units_lec} unit{Number(selectedSubject.units_lec) !== 1 ? "s" : ""}</p>
                  </button>
                  <button type="button" onClick={() => setFormScheduleType("laboratory")}
                    className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-center text-sm font-medium transition ${formScheduleType === "laboratory" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                    <p className="font-semibold">Laboratory</p>
                    <p className="text-[10px] mt-0.5 opacity-75">{selectedSubject.units_lab} unit{Number(selectedSubject.units_lab) !== 1 ? "s" : ""}</p>
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">Lecture only (no lab units)</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Day <span className="text-red-500">*</span></label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" value={formDay} onChange={(e) => setFormDay(e.target.value)}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Start Time <span className="text-red-500">*</span></label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" value={formStart} onChange={(e) => setFormStart(e.target.value)}>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">End Time <span className="text-red-500">*</span></label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" value={formEnd} onChange={(e) => setFormEnd(e.target.value)}>
                {TIME_SLOTS.filter((t) => t > formStart).map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Instructor</label>
            <input type="text" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Instructor name (optional)" value={formInstructor} onChange={(e) => setFormInstructor(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="button" onClick={handleSave} loading={saving} disabled={!formSubjectId || !formRoomId} className="gap-1.5">
              <HiOutlineCheckCircle className="h-4 w-4" />
              {editingId ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
