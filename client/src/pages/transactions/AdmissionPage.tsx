import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineChevronRight,
  HiOutlineUserPlus,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { admissionService, courseService, schoolYearService, semesterService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Course, SchoolYear, Curriculum } from "@shared/types";
import { api } from "../../services/api";

// ─── Types ───────────────────────────────────────────────
interface StudentForm {
  // Personal
  last_name: string;
  first_name: string;
  middle_name: string;
  suffix: string;
  sex: string;
  height: number | null;
  weight: number | null;
  nationality: string;
  religion: string;
  date_of_birth: string;
  place_of_birth: string;
  civil_status: string;
  contact_number: string;
  email: string;
  present_address: string;
  present_zip: string;
  permanent_address: string;
  permanent_zip: string;
  emergency_name: string;
  emergency_relationship: string;
  emergency_address: string;
  emergency_contact: string;
  // Enrollment
  course_id: number;
  year_level: number;
}

interface FamilyForm {
  father_name: string; father_address: string; father_birthday: string; father_contact: string; father_education: string; father_occupation: string; father_status: string;
  mother_name: string; mother_address: string; mother_birthday: string; mother_contact: string; mother_education: string; mother_occupation: string; mother_status: string;
  guardian_name: string; guardian_relationship: string; guardian_address: string; guardian_birthday: string; guardian_contact: string; guardian_education: string; guardian_occupation: string;
}

interface EducationEntry {
  level: string;
  school_name: string;
  inclusive_year: string;
  address: string;
  lrn: string;
  course: string;
}

const STEPS = ["Personal", "Family Background", "Educational Background", "Review"];

