// ─── Auth & Users ────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "registrar" | "student" | "staff";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, "created_at" | "updated_at">;
}

// ─── Institution ─────────────────────────────────────────
export interface InstitutionSettings {
  id: number;
  name: string;
  logo_path: string | null;
  primary_color: string;
  secondary_color: string;
  vision: string | null;
  mission: string | null;
  banner_path: string | null;
}

// ─── School Year ─────────────────────────────────────────
export interface SchoolYear {
  id: number;
  year_start: number;
  year_end: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Semester ────────────────────────────────────────────
export interface Semester {
  id: number;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Course ──────────────────────────────────────────────
export interface Course {
  id: number;
  code: string;
  description: string;
  duration_years: number;
  vision: string | null;
  mission: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Subject ─────────────────────────────────────────────
export type LabType = "computer" | "physics" | "chemistry" | "biology" | "digital" | "electronics" | "engineering" | "other";

export interface Subject {
  id: number;
  code: string;
  description: string;
  units_lec: number;
  units_lab: number;
  lab_type: LabType | null;
  is_active: boolean;
  prerequisites?: Subject[];
  created_at: string;
  updated_at: string;
}

export interface SubjectPrerequisite {
  id: number;
  subject_id: number;
  prerequisite_id: number;
}

// ─── Lab Type ────────────────────────────────────────────
export interface LabTypeRecord {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Admission Requirement ───────────────────────────────
export interface AdmissionRequirement {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Miscellaneous Fee ───────────────────────────────────
export type FeeApplicability = "all" | "new_students" | "course_specific" | "lab_specific" | "year_level";
export type FeeFrequency = "per_semester" | "one_time" | "per_subject";

export interface MiscellaneousFee {
  id: number;
  name: string;
  amount: number;
  description: string | null;
  applicability: FeeApplicability;
  frequency: FeeFrequency;
  course_id: number | null;
  lab_type: string | null;
  year_level: number | null;
  is_active: boolean;
  course?: Course;
  created_at: string;
  updated_at: string;
}

// ─── Rating Transmutation ────────────────────────────────
export interface RatingTransmutation {
  id: number;
  min_score: number;
  max_score: number;
  transmuted_grade: number;
  created_at: string;
  updated_at: string;
}

// ─── Room ────────────────────────────────────────────────
export interface Room {
  id: number;
  code: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Curriculum ──────────────────────────────────────────
export interface Curriculum {
  id: number;
  code: string;
  course_id: number;
  year_effective: number;
  description: string | null;
  is_active: boolean;
  course?: Course;
  subjects?: CurriculumSubject[];
  created_at: string;
  updated_at: string;
}

export interface CurriculumSubject {
  id: number;
  curriculum_id: number;
  subject_id: number;
  semester_id: number;
  year_level: number;
  is_elective: boolean;
  subject?: Subject;
  semester?: Semester;
}

// ─── Section ─────────────────────────────────────────────
export interface Section {
  id: number;
  code: string;
  course_id: number;
  year_level: number;
  semester_id: number;
  school_year_id: number;
  section_letter: string;
  max_students: number;
  is_active: boolean;
  course?: Course;
  semester?: Semester;
  school_year?: SchoolYear;
  created_at: string;
  updated_at: string;
}

// ─── Landing Page ───────────────────────────────────────
export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string | null;
  image_path: string;
  button_text: string | null;
  button_link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: "general" | "enrollment" | "academic" | "event";
  is_pinned: boolean;
  is_active: boolean;
  image_path: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Highlight {
  id: number;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Official {
  id: number;
  section_id: number;
  name: string;
  position: string | null;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficialSection {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  officials?: Official[];
  created_at: string;
  updated_at: string;
}

export interface CourseOffering {
  id: number;
  course_id: number;
  description_long: string | null;
  duration: string | null;
  degree_type: string | null;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  course_code?: string;
  course_name?: string;
  duration_years?: number;
  created_at: string;
  updated_at: string;
}

// ─── API ─────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}
