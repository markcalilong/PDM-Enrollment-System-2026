import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCrud } from "../../hooks/useCrud";
import { sectionService, courseService, semesterService, schoolYearService } from "../../services/maintenanceService";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import type { Section, Course, Semester, SchoolYear } from "@shared/types";

interface FormData {
  course_id: number;
  year_level: number;
  semester_id: number;
  school_year_id: number;
  section_letter: string;
  max_students: number;
}

export function SectionPage() {
  const { items, loading, create, update, remove } = useCrud(sectionService);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    courseService.getAll().then((r) => setCourses(r.data || []));
    semesterService.getAll().then((r) => setSemesters(r.data || []));
    schoolYearService.getAll().then((r) => setSchoolYears(r.data || []));
  }, []);

  const openCreate = () => { setEditing(null); reset({ course_id: 0, year_level: 1, semester_id: 0, school_year_id: 0, section_letter: "A", max_students: 40 }); setError(null); setModalOpen(true); };
  const openEdit = (item: Section) => {
    setEditing(item);
    reset({ course_id: item.course_id, year_level: item.year_level, semester_id: item.semester_id, school_year_id: item.school_year_id, section_letter: item.section_letter, max_students: item.max_students });
    setError(null);
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      const payload = { ...data, course_id: Number(data.course_id), semester_id: Number(data.semester_id), school_year_id: Number(data.school_year_id), section_letter: data.section_letter.toUpperCase() };
      editing ? await update(editing.id, payload as any) : await create(payload as any);
      setModalOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
  };

  const handleDelete = async (item: Section) => {
    if (!confirm(`Delete section "${item.code}"?`)) return;
    try { await remove(item.id); } catch (err) { alert(err instanceof Error ? err.message : "Cannot delete: section is in use"); }
  };

  return (
    <div>
      <PageHeader title="Sections" subtitle="Manage class sections" onAdd={openCreate} />
      <DataTable
        columns={[
          { key: "code", header: "Code", render: (item: Section) => <span className="font-bold text-primary-700">{item.code}</span> },
          { key: "course", header: "Course", render: (item: Section) => (item.course as any)?.code || "" },
          { key: "year_level", header: "Year" },
          { key: "semester", header: "Semester", render: (item: Section) => (item.semester as any)?.name || "" },
          { key: "school_year", header: "School Year", render: (item: Section) => { const sy = item.school_year as any; return sy ? `${sy.year_start}-${sy.year_end}` : ""; } },
          { key: "section_letter", header: "Section" },
          {
            key: "max_students",
            header: "Max Students",
            render: (item: Section) => (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {item.max_students}
              </span>
            ),
          },
        ]}
        data={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Section" : "Add Section"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Course</label>
            <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("course_id", { required: "Required" })}>
              <option value="">Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.description}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Year Level</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("year_level", { required: "Required", valueAsNumber: true })}>
                {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Semester</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("semester_id", { required: "Required" })}>
                <option value="">Select semester</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">School Year</label>
            <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" {...register("school_year_id", { required: "Required" })}>
              <option value="">Select school year</option>
              {schoolYears.map((sy) => <option key={sy.id} value={sy.id}>{sy.year_start}-{sy.year_end}{sy.is_active ? " (Active)" : ""}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Section Letter</label>
              <input className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase" maxLength={5} placeholder="A" {...register("section_letter", { required: "Required" })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Max Students Allowed</label>
              <input type="number" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="40" {...register("max_students", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Min 1" } })} />
              <p className="mt-1 text-[11px] text-gray-500">Limits enrollment count (e.g. lab room capacity)</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
