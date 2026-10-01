import { useState, useEffect, useMemo } from "react";
import {
  HiOutlineAcademicCap,
  HiOutlineUser,
  HiOutlineClipboardDocumentCheck,
  HiOutlineLockClosed,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import {
  gradeService,
  ratingTransmutationService,
  semesterService,
  schoolYearService,
} from "../../services/maintenanceService";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { Button } from "../../components/ui/Button";
import type { Semester, SchoolYear } from "@shared/types";

const PASSING_GRADE = 3.0;

type Transmutation = { min_score: string | number; max_score: string | number; transmuted_grade: string | number };

// Live client-side preview of the transmuted grade (server remains source of truth).
function transmute(raw: number, table: Transmutation[]): number | null {
  const row = table.find((t) => raw >= Number(t.min_score) && raw <= Number(t.max_score));
  return row ? Number(row.transmuted_grade) : null;
}

function RemarkBadge({ remark }: { remark: string | null }) {
  if (!remark) return <span className="text-gray-400">—</span>;
  const styles: Record<string, string> = {
    Passed: "bg-green-50 text-green-700",
    Failed: "bg-red-50 text-red-700",
    INC: "bg-amber-50 text-amber-700",
    Dropped: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[remark] || "bg-gray-50 text-gray-700"}`}>
      {remark}
    </span>
  );
}

// A single editable grade row shared by both entry points.
type RowState = { mode: "score" | "INC" | "Dropped"; raw: string };

function fmtName(s: any) {
  return `${s.last_name}, ${s.first_name}${s.middle_name ? " " + s.middle_name.charAt(0) + "." : ""}`;
}
function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface GradeRowsProps {
  rows: any[]; // each has enrollment_subject_id, grade fields, and display fields
  labelFor: (r: any) => { primary: string; secondary?: string };
  transmutations: Transmutation[];
  state: Record<number, RowState>;
  setState: (esId: number, next: RowState) => void;
  onCompleteInc: (gradeId: number, rawScore: number) => void;
}

function GradeRows({ rows, labelFor, transmutations, state, setState, onCompleteInc }: GradeRowsProps) {
  const [incValues, setIncValues] = useState<Record<number, string>>({});

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Student / Subject</th>
            <th className="px-4 py-2.5 font-semibold w-40">Raw Score / Remark</th>
            <th className="px-4 py-2.5 font-semibold w-28">Final Grade</th>
            <th className="px-4 py-2.5 font-semibold w-28">Result</th>
            <th className="px-4 py-2.5 font-semibold w-24">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => {
            const esId = r.enrollment_subject_id;
            const st = state[esId] || { mode: "score", raw: r.raw_score != null ? String(r.raw_score) : "" };
            const label = labelFor(r);
            const isPosted = r.status === "posted";
            const isInc = r.remark === "INC";

            // Live preview
            let previewGrade: number | null = null;
            let previewRemark: string | null = null;
            if (st.mode === "score" && st.raw !== "") {
              const n = Number(st.raw);
              if (!Number.isNaN(n) && n >= 0 && n <= 100) {
                previewGrade = transmute(n, transmutations);
                if (previewGrade != null) previewRemark = previewGrade <= PASSING_GRADE ? "Passed" : "Failed";
              }
            } else if (st.mode === "INC") {
              previewRemark = "INC";
            } else if (st.mode === "Dropped") {
              previewRemark = "Dropped";
            }

            return (
              <tr key={esId} className="hover:bg-gray-50/60">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-800">{label.primary}</p>
                  {label.secondary && <p className="text-xs text-gray-500">{label.secondary}</p>}
                </td>
                <td className="px-4 py-2.5">
                  {isPosted && isInc ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Complete…"
                        value={incValues[r.grade_id] ?? ""}
                        onChange={(e) => setIncValues((p) => ({ ...p, [r.grade_id]: e.target.value }))}
                        className="w-20 rounded-md border border-amber-300 px-2 py-1 text-sm outline-none focus:border-amber-500"
                      />
                      <Button
                        size="sm"
                        onClick={() => onCompleteInc(r.grade_id, Number(incValues[r.grade_id]))}
                        disabled={!incValues[r.grade_id]}
                      >
                        Complete
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0-100"
                        disabled={st.mode !== "score"}
                        value={st.mode === "score" ? st.raw : ""}
                        onChange={(e) => setState(esId, { mode: "score", raw: e.target.value })}
                        className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-primary-500 disabled:bg-gray-100"
                      />
                      <select
                        value={st.mode === "score" ? "" : st.mode}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") setState(esId, { mode: "score", raw: st.raw });
                          else setState(esId, { mode: v as "INC" | "Dropped", raw: "" });
                        }}
                        className="rounded-md border border-gray-300 px-1.5 py-1 text-xs text-gray-600 outline-none focus:border-primary-500"
                      >
                        <option value="">Score</option>
                        <option value="INC">INC</option>
                        <option value="Dropped">Dropped</option>
                      </select>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 font-semibold text-gray-800">
                  {previewGrade != null ? previewGrade.toFixed(2) : r.final_grade != null ? Number(r.final_grade).toFixed(2) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-2.5">
                  <RemarkBadge remark={previewRemark || r.remark} />
                  {isInc && r.inc_deadline && (
                    <p className="mt-0.5 text-[10px] text-amber-600">expires {fmtDate(r.inc_deadline)}</p>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {isPosted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                      <HiOutlineLockClosed className="h-3 w-3" /> Posted
                    </span>
                  ) : r.grade_id ? (
                    <span className="text-[10px] text-gray-400">Draft</span>
                  ) : (
                    <span className="text-[10px] text-gray-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type Tab = "section" | "student";

export function GradePostingPage() {
  const [tab, setTab] = useState<Tab>("section");
  const [transmutations, setTransmutations] = useState<Transmutation[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Shared edit state keyed by enrollment_subject_id
  const [rowState, setRowState] = useState<Record<number, RowState>>({});
  const setRow = (esId: number, next: RowState) => setRowState((p) => ({ ...p, [esId]: next }));

  // ── Section+Subject tab ──
  const [secSY, setSecSY] = useState(0);
  const [secSem, setSecSem] = useState(0);
  const [sections, setSections] = useState<any[]>([]);
  const [secId, setSecId] = useState(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subId, setSubId] = useState(0);
  const [classData, setClassData] = useState<any | null>(null);

  // ── Student tab ──
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState(0);
  const [studentData, setStudentData] = useState<any | null>(null);

  useEffect(() => {
    ratingTransmutationService.getAll().then((r) => setTransmutations((r.data || []) as Transmutation[]));
    semesterService.getAll().then((r) => setSemesters((r.data || []) as Semester[]));
    schoolYearService.getAll().then((r) => setSchoolYears((r.data || []) as SchoolYear[]));
    gradeService.getStudents().then((r) => setStudents(r.data || []));
  }, []);

  // Load sections when term changes
  useEffect(() => {
    setSecId(0); setSubjects([]); setSubId(0); setClassData(null);
    gradeService.getSections(secSem || undefined, secSY || undefined).then((r) => setSections(r.data || []));
  }, [secSY, secSem]);

  // Load subjects when section changes
  useEffect(() => {
    setSubId(0); setClassData(null); setSubjects([]);
    if (secId) gradeService.getSubjectsForSection(secId).then((r) => setSubjects(r.data || []));
  }, [secId]);

  async function loadClass() {
    if (!secId || !subId) return;
    setRowState({});
    const r = await gradeService.getClassGrades(secId, subId);
    setClassData(r.data);
  }
  useEffect(() => { if (secId && subId) loadClass(); /* eslint-disable-next-line */ }, [subId]);

  async function loadStudent(id: number) {
    setRowState({});
    const r = await gradeService.getStudentGrades(id);
    setStudentData(r.data);
  }
  useEffect(() => { if (studentId) loadStudent(studentId); else setStudentData(null); /* eslint-disable-next-line */ }, [studentId]);

  // Build the entries payload from current row state for a given set of rows
  function buildEntries(rows: any[], status: "draft" | "posted") {
    const entries: any[] = [];
    for (const r of rows) {
      const esId = r.enrollment_subject_id;
      const st = rowState[esId];
      // Skip posted non-INC rows and untouched empty rows
      if (r.status === "posted" && r.remark !== "INC") continue;
      if (!st) continue;
      if (st.mode === "score") {
        if (st.raw === "") continue; // nothing entered
        entries.push({ enrollment_subject_id: esId, raw_score: st.raw, status });
      } else {
        entries.push({ enrollment_subject_id: esId, remark: st.mode, status });
      }
    }
    return entries;
  }

  async function save(rows: any[], status: "draft" | "posted", reload: () => void) {
    setError(null); setNotice(null);
    const entries = buildEntries(rows, status);
    if (entries.length === 0) {
      setError("Nothing to save — enter at least one grade.");
      return;
    }
    setSaving(true);
    try {
      await gradeService.save(entries);
      setNotice(`${entries.length} grade${entries.length > 1 ? "s" : ""} ${status === "posted" ? "posted" : "saved as draft"}.`);
      setRowState({});
      reload();
    } catch (e: any) {
      setError(e.message || "Failed to save grades");
    } finally {
      setSaving(false);
    }
  }

  async function completeInc(gradeId: number, rawScore: number, reload: () => void) {
    setError(null); setNotice(null);
    try {
      await gradeService.completeInc(gradeId, rawScore);
      setNotice("INC completed.");
      reload();
    } catch (e: any) {
      setError(e.message || "Failed to complete INC");
    }
  }

  const sectionOpts = useMemo(
    () => sections.map((s) => ({ value: s.id, label: s.code, sublabel: `${s.course?.code} · ${s.enrolled_count} enrolled` })),
    [sections]
  );
  const subjectOpts = useMemo(
    () => subjects.map((s) => ({ value: s.id, label: s.code, sublabel: s.description })),
    [subjects]
  );
  const studentOpts = useMemo(
    () => students.map((s) => ({ value: s.id, label: fmtName(s), sublabel: `${s.student_no} · ${s.course?.code}` })),
    [students]
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="hidden h-9 w-1.5 rounded-full bg-primary-600 sm:block" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Grade Posting</h1>
          <p className="mt-0.5 text-sm text-gray-600">
            Encode raw scores — final grades are transmuted automatically. Passing is ≤ {PASSING_GRADE.toFixed(2)}. INC expires to Failed after 1 year.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {([
          { id: "section", label: "By Section & Subject", icon: HiOutlineAcademicCap },
          { id: "student", label: "By Student", icon: HiOutlineUser },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(null); setNotice(null); }}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <HiOutlineClipboardDocumentCheck className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* ── Section & Subject ── */}
      {tab === "section" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <SearchSelect
              label="School Year"
              placeholder="All"
              options={schoolYears.map((y) => ({ value: y.id, label: `${y.year_start}-${y.year_end}` }))}
              value={secSY}
              onChange={setSecSY}
            />
            <SearchSelect
              label="Semester"
              placeholder="All"
              options={semesters.map((s) => ({ value: s.id, label: s.name }))}
              value={secSem}
              onChange={setSecSem}
            />
            <SearchSelect label="Section" placeholder="Select section" options={sectionOpts} value={secId} onChange={setSecId} />
            <SearchSelect label="Subject" placeholder="Select subject" options={subjectOpts} value={subId} onChange={setSubId} />
          </div>

          {classData && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {classData.subject?.code} — {classData.subject?.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Section {classData.section?.code} · {classData.section?.semester?.name} · {classData.section?.school_year?.year_start}-{classData.section?.school_year?.year_end} · {classData.students.length} students
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => save(classData.students, "draft", loadClass)} loading={saving}>
                    Save Draft
                  </Button>
                  <Button onClick={() => save(classData.students, "posted", loadClass)} loading={saving}>
                    Post Grades
                  </Button>
                </div>
              </div>
              {classData.students.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">No students taking this subject in this section.</p>
              ) : (
                <GradeRows
                  rows={classData.students}
                  labelFor={(r) => ({ primary: fmtName(r), secondary: `${r.student_no} · ${r.course?.code}` })}
                  transmutations={transmutations}
                  state={rowState}
                  setState={setRow}
                  onCompleteInc={(gid, rs) => completeInc(gid, rs, loadClass)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── By Student ── */}
      {tab === "student" && (
        <div className="space-y-4">
          <div className="max-w-md">
            <SearchSelect label="Student" placeholder="Search enrolled student" options={studentOpts} value={studentId} onChange={setStudentId} />
          </div>

          {studentData && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{fmtName(studentData.student)}</p>
                  <p className="text-xs text-gray-500">
                    {studentData.student.student_no} · {studentData.student.course?.code} · Year {studentData.student.year_level}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => save(studentData.subjects, "draft", () => loadStudent(studentId))} loading={saving}>
                    Save Draft
                  </Button>
                  <Button onClick={() => save(studentData.subjects, "posted", () => loadStudent(studentId))} loading={saving}>
                    Post Grades
                  </Button>
                </div>
              </div>
              {studentData.subjects.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">No enrolled subjects found.</p>
              ) : (
                <GradeRows
                  rows={studentData.subjects}
                  labelFor={(r) => ({
                    primary: `${r.subject?.code} — ${r.subject?.description}`,
                    secondary: `${r.semester?.name} · ${r.school_year?.year_start}-${r.school_year?.year_end} · Sec ${r.section?.code}`,
                  })}
                  transmutations={transmutations}
                  state={rowState}
                  setState={setRow}
                  onCompleteInc={(gid, rs) => completeInc(gid, rs, () => loadStudent(studentId))}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
