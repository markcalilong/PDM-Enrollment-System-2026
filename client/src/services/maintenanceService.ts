import { api } from "./api";
import { API_BASE } from "./apiBase";

function createMaintenanceService<T>(endpoint: string) {
  const base = `/maintenance/${endpoint}`;
  return {
    getAll: () => api.get<T[]>(base),
    getById: (id: number) => api.get<T>(`${base}/${id}`),
    create: (data: Partial<T>) => api.post<T>(base, data),
    update: (id: number, data: Partial<T>) => api.put<T>(`${base}/${id}`, data),
    remove: (id: number) => api.delete(`${base}/${id}`),
  };
}

export const schoolYearService = {
  ...createMaintenanceService("school-years"),
  setActive: (id: number) => api.patch(`/maintenance/school-years/${id}/activate`),
};

export const semesterService = createMaintenanceService("semesters");
export const courseService = createMaintenanceService("courses");

export const subjectService = {
  ...createMaintenanceService("subjects"),
  setPrerequisites: (id: number, prerequisite_ids: number[]) =>
    api.put(`/maintenance/subjects/${id}/prerequisites`, { prerequisite_ids }),
};

export const admissionRequirementService = createMaintenanceService("admission-requirements");
export const miscellaneousFeeService = createMaintenanceService("miscellaneous-fees");
export const ratingTransmutationService = createMaintenanceService("rating-transmutations");
export const roomService = createMaintenanceService("rooms");

export const curriculumService = {
  ...createMaintenanceService("curricula"),
  setSubjects: (id: number, subjects: Array<{ subject_id: number; semester_id: number; year_level: number; is_elective?: boolean }>) =>
    api.put(`/maintenance/curricula/${id}/subjects`, { subjects }),
  addSubject: (id: number, data: { subject_id: number; semester_id: number; year_level: number; is_elective?: boolean }) =>
    api.post(`/maintenance/curricula/${id}/subjects`, data),
  removeSubject: (curriculumId: number, subjectId: number) =>
    api.delete(`/maintenance/curricula/${curriculumId}/subjects/${subjectId}`),
};

export const sectionService = createMaintenanceService("sections");
export const labTypeService = { getAll: () => api.get<any[]>("/maintenance/lab-types") };
export const tuitionRateService = createMaintenanceService("tuition-rates");

async function scheduleRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.message || "Request failed");
    if (data.conflicts) err.conflicts = data.conflicts;
    throw err;
  }
  return data;
}

export const classScheduleService = {
  getSections: (schoolYearId?: number, semesterId?: number) => {
    const params = new URLSearchParams();
    if (schoolYearId) params.set("school_year_id", String(schoolYearId));
    if (semesterId) params.set("semester_id", String(semesterId));
    return api.get<any[]>(`/maintenance/class-schedules/sections?${params}`);
  },
  getBySection: (sectionId: number) => api.get<any[]>(`/maintenance/class-schedules/section/${sectionId}`),
  getSubjectsForSection: (sectionId: number) => api.get<any[]>(`/maintenance/class-schedules/section/${sectionId}/subjects`),
  create: (data: any) => scheduleRequest<any>("/maintenance/class-schedules", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) => scheduleRequest<any>(`/maintenance/class-schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => api.delete(`/maintenance/class-schedules/${id}`),
};

// ─── Transactions ────────────────────────────────────────
export const admissionService = {
  getAll: () => api.get<any[]>("/transactions/admission"),
  getById: (id: number) => api.get<any>(`/transactions/admission/${id}`),
  create: (data: any) => api.post<any>("/transactions/admission", data),
  update: (id: number, data: any) => api.put<any>(`/transactions/admission/${id}`, data),
  remove: (id: number) => api.delete(`/transactions/admission/${id}`),
};

export const advisingService = {
  getAll: () => api.get<any[]>("/transactions/advising"),
  getById: (id: number) => api.get<any>(`/transactions/advising/${id}`),
  preview: (studentId: number, semesterId: number) =>
    api.get<any[]>(`/transactions/advising/preview?student_id=${studentId}&semester_id=${semesterId}`),
  create: (data: any) => api.post<any>("/transactions/advising", data),
  updateSubjects: (id: number, subjectIds: number[]) =>
    api.put<any>(`/transactions/advising/${id}/subjects`, { subject_ids: subjectIds }),
  approve: (id: number) => api.patch<any>(`/transactions/advising/${id}/approve`),
  remove: (id: number) => api.delete(`/transactions/advising/${id}`),
};

export const assessmentService = {
  getAll: () => api.get<any[]>("/transactions/assessment"),
  getById: (id: number) => api.get<any>(`/transactions/assessment/${id}`),
  compute: (advisingId: number) => api.get<any>(`/transactions/assessment/compute?advising_id=${advisingId}`),
  create: (data: any) => api.post<any>("/transactions/assessment", data),
  remove: (id: number) => api.delete(`/transactions/assessment/${id}`),
};

export const paymentService = {
  getAll: () => api.get<any[]>("/transactions/payment"),
  getAssessments: () => api.get<any[]>("/transactions/payment/assessments"),
  getByAssessment: (assessmentId: number) => api.get<any>(`/transactions/payment/assessment/${assessmentId}`),
  getStudents: () => api.get<any[]>("/transactions/payment/students"),
  getOtherPayments: () => api.get<any[]>("/transactions/payment/other"),
  create: (data: any) => api.post<any>("/transactions/payment", data),
  remove: (id: number) => api.delete(`/transactions/payment/${id}`),
};

export const sectioningService = {
  getStudents: () => api.get<any[]>("/transactions/sectioning/students"),
  getSections: (courseId: number, yearLevel: number, semesterId: number, schoolYearId: number) =>
    api.get<any[]>(`/transactions/sectioning/sections?course_id=${courseId}&year_level=${yearLevel}&semester_id=${semesterId}&school_year_id=${schoolYearId}`),
  getAllSections: (semesterId: number, schoolYearId: number) =>
    api.get<any[]>(`/transactions/sectioning/all-sections?semester_id=${semesterId}&school_year_id=${schoolYearId}`),
  getEnrollments: () => api.get<any[]>("/transactions/sectioning/enrollments"),
  getEnrollmentById: (id: number) => api.get<any>(`/transactions/sectioning/enrollments/${id}`),
  enroll: (data: any) => api.post<any>("/transactions/sectioning", data),
  changeSection: (id: number, sectionId: number) => api.patch<any>(`/transactions/sectioning/${id}/change-section`, { section_id: sectionId }),
  reassignSubject: (id: number, subjectId: number, sectionId: number) =>
    api.patch<any>(`/transactions/sectioning/${id}/reassign-subject`, { subject_id: subjectId, section_id: sectionId }),
  addSubject: (id: number, subjectId: number, sectionId: number) =>
    api.post<any>(`/transactions/sectioning/${id}/add-subject`, { subject_id: subjectId, section_id: sectionId }),
  removeSubject: (id: number, subjectId: number) =>
    api.delete(`/transactions/sectioning/${id}/subject/${subjectId}`),
  unenroll: (id: number) => api.delete(`/transactions/sectioning/${id}`),
  getClassListSections: (semesterId?: number, schoolYearId?: number) => {
    const params = new URLSearchParams();
    if (semesterId) params.set("semester_id", String(semesterId));
    if (schoolYearId) params.set("school_year_id", String(schoolYearId));
    return api.get<any[]>(`/transactions/sectioning/class-list/sections?${params}`);
  },
  getClassList: (sectionId: number) => api.get<any>(`/transactions/sectioning/class-list/${sectionId}`),
};

// ─── Landing Page (Admin CRUD) ──────────────────────────
export const heroSlideService = {
  getAll: () => api.get<any[]>("/landing/admin/hero-slides"),
  create: async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/landing/admin/hero-slides`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create");
    return data;
  },
  update: async (id: number, formData: FormData) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/landing/admin/hero-slides/${id}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update");
    return data;
  },
  remove: (id: number) => api.delete(`/landing/admin/hero-slides/${id}`),
};

