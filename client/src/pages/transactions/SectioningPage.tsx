import { useState, useEffect, useMemo } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineArrowsRightLeft,
  HiOutlineArrowPath,
  HiOutlinePlus,
} from "react-icons/hi2";
import { sectioningService, courseService, semesterService, schoolYearService } from "../../services/maintenanceService";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import type { Course, Semester, SchoolYear } from "@shared/types";

const DAY_ORDER: Record<string, number> = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7,
};
const DAY_ABBR: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hr = Number(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${m} ${ampm}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    enrolled: "bg-green-50 text-green-700",
    dropped: "bg-red-50 text-red-700",
    completed: "bg-blue-50 text-blue-700",
    paid: "bg-green-50 text-green-700",
    partial: "bg-amber-50 text-amber-700",
    assessed: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || "bg-gray-50 text-gray-700"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ScheduleTag({ sched }: { sched: any }) {
  return (
    <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
      {sched.subject.code} · {DAY_ABBR[sched.day_of_week] || sched.day_of_week} {formatTime(sched.start_time)}-{formatTime(sched.end_time)}
    </span>
  );
}

type Tab = "pending" | "enrolled" | "classlist";

export function SectioningPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  // Reference data for filters
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);

  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingCourse, setPendingCourse] = useState<number>(0);
  const [pendingYearLevel, setPendingYearLevel] = useState<number>(0);
  const [pendingSemester, setPendingSemester] = useState<number>(0);
  const [pendingSY, setPendingSY] = useState<number>(0);
  const [pendingPayment, setPendingPayment] = useState<string>("");

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(true);
  const [enrolledSearch, setEnrolledSearch] = useState("");
  const [enrolledCourse, setEnrolledCourse] = useState<number>(0);
  const [enrolledSection, setEnrolledSection] = useState<string>("");
  const [enrolledSemester, setEnrolledSemester] = useState<number>(0);
  const [enrolledSY, setEnrolledSY] = useState<number>(0);

  // Assign section modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enrollment detail / manage modal
  const [selectedEnrollment, setSelectedEnrollment] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Change section modal
  const [showChangeSection, setShowChangeSection] = useState(false);
  const [changeSections, setChangeSections] = useState<any[]>([]);
  const [changeSectionsLoading, setChangeSectionsLoading] = useState(false);
  const [changing, setChanging] = useState(false);

  // Reassign subject modal
  const [reassignSubject, setReassignSubject] = useState<any | null>(null);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [allSectionsLoading, setAllSectionsLoading] = useState(false);

  // Add subject modal
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [addSections, setAddSections] = useState<any[]>([]);
  const [addSectionsLoading, setAddSectionsLoading] = useState(false);
  const [addSelectedSection, setAddSelectedSection] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  // Class list tab
  const [classListSections, setClassListSections] = useState<any[]>([]);
  const [classListSectionsLoading, setClassListSectionsLoading] = useState(false);
  const [classListSemester, setClassListSemester] = useState<number>(0);
  const [classListSY, setClassListSY] = useState<number>(0);
  const [classListSearch, setClassListSearch] = useState("");
  const [selectedClassList, setSelectedClassList] = useState<any | null>(null);
  const [classListLoading, setClassListLoading] = useState(false);
  const [classListSubjectId, setClassListSubjectId] = useState<number>(0);
  const [classListCourse, setClassListCourse] = useState<number>(0);

  // Schedule detail modal
  const [viewScheduleSection, setViewScheduleSection] = useState<any | null>(null);

  useEffect(() => {
    fetchPending();
    fetchEnrollments();
    courseService.getAll().then((r) => setCourses((r.data || []).filter((c: Course) => c.is_active)));
    semesterService.getAll().then((r) => setSemesters(r.data || []));
    schoolYearService.getAll().then((r) => setSchoolYears(r.data || []));
  }, []);

  async function fetchPending() {
    setPendingLoading(true);
    try {
      const res = await sectioningService.getStudents();
      setPendingStudents(res.data || []);
    } catch { /* empty */ }
    setPendingLoading(false);
  }

  async function fetchEnrollments() {
    setEnrolledLoading(true);
    try {
      const res = await sectioningService.getEnrollments();
      setEnrollments(res.data || []);
    } catch { /* empty */ }
    setEnrolledLoading(false);
  }

  // ─── Assign Section ───────────────────────────────────
  async function handleSelectStudent(student: any) {
    setSelectedStudent(student);
    setError(null);
    setSectionsLoading(true);
    try {
      const res = await sectioningService.getSections(
        student.course.id,
        student.year_level,
        student.semester.id,
        student.school_year.id
      );
      setAvailableSections(res.data || []);
    } catch {
      setAvailableSections([]);
    }
    setSectionsLoading(false);
  }

  async function handleEnroll(sectionId: number) {
    if (!selectedStudent) return;
    setEnrolling(true);
    setError(null);
    try {
      await sectioningService.enroll({
        student_id: selectedStudent.student.id,
        section_id: sectionId,
        advising_id: selectedStudent.advising_id,
        assessment_id: selectedStudent.assessment_id,
        school_year_id: selectedStudent.school_year.id,
        semester_id: selectedStudent.semester.id,
      });
      setSelectedStudent(null);
      fetchPending();
      fetchEnrollments();
    } catch (err: any) {
      setError(err.message || "Enrollment failed");
    }
    setEnrolling(false);
  }

  // ─── View / Manage Enrollment ─────────────────────────
  async function handleViewEnrollment(enrollment: any) {
    setDetailLoading(true);
    setSelectedEnrollment(enrollment);
    try {
      const res = await sectioningService.getEnrollmentById(enrollment.id);
      setSelectedEnrollment(res.data || enrollment);
    } catch { /* keep what we have */ }
    setDetailLoading(false);
  }

  // ─── Change Section ───────────────────────────────────
  async function openChangeSection() {
    if (!selectedEnrollment) return;
    setShowChangeSection(true);
    setChangeSectionsLoading(true);
    setError(null);
    try {
      const res = await sectioningService.getSections(
        selectedEnrollment.course.id,
        selectedEnrollment.student.year_level,
        selectedEnrollment.semester.id,
        selectedEnrollment.school_year.id
      );
      setChangeSections((res.data || []).filter((s: any) => s.id !== selectedEnrollment.section.id));
    } catch {
      setChangeSections([]);
    }
    setChangeSectionsLoading(false);
  }

  async function handleChangeSection(newSectionId: number) {
    if (!selectedEnrollment) return;
    setChanging(true);
    setError(null);
    try {
      await sectioningService.changeSection(selectedEnrollment.id, newSectionId);
      setShowChangeSection(false);
      setSelectedEnrollment(null);
      fetchEnrollments();
    } catch (err: any) {
      setError(err.message || "Failed to change section");
    }
    setChanging(false);
  }

  // ─── Reassign Subject ────────────────────────────────
  async function openReassignSubject(subject: any) {
    if (!selectedEnrollment) return;
    setReassignSubject(subject);
    setAllSectionsLoading(true);
    setError(null);
    try {
      const res = await sectioningService.getAllSections(
        selectedEnrollment.semester.id,
        selectedEnrollment.school_year.id
      );
      setAllSections(res.data || []);
    } catch {
      setAllSections([]);
    }
    setAllSectionsLoading(false);
  }

  async function handleReassignSubject(newSectionId: number) {
    if (!selectedEnrollment || !reassignSubject) return;
    setReassigning(true);
    setError(null);
    try {
      await sectioningService.reassignSubject(selectedEnrollment.id, reassignSubject.subject.id, newSectionId);
      setReassignSubject(null);
      // Refresh the enrollment detail
      const res = await sectioningService.getEnrollmentById(selectedEnrollment.id);
      setSelectedEnrollment(res.data || selectedEnrollment);
      fetchEnrollments();
    } catch (err: any) {
      setError(err.message || "Failed to reassign subject");
    }
    setReassigning(false);
  }

  // ─── Add Subject ──────────────────────────────────────
  async function openAddSubject() {
    if (!selectedEnrollment) return;
    setShowAddSubject(true);
    setAddSelectedSection(null);
    setAddSectionsLoading(true);
    setError(null);
    try {
      const res = await sectioningService.getAllSections(
        selectedEnrollment.semester.id,
        selectedEnrollment.school_year.id
      );
      setAddSections(res.data || []);
    } catch {
      setAddSections([]);
    }
    setAddSectionsLoading(false);
  }

  async function handleAddSubject(subjectId: number, sectionId: number) {
    if (!selectedEnrollment) return;
    setAdding(true);
    setError(null);
    try {
      await sectioningService.addSubject(selectedEnrollment.id, subjectId, sectionId);
      // Refresh enrollment detail
      const res = await sectioningService.getEnrollmentById(selectedEnrollment.id);
      setSelectedEnrollment(res.data || selectedEnrollment);
      fetchEnrollments();
    } catch (err: any) {
      setError(err.message || "Failed to add subject");
    }
    setAdding(false);
  }

  // ─── Remove Subject ──────────────────────────────────
  async function handleRemoveSubject(subjectId: number) {
    if (!selectedEnrollment) return;
    if (!confirm("Remove this subject from the enrollment?")) return;
    try {
      await sectioningService.removeSubject(selectedEnrollment.id, subjectId);
      const res = await sectioningService.getEnrollmentById(selectedEnrollment.id);
      setSelectedEnrollment(res.data || selectedEnrollment);
      fetchEnrollments();
    } catch (err: any) {
      setError(err.message || "Failed to remove subject");
    }
  }

  // ─── Class List ───────────────────────────────────────
  async function fetchClassListSections() {
    setClassListSectionsLoading(true);
    try {
      const res = await sectioningService.getClassListSections(
        classListSemester || undefined,
        classListSY || undefined
      );
      setClassListSections(res.data || []);
    } catch { setClassListSections([]); }
    setClassListSectionsLoading(false);
  }

  useEffect(() => {
    if (activeTab === "classlist") fetchClassListSections();
  }, [activeTab, classListSemester, classListSY]);

  async function handleViewClassList(sectionId: number) {
    setClassListLoading(true);
    try {
      const res = await sectioningService.getClassList(sectionId);
      setSelectedClassList(res.data || null);
    } catch { setSelectedClassList(null); }
    setClassListLoading(false);
  }

  function handlePrintClassList() {
    window.print();
  }

  // ─── Unenroll ─────────────────────────────────────────
  async function handleUnenroll(id: number) {
    if (!confirm("Remove this enrollment? The student will go back to pending.")) return;
    try {
      await sectioningService.unenroll(id);
      setSelectedEnrollment(null);
      fetchPending();
      fetchEnrollments();
    } catch { /* empty */ }
  }

  const filteredPending = useMemo(() => {
    let list = pendingStudents;
    if (pendingSearch.trim()) {
      const q = pendingSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.student.student_no?.toLowerCase().includes(q) ||
          s.student.last_name?.toLowerCase().includes(q) ||
          s.student.first_name?.toLowerCase().includes(q) ||
          s.course.code?.toLowerCase().includes(q)
      );
    }
    if (pendingCourse) list = list.filter((s) => s.course.id === pendingCourse);
    if (pendingYearLevel) list = list.filter((s) => s.year_level === pendingYearLevel);
    if (pendingSemester) list = list.filter((s) => s.semester.id === pendingSemester);
    if (pendingSY) list = list.filter((s) => s.school_year.id === pendingSY);
    if (pendingPayment) list = list.filter((s) => s.payment_status === pendingPayment);
    return list;
  }, [pendingStudents, pendingSearch, pendingCourse, pendingYearLevel, pendingSemester, pendingSY, pendingPayment]);

  // Unique section codes from enrollments for filter dropdown
  const enrolledSectionCodes = useMemo(() => {
    const codes = new Set<string>();
    enrollments.forEach((e) => codes.add(e.section.code));
    return Array.from(codes).sort();
  }, [enrollments]);

  const filteredEnrollments = useMemo(() => {
    let list = enrollments;
    if (enrolledSearch.trim()) {
      const q = enrolledSearch.toLowerCase();
      list = list.filter(
        (e) =>
          e.student.student_no?.toLowerCase().includes(q) ||
          e.student.last_name?.toLowerCase().includes(q) ||
          e.student.first_name?.toLowerCase().includes(q) ||
          e.section.code?.toLowerCase().includes(q) ||
          e.course.code?.toLowerCase().includes(q)
      );
    }
    if (enrolledCourse) list = list.filter((e) => e.course.id === enrolledCourse);
    if (enrolledSection) list = list.filter((e) => e.section.code === enrolledSection);
    if (enrolledSemester) list = list.filter((e) => e.semester.id === enrolledSemester);
    if (enrolledSY) list = list.filter((e) => e.school_year.id === enrolledSY);
    return list;
  }, [enrollments, enrolledSearch, enrolledCourse, enrolledSection, enrolledSemester, enrolledSY]);

  // Sections that offer a specific subject (for reassign modal)
  const sectionsWithSubject = useMemo(() => {
    if (!reassignSubject || !allSections.length) return [];
    const subId = reassignSubject.subject.id;
    return allSections.filter((sec: any) =>
      sec.schedules?.some((sched: any) => sched.subject.id === subId)
    );
  }, [reassignSubject, allSections]);

  // Set of subject IDs already in the enrollment (for Add Subject modal)
  const enrolledSubjectIds = useMemo(() => {
    if (!selectedEnrollment?.subjects) return new Set<number>();
    return new Set(selectedEnrollment.subjects.map((es: any) => es.subject.id));
  }, [selectedEnrollment]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sectioning</h1>
          <p className="text-xs text-gray-500">Assign students to class sections</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-amber-600">
            <HiOutlineClock className="h-4 w-4" />
            Pending: {pendingStudents.length}
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <HiOutlineCheckCircle className="h-4 w-4" />
            Enrolled: {enrollments.length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            activeTab === "pending" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <HiOutlineClock className="mr-1 inline h-3.5 w-3.5" />
          Pending Sectioning ({pendingStudents.length})
        </button>
        <button
          onClick={() => setActiveTab("enrolled")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            activeTab === "enrolled" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <HiOutlineCheckCircle className="mr-1 inline h-3.5 w-3.5" />
          Enrolled ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab("classlist")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            activeTab === "classlist" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <HiOutlineClipboardDocumentList className="mr-1 inline h-3.5 w-3.5" />
          Class List
        </button>
      </div>

      {/* ─── PENDING TAB ─────────────────────────────── */}
      {activeTab === "pending" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-2 border-b border-gray-100 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student no, name, or course..."
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-8 text-xs focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                />
                {pendingSearch && (
                  <button onClick={() => setPendingSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <HiOutlineXMark className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={pendingCourse} onChange={(e) => setPendingCourse(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All Courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
              <select value={pendingYearLevel} onChange={(e) => setPendingYearLevel(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All Year Levels</option>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
              <select value={pendingSemester} onChange={(e) => setPendingSemester(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All Semesters</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={pendingSY} onChange={(e) => setPendingSY(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All S.Y.</option>
                {schoolYears.map((sy) => <option key={sy.id} value={sy.id}>{sy.year_start}-{sy.year_end}</option>)}
              </select>
              <select value={pendingPayment} onChange={(e) => setPendingPayment(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value="">All Payment Status</option>
                <option value="assessed">Assessed</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
              {(pendingCourse || pendingYearLevel || pendingSemester || pendingSY || pendingPayment) && (
                <button
                  onClick={() => { setPendingCourse(0); setPendingYearLevel(0); setPendingSemester(0); setPendingSY(0); setPendingPayment(""); }}
                  className="text-[10px] text-primary-600 hover:text-primary-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {pendingLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading...</div>
          ) : filteredPending.length === 0 ? (
            <div className="py-12 text-center">
              <HiOutlineUserGroup className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-xs text-gray-500">No students pending sectioning</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-2">Student No</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Course</th>
                    <th className="px-4 py-2">Year</th>
                    <th className="px-4 py-2">Semester</th>
                    <th className="px-4 py-2">S.Y.</th>
                    <th className="px-4 py-2">Payment</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPending.map((s) => (
                    <tr key={s.assessment_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-mono text-[11px]">{s.student.student_no}</td>
                      <td className="px-4 py-2 font-medium">
                        {s.student.last_name}, {s.student.first_name} {s.student.middle_name || ""}
                      </td>
                      <td className="px-4 py-2">{s.course.code}</td>
                      <td className="px-4 py-2 text-center">{s.year_level}</td>
                      <td className="px-4 py-2">{s.semester.name}</td>
                      <td className="px-4 py-2">{s.school_year.year_start}-{s.school_year.year_end}</td>
                      <td className="px-4 py-2"><StatusBadge status={s.payment_status} /></td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" onClick={() => handleSelectStudent(s)}>
                          <HiOutlineAcademicCap className="mr-1 h-3.5 w-3.5" />
                          Assign Section
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── ENROLLED TAB ────────────────────────────── */}
      {activeTab === "enrolled" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-2 border-b border-gray-100 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student no, name, section, or course..."
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-8 text-xs focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  value={enrolledSearch}
                  onChange={(e) => setEnrolledSearch(e.target.value)}
                />
                {enrolledSearch && (
                  <button onClick={() => setEnrolledSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <HiOutlineXMark className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={enrolledCourse} onChange={(e) => setEnrolledCourse(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All Courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
              <select value={enrolledSection} onChange={(e) => setEnrolledSection(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value="">All Sections</option>
                {enrolledSectionCodes.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
              <select value={enrolledSemester} onChange={(e) => setEnrolledSemester(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All Semesters</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={enrolledSY} onChange={(e) => setEnrolledSY(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All S.Y.</option>
                {schoolYears.map((sy) => <option key={sy.id} value={sy.id}>{sy.year_start}-{sy.year_end}</option>)}
              </select>
              {(enrolledCourse || enrolledSection || enrolledSemester || enrolledSY) && (
                <button
                  onClick={() => { setEnrolledCourse(0); setEnrolledSection(""); setEnrolledSemester(0); setEnrolledSY(0); }}
                  className="text-[10px] text-primary-600 hover:text-primary-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {enrolledLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="py-12 text-center">
              <HiOutlineUserGroup className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-xs text-gray-500">No enrolled students yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-2">Student No</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Course</th>
                    <th className="px-4 py-2">Section</th>
                    <th className="px-4 py-2">Subjects</th>
                    <th className="px-4 py-2">Semester</th>
                    <th className="px-4 py-2">S.Y.</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEnrollments.map((e) => {
                    const mixedSections = e.subjects?.some((s: any) => s.from_section.id !== e.section.id);
                    return (
                      <tr key={e.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-mono text-[11px]">{e.student.student_no}</td>
                        <td className="px-4 py-2 font-medium">
                          {e.student.last_name}, {e.student.first_name} {e.student.middle_name || ""}
                        </td>
                        <td className="px-4 py-2">{e.course.code}</td>
                        <td className="px-4 py-2">
                          <span className="font-medium text-primary-600">{e.section.code}</span>
                          {mixedSections && (
                            <span className="ml-1 text-[10px] text-amber-500" title="Some subjects from other sections">+mix</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{e.subjects?.length || 0}</td>
                        <td className="px-4 py-2">{e.semester.name}</td>
                        <td className="px-4 py-2">{e.school_year.year_start}-{e.school_year.year_end}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="secondary" onClick={() => handleViewEnrollment(e)}>
                              Manage
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleUnenroll(e.id)}>
                              <HiOutlineTrash className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── CLASS LIST TAB ─────────────────────────── */}
      {activeTab === "classlist" && !selectedClassList && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-2 border-b border-gray-100 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sections..."
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-8 text-xs focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  value={classListSearch}
                  onChange={(e) => setClassListSearch(e.target.value)}
                />
                {classListSearch && (
                  <button onClick={() => setClassListSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <HiOutlineXMark className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={classListCourse} onChange={(e) => setClassListCourse(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All Courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
              <select value={classListSemester} onChange={(e) => setClassListSemester(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All Semesters</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={classListSY} onChange={(e) => setClassListSY(Number(e.target.value))} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400">
                <option value={0}>All S.Y.</option>
                {schoolYears.map((sy) => <option key={sy.id} value={sy.id}>{sy.year_start}-{sy.year_end}</option>)}
              </select>
              {(classListCourse || classListSemester || classListSY) && (
                <button onClick={() => { setClassListCourse(0); setClassListSemester(0); setClassListSY(0); }} className="text-[10px] text-primary-600 hover:text-primary-700">Clear filters</button>
              )}
            </div>
          </div>

          {classListSectionsLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading...</div>
          ) : (() => {
            let filtered = classListSections;
            if (classListCourse) filtered = filtered.filter((s) => s.course.id === classListCourse);
            if (classListSearch.trim()) {
              const q = classListSearch.toLowerCase();
              filtered = filtered.filter((s) => s.code.toLowerCase().includes(q) || s.course.code.toLowerCase().includes(q));
            }
            return filtered.length === 0 ? (
              <div className="py-12 text-center">
                <HiOutlineClipboardDocumentList className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-xs text-gray-500">No sections found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      <th className="px-4 py-2">Section</th>
                      <th className="px-4 py-2">Course</th>
                      <th className="px-4 py-2">Year</th>
                      <th className="px-4 py-2">Semester</th>
                      <th className="px-4 py-2">S.Y.</th>
                      <th className="px-4 py-2 text-center">Enrolled</th>
                      <th className="px-4 py-2 text-center">Max</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((sec: any) => (
                      <tr key={sec.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-semibold text-primary-600">{sec.code}</td>
                        <td className="px-4 py-2">{sec.course.code}</td>
                        <td className="px-4 py-2 text-center">{sec.year_level}</td>
                        <td className="px-4 py-2">{sec.semester.name}</td>
                        <td className="px-4 py-2">{sec.school_year.year_start}-{sec.school_year.year_end}</td>
                        <td className="px-4 py-2 text-center font-medium">{sec.enrolled_count}</td>
                        <td className="px-4 py-2 text-center text-gray-400">{sec.max_students}</td>
                        <td className="px-4 py-2 text-right">
                          <Button size="sm" variant="secondary" disabled={sec.enrolled_count === 0} onClick={() => handleViewClassList(sec.id)}>
                            <HiOutlineClipboardDocumentList className="mr-1 h-3 w-3" />
                            View List
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── CLASS LIST VIEW (per-subject) ─────────────── */}
      {activeTab === "classlist" && selectedClassList && (
        <div>
          <div className="mb-3 flex items-center justify-between print:hidden">
            <Button size="sm" variant="ghost" onClick={() => { setSelectedClassList(null); setClassListSubjectId(0); }}>
              ← Back to sections
            </Button>
            <div className="flex items-center gap-2">
              {selectedClassList.subjects?.length > 0 && (
                <select
                  value={classListSubjectId}
                  onChange={(e) => setClassListSubjectId(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                >
                  <option value={0}>All Students (Section)</option>
                  {selectedClassList.subjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} — {sub.description} ({sub.students.length})
                    </option>
                  ))}
                </select>
              )}
              <Button size="sm" onClick={handlePrintClassList}>
                <HiOutlineClipboardDocumentList className="mr-1 h-3.5 w-3.5" />
                Print
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm print:border-none print:shadow-none print:p-0">
            {classListLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-lg font-bold text-gray-900">CLASS LIST</h2>
                  <p className="text-sm text-gray-600">
                    Section: <span className="font-semibold">{selectedClassList.section.code}</span>
                    {" · "}
                    {selectedClassList.section.course.code} — {selectedClassList.section.course.description}
                  </p>
                  {(() => {
                    const selectedSub = classListSubjectId
                      ? selectedClassList.subjects?.find((s: any) => s.id === classListSubjectId)
                      : null;
                    return selectedSub ? (
                      <p className="text-sm font-medium text-primary-600 mt-1">
                        Subject: {selectedSub.code} — {selectedSub.description}
                        <span className="ml-2 text-xs text-gray-500">
                          (Lec: {selectedSub.units_lec} · Lab: {selectedSub.units_lab})
                        </span>
                      </p>
                    ) : null;
                  })()}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedClassList.section.semester.name}, S.Y. {selectedClassList.section.school_year.year_start}-{selectedClassList.section.school_year.year_end}
                    {" · "}
                    Year Level: {selectedClassList.section.year_level}
                  </p>
                </div>

                {/* Student List — either all students or per-subject */}
                {(() => {
                  const selectedSub = classListSubjectId
                    ? selectedClassList.subjects?.find((s: any) => s.id === classListSubjectId)
                    : null;
                  const displayStudents = selectedSub ? selectedSub.students : selectedClassList.students;
                  const label = selectedSub
                    ? `Students taking ${selectedSub.code}`
                    : `All Enrolled Students`;
                  const count = selectedSub
                    ? `${displayStudents.length}`
                    : `${displayStudents.length}/${selectedClassList.section.max_students}`;

                  return (
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {label} ({count})
                      </h3>
                      {displayStudents.length === 0 ? (
                        <p className="py-4 text-center text-xs text-gray-400">No students found</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b-2 border-gray-200 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">
                              <th className="px-3 py-2 w-8">#</th>
                              <th className="px-3 py-2">Student No</th>
                              <th className="px-3 py-2">Last Name</th>
                              <th className="px-3 py-2">First Name</th>
                              <th className="px-3 py-2">Middle Name</th>
                              <th className="px-3 py-2">Course</th>
                              <th className="px-3 py-2">Sex</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {displayStudents.map((s: any, idx: number) => (
                              <tr key={s.id} className="hover:bg-gray-50/50 print:hover:bg-transparent">
                                <td className="px-3 py-1.5 text-gray-400">{idx + 1}</td>
                                <td className="px-3 py-1.5 font-mono text-[11px]">{s.student_no}</td>
                                <td className="px-3 py-1.5 font-medium">{s.last_name}</td>
                                <td className="px-3 py-1.5">{s.first_name}</td>
                                <td className="px-3 py-1.5 text-gray-500">{s.middle_name || "—"}</td>
                                <td className="px-3 py-1.5">{s.course.code}</td>
                                <td className="px-3 py-1.5 text-gray-500">{s.sex || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })()}

                {/* Subject summary (only when viewing all students) */}
                {!classListSubjectId && selectedClassList.subjects?.length > 0 && (
                  <div className="print:break-before-page">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Subjects in this Section ({selectedClassList.subjects.length})
                    </h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-gray-200 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2 text-center">Lec</th>
                          <th className="px-3 py-2 text-center">Lab</th>
                          <th className="px-3 py-2 text-center">Students</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedClassList.subjects.map((sub: any) => (
                          <tr
                            key={sub.id}
                            className="hover:bg-gray-50/50 cursor-pointer print:hover:bg-transparent print:cursor-default"
                            onClick={() => setClassListSubjectId(sub.id)}
                          >
                            <td className="px-3 py-1.5 font-medium text-primary-600">{sub.code}</td>
                            <td className="px-3 py-1.5">{sub.description}</td>
                            <td className="px-3 py-1.5 text-center">{sub.units_lec}</td>
                            <td className="px-3 py-1.5 text-center">{sub.units_lab}</td>
                            <td className="px-3 py-1.5 text-center font-medium">{sub.students.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ASSIGN SECTION MODAL ────────────────────── */}
      <Modal open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Assign Section" size="lg">
        {selectedStudent && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-gray-400">Student: </span><span className="font-medium">{selectedStudent.student.student_no}</span></div>
                <div><span className="text-gray-400">Name: </span><span className="font-medium">{selectedStudent.student.last_name}, {selectedStudent.student.first_name}</span></div>
                <div><span className="text-gray-400">Course: </span><span className="font-medium">{selectedStudent.course.code} — {selectedStudent.course.description}</span></div>
                <div><span className="text-gray-400">Year Level: </span><span className="font-medium">{selectedStudent.year_level}</span></div>
                <div><span className="text-gray-400">Semester: </span><span className="font-medium">{selectedStudent.semester.name}</span></div>
                <div><span className="text-gray-400">S.Y.: </span><span className="font-medium">{selectedStudent.school_year.year_start}-{selectedStudent.school_year.year_end}</span></div>
              </div>
            </div>

            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

            <div>
              <h3 className="mb-2 text-xs font-semibold text-gray-700">Available Sections</h3>
              {sectionsLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading sections...</div>
              ) : availableSections.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
                  <HiOutlineClipboardDocumentList className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-xs text-gray-500">No sections available for {selectedStudent.course.code} Year {selectedStudent.year_level}, {selectedStudent.semester.name}</p>
                  <p className="mt-1 text-[10px] text-gray-400">Create sections and class schedules in Maintenance first</p>
                </div>
              ) : (
                <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
                  {availableSections.map((sec) => {
                    const isFull = sec.enrolled_count >= sec.max_students;
                    return (
                      <div key={sec.id} className={`rounded-lg border p-3 ${isFull ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200 bg-white hover:border-primary-300"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                              <HiOutlineUserGroup className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{sec.code}</div>
                              <div className="text-[10px] text-gray-400">
                                {sec.enrolled_count}/{sec.max_students} students
                                {isFull && <span className="ml-1 font-medium text-red-500">— FULL</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {sec.schedules?.length > 0 && (
                              <Button size="sm" variant="ghost" onClick={() => setViewScheduleSection(sec)}>
                                <HiOutlineClock className="mr-1 h-3 w-3" />Schedule
                              </Button>
                            )}
                            <Button size="sm" disabled={isFull || enrolling} loading={enrolling} onClick={() => handleEnroll(sec.id)}>
                              <HiOutlineCheckCircle className="mr-1 h-3.5 w-3.5" />Enroll
                            </Button>
                          </div>
                        </div>
                        {sec.schedules?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {sec.schedules
                              .sort((a: any, b: any) => (DAY_ORDER[a.day_of_week] || 99) - (DAY_ORDER[b.day_of_week] || 99))
                              .map((sched: any) => <ScheduleTag key={sched.id} sched={sched} />)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MANAGE ENROLLMENT MODAL ─────────────────── */}
      <Modal
        open={!!selectedEnrollment && !showChangeSection && !reassignSubject && !showAddSubject}
        onClose={() => setSelectedEnrollment(null)}
        title="Manage Enrollment"
        size="lg"
      >
        {selectedEnrollment && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-gray-400">Student: </span><span className="font-medium">{selectedEnrollment.student.student_no}</span></div>
                <div><span className="text-gray-400">Name: </span><span className="font-medium">{selectedEnrollment.student.last_name}, {selectedEnrollment.student.first_name}</span></div>
                <div><span className="text-gray-400">Course: </span><span className="font-medium">{selectedEnrollment.course.code}</span></div>
                <div>
                  <span className="text-gray-400">Section: </span>
                  <span className="font-semibold text-primary-600">{selectedEnrollment.section.code}</span>
                </div>
                <div><span className="text-gray-400">Semester: </span><span className="font-medium">{selectedEnrollment.semester.name}</span></div>
                <div><span className="text-gray-400">S.Y.: </span><span className="font-medium">{selectedEnrollment.school_year.year_start}-{selectedEnrollment.school_year.year_end}</span></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" onClick={openAddSubject}>
                <HiOutlinePlus className="mr-1 h-3.5 w-3.5" />
                Add Subject
              </Button>
              <Button size="sm" variant="secondary" onClick={openChangeSection}>
                <HiOutlineArrowsRightLeft className="mr-1 h-3.5 w-3.5" />
                Change Section
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleUnenroll(selectedEnrollment.id)}>
                <HiOutlineTrash className="mr-1 h-3.5 w-3.5" />
                Remove Enrollment
              </Button>
            </div>

            {/* Subject list */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-gray-700">Enrolled Subjects</h3>
              {detailLoading ? (
                <div className="py-4 text-center text-xs text-gray-400">Loading...</div>
              ) : !selectedEnrollment.subjects?.length ? (
                <p className="text-xs text-gray-400">No subjects found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2 text-center">Lec</th>
                        <th className="px-3 py-2 text-center">Lab</th>
                        <th className="px-3 py-2">Section</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedEnrollment.subjects.map((es: any) => {
                        const isFromOther = es.from_section.id !== selectedEnrollment.section.id;
                        return (
                          <tr key={es.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 font-medium">{es.subject.code}</td>
                            <td className="px-3 py-2 text-gray-600">{es.subject.description}</td>
                            <td className="px-3 py-2 text-center">{es.subject.units_lec}</td>
                            <td className="px-3 py-2 text-center">{es.subject.units_lab}</td>
                            <td className="px-3 py-2">
                              <span className={isFromOther ? "font-medium text-amber-600" : "text-gray-600"}>
                                {es.from_section.code}
                              </span>
                              {isFromOther && <span className="ml-1 text-[10px] text-amber-400">(other)</span>}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openReassignSubject(es)}>
                                  <HiOutlineArrowPath className="mr-1 h-3 w-3" />
                                  Reassign
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveSubject(es.subject.id)}>
                                  <HiOutlineTrash className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── CHANGE SECTION MODAL ────────────────────── */}
      <Modal
        open={showChangeSection}
        onClose={() => setShowChangeSection(false)}
        title={`Change Section — ${selectedEnrollment?.student?.last_name || ""}`}
        size="lg"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Current section: <span className="font-semibold text-primary-600">{selectedEnrollment?.section?.code}</span>.
            All subjects currently in this section will move to the new one.
          </p>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

          {changeSectionsLoading ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading sections...</div>
          ) : changeSections.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No other sections available</div>
          ) : (
            <div className="max-h-[350px] space-y-2 overflow-y-auto pr-1">
              {changeSections.map((sec) => {
                const isFull = sec.enrolled_count >= sec.max_students;
                return (
                  <div key={sec.id} className={`flex items-center justify-between rounded-lg border p-3 ${isFull ? "opacity-50" : "hover:border-primary-300"}`}>
                    <div>
                      <div className="text-sm font-semibold">{sec.code}</div>
                      <div className="text-[10px] text-gray-400">{sec.enrolled_count}/{sec.max_students} students</div>
                    </div>
                    <div className="flex gap-2">
                      {sec.schedules?.length > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => setViewScheduleSection(sec)}>
                          <HiOutlineClock className="mr-1 h-3 w-3" />Schedule
                        </Button>
                      )}
                      <Button size="sm" disabled={isFull || changing} loading={changing} onClick={() => handleChangeSection(sec.id)}>
                        <HiOutlineArrowsRightLeft className="mr-1 h-3.5 w-3.5" />Move Here
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ─── REASSIGN SUBJECT MODAL ──────────────────── */}
      <Modal
        open={!!reassignSubject}
        onClose={() => setReassignSubject(null)}
        title={`Reassign: ${reassignSubject?.subject?.code || ""}`}
        size="lg"
      >
        {reassignSubject && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Currently in section: <span className="font-semibold text-primary-600">{reassignSubject.from_section.code}</span>.
              Pick another section that offers <span className="font-medium">{reassignSubject.subject.code}</span>.
            </p>

            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

            {allSectionsLoading ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading sections...</div>
            ) : sectionsWithSubject.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No other sections offer this subject</div>
            ) : (
              <div className="max-h-[350px] space-y-2 overflow-y-auto pr-1">
                {sectionsWithSubject.map((sec: any) => {
                  const isCurrent = sec.id === reassignSubject.from_section.id;
                  const subjectSchedules = sec.schedules.filter(
                    (sched: any) => sched.subject.id === reassignSubject.subject.id
                  );
                  return (
                    <div key={sec.id} className={`rounded-lg border p-3 ${isCurrent ? "border-primary-200 bg-primary-50/30" : "hover:border-primary-300"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">
                            {sec.code}
                            {isCurrent && <span className="ml-2 text-[10px] font-normal text-primary-500">(current)</span>}
                          </div>
                          <div className="text-[10px] text-gray-400">{sec.course?.code}</div>
                        </div>
                        {!isCurrent && (
                          <Button size="sm" disabled={reassigning} loading={reassigning} onClick={() => handleReassignSubject(sec.id)}>
                            <HiOutlineArrowPath className="mr-1 h-3 w-3" />Use This
                          </Button>
                        )}
                      </div>
                      {subjectSchedules.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {subjectSchedules
                            .sort((a: any, b: any) => (DAY_ORDER[a.day_of_week] || 99) - (DAY_ORDER[b.day_of_week] || 99))
                            .map((sched: any) => (
                              <span key={sched.id} className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {DAY_ABBR[sched.day_of_week]} {formatTime(sched.start_time)}-{formatTime(sched.end_time)} · {sched.room.code}
                                {sched.instructor && ` · ${sched.instructor}`}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─── ADD SUBJECT MODAL ────────────────────────── */}
      <Modal
        open={showAddSubject}
        onClose={() => { setShowAddSubject(false); setAddSelectedSection(null); }}
        title="Add Subject from Another Section"
        size="lg"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Browse sections to find a subject to add. You can pick subjects from any course or year level.
          </p>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

          {addSectionsLoading ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading sections...</div>
          ) : !addSelectedSection ? (
            /* Step 1: Pick a section */
            <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
              <h3 className="text-xs font-semibold text-gray-700">Select a section to browse its subjects</h3>
              {addSections.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No sections found</div>
              ) : (
                addSections.map((sec: any) => (
                  <button
                    key={sec.id}
                    onClick={() => setAddSelectedSection(sec)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:border-primary-300 hover:bg-primary-50/30"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{sec.code}</div>
                      <div className="text-[10px] text-gray-400">
                        {sec.course?.code} · {sec.schedules?.length || 0} schedule entries
                      </div>
                    </div>
                    <span className="text-xs text-primary-500">Browse →</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* Step 2: Pick subjects from the selected section */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-700">
                  Subjects in <span className="text-primary-600">{addSelectedSection.code}</span>
                </h3>
                <button onClick={() => setAddSelectedSection(null)} className="text-[10px] text-primary-600 hover:text-primary-700">
                  ← Back to sections
                </button>
              </div>

              <div className="max-h-[350px] space-y-2 overflow-y-auto pr-1">
                {(() => {
                  // Get unique subjects from this section's schedules
                  const subjectMap = new Map<number, any>();
                  for (const sched of addSelectedSection.schedules || []) {
                    if (!subjectMap.has(sched.subject.id)) {
                      subjectMap.set(sched.subject.id, {
                        ...sched.subject,
                        schedules: [],
                      });
                    }
                    subjectMap.get(sched.subject.id).schedules.push(sched);
                  }
                  const subjects = Array.from(subjectMap.values());

                  if (subjects.length === 0) {
                    return <div className="py-8 text-center text-xs text-gray-400">No subjects scheduled in this section</div>;
                  }

                  return subjects.map((sub: any) => {
                    const alreadyAdded = enrolledSubjectIds.has(sub.id);
                    return (
                      <div key={sub.id} className={`rounded-lg border p-3 ${alreadyAdded ? "border-green-200 bg-green-50/30" : "border-gray-200 hover:border-primary-300"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{sub.code}</div>
                            <div className="text-[10px] text-gray-500">{sub.description}</div>
                            <div className="text-[10px] text-gray-400">
                              Lec: {sub.units_lec} · Lab: {sub.units_lab}
                            </div>
                          </div>
                          {alreadyAdded ? (
                            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                              <HiOutlineCheckCircle className="h-3 w-3" /> Already enrolled
                            </span>
                          ) : (
                            <Button size="sm" disabled={adding} loading={adding} onClick={() => handleAddSubject(sub.id, addSelectedSection.id)}>
                              <HiOutlinePlus className="mr-1 h-3 w-3" /> Add
                            </Button>
                          )}
                        </div>
                        {/* Schedule info */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {sub.schedules
                            .sort((a: any, b: any) => (DAY_ORDER[a.day_of_week] || 99) - (DAY_ORDER[b.day_of_week] || 99))
                            .map((sched: any) => (
                              <span key={sched.id} className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {DAY_ABBR[sched.day_of_week]} {formatTime(sched.start_time)}-{formatTime(sched.end_time)} · {sched.room.code}
                                {sched.instructor && ` · ${sched.instructor}`}
                                <span className={`ml-1 ${sched.schedule_type === "lecture" ? "text-blue-500" : "text-purple-500"}`}>
                                  ({sched.schedule_type})
                                </span>
                              </span>
                            ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ─── SCHEDULE DETAIL MODAL ───────────────────── */}
      <Modal
        open={!!viewScheduleSection}
        onClose={() => setViewScheduleSection(null)}
        title={`Class Schedule — ${viewScheduleSection?.code || ""}`}
        size="lg"
      >
        {viewScheduleSection?.schedules && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Room</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Instructor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {viewScheduleSection.schedules
                  .sort((a: any, b: any) => {
                    const dayDiff = (DAY_ORDER[a.day_of_week] || 99) - (DAY_ORDER[b.day_of_week] || 99);
                    return dayDiff !== 0 ? dayDiff : a.start_time.localeCompare(b.start_time);
                  })
                  .map((sched: any) => (
                    <tr key={sched.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <div className="font-medium">{sched.subject.code}</div>
                        <div className="text-[10px] text-gray-400">{sched.subject.description}</div>
                      </td>
                      <td className="px-3 py-2">{sched.day_of_week}</td>
                      <td className="px-3 py-2">{formatTime(sched.start_time)} — {formatTime(sched.end_time)}</td>
                      <td className="px-3 py-2">{sched.room.code}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          sched.schedule_type === "lecture" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                        }`}>{sched.schedule_type}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{sched.instructor || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
