import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineCalendarDays,
  HiOutlineBookOpen,
  HiOutlineChevronDown,
  HiOutlineEye,
  HiOutlineFlag,
} from "react-icons/hi2";
import type { InstitutionSettings } from "@shared/types";
import { applyThemeToDOM } from "../hooks/useTheme";

const BASE_URL = "/api";

interface CurriculumSubject {
  year_level: number;
  subject_code: string;
  subject_name: string;
  units_lec: number;
  units_lab: number;
  is_elective: boolean;
  semester_code: string;
  semester_name: string;
  semester_sort: number;
}

interface CourseDetail {
  id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  description_long: string | null;
  duration: string | null;
  duration_years: number | null;
  degree_type: string | null;
  is_featured: boolean;
  course_vision: string | null;
  course_mission: string | null;
  curriculum_name: string | null;
  subjects: CurriculumSubject[];
}

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/landing/course-offerings/${id}`).then((r) => r.json()),
      fetch(`${BASE_URL}/landing/institution`).then((r) => r.json()),
    ]).then(([courseRes, instRes]) => {
      if (courseRes.success) {
        setCourse(courseRes.data);
        const years = new Set<number>(
          (courseRes.data.subjects as CurriculumSubject[]).map((s) => s.year_level)
        );
        setExpandedYears(years);
      } else {
        setError(true);
      }
      const inst = instRes.data || null;
      setInstitution(inst);
      if (inst?.primary_color && inst?.secondary_color) {
        applyThemeToDOM(inst.primary_color, inst.secondary_color);
      }
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const institutionName = institution?.name || "PDM Enrollment System";
  const logoPath = institution?.logo_path;

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  // Group subjects by year_level then by semester
  const grouped: Record<number, Record<string, CurriculumSubject[]>> = {};
  if (course) {
    for (const s of course.subjects) {
      if (!grouped[s.year_level]) grouped[s.year_level] = {};
      const semKey = `${s.semester_sort}_${s.semester_name}`;
      if (!grouped[s.year_level][semKey]) grouped[s.year_level][semKey] = [];
      grouped[s.year_level][semKey].push(s);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3">
              {logoPath && <img src={logoPath} alt="" className="h-10 w-10 rounded-lg object-contain" />}
              <span className="text-lg font-bold text-primary-800">{institutionName}</span>
            </Link>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <HiOutlineAcademicCap className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Program not found</h2>
          <p className="mt-2 text-gray-500">This program may no longer be available.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const yearLabels: Record<number, string> = { 1: "First Year", 2: "Second Year", 3: "Third Year", 4: "Fourth Year", 5: "Fifth Year" };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            {logoPath && <img src={logoPath} alt="" className="h-10 w-10 rounded-lg object-contain" />}
            <span className="text-lg font-bold text-primary-800">{institutionName}</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-black/10 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex items-start gap-5">
            <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <HiOutlineAcademicCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-primary-200 font-medium text-sm mb-1">{course.course_code}</p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{course.course_name}</h1>
              <div className="mt-4 flex flex-wrap gap-3">
                {course.degree_type && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm ring-1 ring-white/20">
                    <HiOutlineAcademicCap className="h-4 w-4" />
                    {course.degree_type}
                  </span>
                )}
                {(course.duration || course.duration_years) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm ring-1 ring-white/20">
                    <HiOutlineCalendarDays className="h-4 w-4" />
                    {course.duration || `${course.duration_years} year${(course.duration_years ?? 0) > 1 ? "s" : ""}`}
                  </span>
                )}
                {course.subjects.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm ring-1 ring-white/20">
                    <HiOutlineBookOpen className="h-4 w-4" />
                    {course.subjects.length} subjects
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left — Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {course.description_long && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About This Program</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{course.description_long}</p>
              </div>
            )}

            {/* Vision & Mission */}
            {(course.course_vision || course.course_mission) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Vision & Mission</h2>
                <div className={`grid gap-6 ${course.course_vision && course.course_mission ? "sm:grid-cols-2" : ""}`}>
                  {course.course_vision && (
                    <div className="rounded-xl bg-primary-50/50 border border-primary-100 p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                          <HiOutlineEye className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-primary-800">Vision</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{course.course_vision}</p>
                    </div>
                  )}
                  {course.course_mission && (
                    <div className="rounded-xl bg-primary-50/50 border border-primary-100 p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                          <HiOutlineFlag className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-primary-800">Mission</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{course.course_mission}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Institution Vision & Mission */}
            {(institution?.vision || institution?.mission) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Institutional Vision & Mission</h2>
                <div className={`grid gap-6 ${institution.vision && institution.mission ? "sm:grid-cols-2" : ""}`}>
                  {institution.vision && (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                          <HiOutlineEye className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Vision</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{institution.vision}</p>
                    </div>
                  )}
                  {institution.mission && (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                          <HiOutlineFlag className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Mission</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{institution.mission}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Curriculum */}
            {Object.keys(grouped).length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Curriculum</h2>
                    {course.curriculum_name && (
                      <p className="text-sm text-gray-500 mt-0.5">{course.curriculum_name}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                    {course.subjects.length} subjects
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries(grouped)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([yearStr, semesters]) => {
                      const year = Number(yearStr);
                      const isOpen = expandedYears.has(year);
                      return (
                        <div key={year} className="rounded-xl border border-gray-100 overflow-hidden">
                          <button
                            onClick={() => toggleYear(year)}
                            className="flex w-full items-center justify-between bg-gray-50 px-5 py-3.5 text-left hover:bg-gray-100 transition"
                          >
                            <span className="font-semibold text-gray-800">
                              {yearLabels[year] || `Year ${year}`}
                            </span>
                            <HiOutlineChevronDown
                              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[2000px]" : "max-h-0"}`}>
                            <div className="p-5 space-y-5">
                              {Object.entries(semesters)
                                .sort(([a], [b]) => Number(a.split("_")[0]) - Number(b.split("_")[0]))
                                .map(([semKey, subjects]) => {
                                  const semName = semKey.split("_").slice(1).join("_");
                                  const totalUnits = subjects.reduce(
                                    (sum, s) => sum + Number(s.units_lec) + Number(s.units_lab),
                                    0
                                  );
                                  return (
                                    <div key={semKey}>
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-primary-700">{semName}</h4>
                                        <span className="text-xs text-gray-500">{totalUnits} units</span>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b border-gray-100 text-left">
                                              <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Code</th>
                                              <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Subject</th>
                                              <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider text-center w-16">Lec</th>
                                              <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider text-center w-16">Lab</th>
                                              <th className="pb-2 font-medium text-gray-500 text-xs uppercase tracking-wider text-center w-16">Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {subjects.map((s) => (
                                              <tr key={s.subject_code} className="border-b border-gray-50 last:border-0">
                                                <td className="py-2.5 pr-4 font-mono text-xs text-primary-600 font-medium">{s.subject_code}</td>
                                                <td className="py-2.5 pr-4 text-gray-800">
                                                  {s.subject_name}
                                                  {s.is_elective && (
                                                    <span className="ml-2 inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                                      Elective
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="py-2.5 pr-4 text-center text-gray-600">{s.units_lec}</td>
                                                <td className="py-2.5 pr-4 text-center text-gray-600">{s.units_lab}</td>
                                                <td className="py-2.5 text-center font-medium text-gray-800">{Number(s.units_lec) + Number(s.units_lab)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar — Quick Info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sticky top-24">
              <h3 className="text-base font-bold text-gray-900 mb-4">Program Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Program Code</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">{course.course_code}</dd>
                </div>
                {course.degree_type && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Degree Type</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">{course.degree_type}</dd>
                  </div>
                )}
                {(course.duration || course.duration_years) && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                      {course.duration || `${course.duration_years} year${(course.duration_years ?? 0) > 1 ? "s" : ""}`}
                    </dd>
                  </div>
                )}
                {course.subjects.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Subjects</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">{course.subjects.length}</dd>
                  </div>
                )}
                {course.subjects.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Units</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                      {course.subjects.reduce((sum, s) => sum + Number(s.units_lec) + Number(s.units_lab), 0)}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-6 pt-5 border-t border-gray-100">
                <Link
                  to="/register"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition"
                >
                  <HiOutlineAcademicCap className="h-5 w-5" />
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-10 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              {logoPath && <img src={logoPath} alt="" className="h-8 w-8 rounded-lg object-contain" />}
              <span className="font-semibold text-gray-800">{institutionName}</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {institutionName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