export const announcementService = {
  getAll: () => api.get<any[]>("/landing/admin/announcements"),
  getById: (id: number) => api.get<any>(`/landing/admin/announcements/${id}`),
  create: async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/landing/admin/announcements`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create");
    return data;
  },
  update: async (id: number, formData: FormData) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/landing/admin/announcements/${id}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update");
    return data;
  },
  remove: (id: number) => api.delete(`/landing/admin/announcements/${id}`),
};

export const highlightService = {
  getAll: () => api.get<any[]>("/landing/admin/highlights"),
  getById: (id: number) => api.get<any>(`/landing/admin/highlights/${id}`),
  create: (data: any) => api.post<any>("/landing/admin/highlights", data),
  update: (id: number, data: any) => api.put<any>(`/landing/admin/highlights/${id}`, data),
  remove: (id: number) => api.delete(`/landing/admin/highlights/${id}`),
};

export const faqService = {
  getAll: () => api.get<any[]>("/landing/admin/faqs"),
  getById: (id: number) => api.get<any>(`/landing/admin/faqs/${id}`),
  create: (data: any) => api.post<any>("/landing/admin/faqs", data),
  update: (id: number, data: any) => api.put<any>(`/landing/admin/faqs/${id}`, data),
  remove: (id: number) => api.delete(`/landing/admin/faqs/${id}`),
};

export const officialSectionService = {
  getAll: () => api.get<any[]>("/landing/admin/official-sections"),
  create: (data: any) => api.post<any>("/landing/admin/official-sections", data),
  update: (id: number, data: any) => api.put<any>(`/landing/admin/official-sections/${id}`, data),
  remove: (id: number) => api.delete(`/landing/admin/official-sections/${id}`),
};

export const officialService = {
  create: async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/landing/admin/officials`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create");
    return data;
  },
  update: async (id: number, formData: FormData) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/landing/admin/officials/${id}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update");
    return data;
  },
  remove: (id: number) => api.delete(`/landing/admin/officials/${id}`),
};

export const courseOfferingService = {
  getAll: () => api.get<any[]>("/landing/admin/course-offerings"),
  getById: (id: number) => api.get<any>(`/landing/admin/course-offerings/${id}`),
  create: (data: any) => api.post<any>("/landing/admin/course-offerings", data),
  update: (id: number, data: any) => api.put<any>(`/landing/admin/course-offerings/${id}`, data),
  remove: (id: number) => api.delete(`/landing/admin/course-offerings/${id}`),
};

export const institutionService = {
  get: () => api.get("/institution"),
  update: (data: { name?: string; acronym?: string; primary_color?: string; secondary_color?: string; vision?: string | null; mission?: string | null }) =>
    api.put("/institution", data),
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/institution/logo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return res.json();
  },
  uploadBanner: async (file: File) => {
    const formData = new FormData();
    formData.append("banner", file);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/institution/banner`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return res.json();
  },
  removeBanner: () => api.delete("/institution/banner"),
};