export function AdmissionPage() {
  // List
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);

  // Lookups
  const [courses, setCourses] = useState<Course[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [activeSY, setActiveSY] = useState<SchoolYear | null>(null);

  // Forms
  const personal = useForm<StudentForm>({ defaultValues: { nationality: "Filipino", civil_status: "Single", year_level: 1, sex: "Male", course_id: 0 } });
  const family = useForm<FamilyForm>();
  const [education, setEducation] = useState<EducationEntry[]>([
    { level: "elementary", school_name: "", inclusive_year: "", address: "", lrn: "", course: "" },
    { level: "grade_10", school_name: "", inclusive_year: "", address: "", lrn: "", course: "" },
    { level: "grade_12", school_name: "", inclusive_year: "", address: "", lrn: "", course: "" },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected course → filter curricula
  const watchCourseId = personal.watch("course_id");

  useEffect(() => {
    fetchStudents();
    courseService.getAll().then((r) => setCourses(r.data || []));
    schoolYearService.getAll().then((r) => {
      const data = r.data || [];
      setSchoolYears(data);
      setActiveSY(data.find((sy: SchoolYear) => sy.is_active) || null);
    });
  }, []);

  useEffect(() => {
    if (watchCourseId && Number(watchCourseId) > 0) {
      api.get<Curriculum[]>("/maintenance/curricula").then((r) => {
        const all = r.data || [];
        setCurricula(all.filter((c: any) => c.course_id === Number(watchCourseId) || (c.course as any)?.id === Number(watchCourseId)));
      });
    } else {
      setCurricula([]);
    }
  }, [watchCourseId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await admissionService.getAll();
      setStudents(res.data || []);
    } finally { setLoading(false); }
  };

  const openNewAdmission = () => {
    personal.reset({ nationality: "Filipino", civil_status: "Single", year_level: 1, sex: "Male", course_id: 0 });
    family.reset();
    setEducation([
      { level: "elementary", school_name: "", inclusive_year: "", address: "", lrn: "", course: "" },
      { level: "grade_10", school_name: "", inclusive_year: "", address: "", lrn: "", course: "" },
      { level: "grade_12", school_name: "", inclusive_year: "", address: "", lrn: "", course: "" },
    ]);
    setStep(0);
    setError(null);
    setShowForm(true);
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setEducation((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  // Get the active curriculum for the selected course
  const getActiveCurriculum = () => {
    return curricula.find((c: any) => c.is_active) || curricula[0];
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const p = personal.getValues();
      const f = family.getValues();
      const activeCur = getActiveCurriculum();

      if (!activeSY) throw new Error("No active school year set");
      if (!activeCur) throw new Error("No active curriculum for this course");

      const payload = {
        ...p,
        course_id: Number(p.course_id),
        year_level: Number(p.year_level),
        curriculum_id: activeCur.id,
        admission_school_year_id: activeSY.id,
        height: p.height || null,
        weight: p.weight || null,
        family: f,
        education: education.filter((e) => e.school_name),
      };

      await admissionService.create(payload);
      setShowForm(false);
      fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async () => {
    if (step === 0) {
      const valid = await personal.trigger(["last_name", "first_name", "sex", "date_of_birth", "course_id"]);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const LEVEL_LABELS: Record<string, string> = {
    elementary: "Elementary (Grade 6)",
    basic_education: "Basic Education",
    high_school_old: "High School (Old Curriculum)",
    grade_10: "Grade 10",
    grade_12: "Grade 12",
    als: "ALS Graduate",
    transferee: "Transferee (Previous College)",
  };

  // ─── LIST VIEW ─────────────────────────────────────────
  if (!showForm) {
    return (
      <div>
        <PageHeader title="Admission" subtitle="Process new student admissions" onAdd={openNewAdmission} addLabel="New Admission" />

        {!activeSY && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            No active school year is set. Please set one in Maintenance → School Years before admitting students.
          </div>
        )}

        <DataTable
          columns={[
            { key: "student_no", header: "Student No.", render: (item: any) => <span className="font-mono font-medium text-primary-700">{item.student_no}</span> },
            { key: "name", header: "Name", render: (item: any) => <span className="font-medium">{item.last_name}, {item.first_name} {item.middle_name || ""} {item.suffix || ""}</span> },
            { key: "course", header: "Course", render: (item: any) => (item.course as any)?.code || "" },
            { key: "year_level", header: "Year" },
            { key: "school_year", header: "SY", render: (item: any) => { const sy = item.school_year as any; return sy ? `${sy.year_start}-${sy.year_end}` : ""; } },
            {
              key: "status",
              header: "Status",
              render: (item: any) => {
                const colors: Record<string, string> = {
                  admitted: "bg-blue-50 text-blue-700",
                  enrolled: "bg-green-50 text-green-700",
                  dropped: "bg-red-50 text-red-700",
                  graduated: "bg-amber-50 text-amber-700",
                  inactive: "bg-gray-100 text-gray-600",
                };
                return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[item.status] || ""}`}>{item.status}</span>;
              },
            },
          ]}
          data={students}
          loading={loading}
          onDelete={(item: any) => {
            if (confirm(`Delete student ${item.student_no}?`)) {
              admissionService.remove(item.id).then(fetchStudents).catch((e) => alert(e.message));
            }
          }}
        />
      </div>
    );
  }

  // ─── FORM VIEW ─────────────────────────────────────────
  const activeCur = getActiveCurriculum();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Admission</h1>
          <p className="mt-0.5 text-sm text-gray-500">Application for Admission</p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                i === step ? "bg-primary-600 text-white" :
                i < step ? "bg-primary-100 text-primary-700 hover:bg-primary-200" :
                "bg-gray-100 text-gray-500"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{i + 1}</span>
              {label}
            </button>
            {i < STEPS.length - 1 && <HiOutlineChevronRight className="h-4 w-4 text-gray-500" />}
          </div>
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Step 1: Personal */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Enrollment binding */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Enrollment Info</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Course <span className="text-red-500">*</span></label>
                <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...personal.register("course_id", { required: "Required" })}>
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.description}</option>)}
                </select>
                {personal.formState.errors.course_id && <p className="text-xs text-red-500 mt-1">{personal.formState.errors.course_id.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Year Level</label>
                <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...personal.register("year_level", { valueAsNumber: true })}>
                  {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Curriculum & School Year</label>
                <div className="flex gap-2 text-sm text-gray-600 py-2.5">
                  {Number(watchCourseId) > 0 ? (
                    activeCur
                      ? <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{activeCur.code}</span>
                      : <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">No curriculum for this course</span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Select a course first</span>
                  )}
                  {activeSY
                    ? <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">SY {activeSY.year_start}-{activeSY.year_end}</span>
                    : <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">No active SY</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">A. Personal Information</h3>
            <div className="grid grid-cols-4 gap-4">
              <Input label="Surname *" {...personal.register("last_name", { required: "Required" })} error={personal.formState.errors.last_name?.message} />
              <Input label="First Name *" {...personal.register("first_name", { required: "Required" })} error={personal.formState.errors.first_name?.message} />
              <Input label="Middle Name" {...personal.register("middle_name")} />
              <Input label="Suffix" placeholder="Jr., Sr., III" {...personal.register("suffix")} />
            </div>
            <div className="grid grid-cols-5 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Sex <span className="text-red-500">*</span></label>
                <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...personal.register("sex", { required: "Required" })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <Input label="Height (cm)" type="number" {...personal.register("height", { valueAsNumber: true })} />
              <Input label="Weight (kg)" type="number" {...personal.register("weight", { valueAsNumber: true })} />
              <Input label="Nationality" {...personal.register("nationality")} />
              <Input label="Religion" {...personal.register("religion")} />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <Input label="Date of Birth *" type="date" {...personal.register("date_of_birth", { required: "Required" })} error={personal.formState.errors.date_of_birth?.message} />
              <Input label="Place of Birth" {...personal.register("place_of_birth")} />
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Civil Status</label>
                <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...personal.register("civil_status")}>
                  {["Single", "Married", "Widowed", "Separated"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Contact Number" {...personal.register("contact_number")} />
            </div>
            <div className="mt-4">
              <Input label="Email Address" type="email" {...personal.register("email")} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input label="Present Address" {...personal.register("present_address")} />
              <Input label="ZIP Code" {...personal.register("present_zip")} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input label="Permanent Address" {...personal.register("permanent_address")} />
              <Input label="ZIP Code" {...personal.register("permanent_zip")} />
            </div>
          </div>

          {/* Emergency */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Person in Case of Emergency</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" {...personal.register("emergency_name")} />
              <Input label="Relationship" {...personal.register("emergency_relationship")} />
              <Input label="Address" {...personal.register("emergency_address")} />
              <Input label="Contact No." {...personal.register("emergency_contact")} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Family */}
      {step === 1 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">B. Family Background</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b">
                  <th className="py-2 pr-4 text-left font-semibold w-36" />
                  <th className="py-2 px-3 text-left font-semibold">Father</th>
                  <th className="py-2 px-3 text-left font-semibold">Mother</th>
                  <th className="py-2 px-3 text-left font-semibold">Guardian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {([
                  ["Name", "name", "name", "name"],
                  ["Address", "address", "address", "address"],
                  ["Birthday", "birthday", "birthday", "birthday"],
                  ["Contact No.", "contact", "contact", "contact"],
                  ["Education", "education", "education", "education"],
                  ["Occupation", "occupation", "occupation", "occupation"],
                ] as [string, string, string, string][]).map(([label, fKey, mKey, gKey]) => (
                  <tr key={label}>
                    <td className="py-2 pr-4 text-xs font-medium text-gray-600">{label}</td>
                    <td className="py-1.5 px-2">
                      <input
                        type={label === "Birthday" ? "date" : "text"}
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                        {...family.register(`father_${fKey}` as any)}
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type={label === "Birthday" ? "date" : "text"}
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                        {...family.register(`mother_${mKey}` as any)}
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type={label === "Birthday" ? "date" : "text"}
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                        {...family.register(`guardian_${gKey}` as any)}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-4 text-xs font-medium text-gray-600">Status / Relationship</td>
                  <td className="py-1.5 px-2">
                    <select className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" {...family.register("father_status")}>
                      <option value="">—</option>
                      {["Living", "Deceased", "Separated", "N/A"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 px-2">
                    <select className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" {...family.register("mother_status")}>
                      <option value="">—</option>
                      {["Living", "Deceased", "Separated", "N/A"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      placeholder="Relationship"
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                      {...family.register("guardian_relationship")}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: Education */}
      {step === 2 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">C. Educational Background</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b">
                <th className="py-2 text-left font-semibold w-44">Grade/Year Level</th>
                <th className="py-2 px-2 text-left font-semibold">Name of School</th>
                <th className="py-2 px-2 text-left font-semibold w-28">Inclusive Year</th>
                <th className="py-2 px-2 text-left font-semibold">Address</th>
                <th className="py-2 px-2 text-left font-semibold w-32">LRN#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {education.map((edu, i) => (
                <tr key={edu.level}>
                  <td className="py-2 pr-2 text-xs font-medium text-gray-700">{LEVEL_LABELS[edu.level] || edu.level}</td>
                  <td className="py-1.5 px-2"><input className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" value={edu.school_name} onChange={(e) => updateEducation(i, "school_name", e.target.value)} /></td>
                  <td className="py-1.5 px-2"><input className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" placeholder="2020-2024" value={edu.inclusive_year} onChange={(e) => updateEducation(i, "inclusive_year", e.target.value)} /></td>
                  <td className="py-1.5 px-2"><input className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" value={edu.address} onChange={(e) => updateEducation(i, "address", e.target.value)} /></td>
                  <td className="py-1.5 px-2"><input className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" value={edu.lrn} onChange={(e) => updateEducation(i, "lrn", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => setEducation((prev) => [...prev, { level: "transferee", school_name: "", inclusive_year: "", address: "", lrn: "", course: "" }])}
            className="mt-3 text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            + Add transferee / previous college
          </button>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 3 && (() => {
        const p = personal.getValues();
        const f = family.getValues();
        const course = courses.find((c) => c.id === Number(p.course_id));
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Review Application</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Name</span><span className="font-medium">{p.last_name}, {p.first_name} {p.middle_name || ""} {p.suffix || ""}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Course</span><span className="font-medium">{course?.code || ""}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Sex</span><span>{p.sex}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Year Level</span><span>{p.year_level}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Date of Birth</span><span>{p.date_of_birth}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Curriculum</span><span className="font-medium text-primary-700">{activeCur?.code}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Contact</span><span>{p.contact_number || "—"}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">School Year</span><span className="font-medium text-green-700">{activeSY ? `${activeSY.year_start}-${activeSY.year_end}` : "—"}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Email</span><span>{p.email || "—"}</span></div>
                <div className="flex justify-between border-b border-gray-50 py-1"><span className="text-gray-500">Address</span><span className="text-right max-w-[200px] truncate">{p.present_address || "—"}</span></div>
              </div>
            </div>
            {f.father_name && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Family</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><p className="text-xs text-gray-500">Father</p><p className="font-medium">{f.father_name || "—"}</p></div>
                  <div><p className="text-xs text-gray-500">Mother</p><p className="font-medium">{f.mother_name || "—"}</p></div>
                  <div><p className="text-xs text-gray-500">Guardian</p><p className="font-medium">{f.guardian_name || "—"}</p></div>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Education</h3>
              <div className="space-y-1 text-sm">
                {education.filter((e) => e.school_name).map((e) => (
                  <div key={e.level} className="flex justify-between border-b border-gray-50 py-1">
                    <span className="text-gray-500">{LEVEL_LABELS[e.level]}</span>
                    <span>{e.school_name} ({e.inclusive_year})</span>
                  </div>
                ))}
                {education.filter((e) => e.school_name).length === 0 && <p className="text-gray-500 text-xs">No education entries</p>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          {step > 0 && <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>Previous</Button>}
        </div>
        <div className="flex gap-3">
          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} loading={saving} className="gap-1.5">
              <HiOutlineUserPlus className="h-4 w-4" />
              Submit Admission
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
