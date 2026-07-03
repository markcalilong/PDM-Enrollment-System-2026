import { Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { AnnouncementDetailPage } from "./pages/AnnouncementDetailPage";
import { SchoolOfficialsPage } from "./pages/SchoolOfficialsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";

// Transaction pages
import { AdmissionPage } from "./pages/transactions/AdmissionPage";
import { AdvisingPage } from "./pages/transactions/AdvisingPage";
import { AssessmentPage } from "./pages/transactions/AssessmentPage";
import { PaymentPage } from "./pages/transactions/PaymentPage";
import { SectioningPage } from "./pages/transactions/SectioningPage";

// Maintenance pages
import { InstitutionSettingsPage } from "./pages/maintenance/InstitutionSettingsPage";
import { SchoolYearPage } from "./pages/maintenance/SchoolYearPage";
import { SemesterPage } from "./pages/maintenance/SemesterPage";
import { CoursePage } from "./pages/maintenance/CoursePage";
import { SubjectPage } from "./pages/maintenance/SubjectPage";
import { AdmissionRequirementPage } from "./pages/maintenance/AdmissionRequirementPage";
import { MiscellaneousFeePage } from "./pages/maintenance/MiscellaneousFeePage";
import { RatingTransmutationPage } from "./pages/maintenance/RatingTransmutationPage";
import { RoomPage } from "./pages/maintenance/RoomPage";
import { CurriculumPage } from "./pages/maintenance/CurriculumPage";
import { SectionPage } from "./pages/maintenance/SectionPage";
import { TuitionRatePage } from "./pages/maintenance/TuitionRatePage";
import { ClassSchedulePage } from "./pages/maintenance/ClassSchedulePage";
import { AnnouncementPage } from "./pages/maintenance/AnnouncementPage";
import { HighlightPage } from "./pages/maintenance/HighlightPage";
import { FaqPage } from "./pages/maintenance/FaqPage";
import { CourseOfferingPage } from "./pages/maintenance/CourseOfferingPage";
import { HeroSlidePage } from "./pages/maintenance/HeroSlidePage";
import { SchoolOfficialPage } from "./pages/maintenance/SchoolOfficialPage";

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/programs/:id" element={<CourseDetailPage />} />
      <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
      <Route path="/school-officials" element={<SchoolOfficialsPage />} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Maintenance */}
        <Route path="/maintenance/school-years" element={<SchoolYearPage />} />
        <Route path="/maintenance/semesters" element={<SemesterPage />} />
        <Route path="/maintenance/courses" element={<CoursePage />} />
        <Route path="/maintenance/subjects" element={<SubjectPage />} />
        <Route path="/maintenance/admission-requirements" element={<AdmissionRequirementPage />} />
        <Route path="/maintenance/miscellaneous-fees" element={<MiscellaneousFeePage />} />
        <Route path="/maintenance/rating-transmutations" element={<RatingTransmutationPage />} />
        <Route path="/maintenance/rooms" element={<RoomPage />} />
        <Route path="/maintenance/curricula" element={<CurriculumPage />} />
        <Route path="/maintenance/sections" element={<SectionPage />} />
        <Route path="/maintenance/tuition-rates" element={<TuitionRatePage />} />
        <Route path="/maintenance/class-schedules" element={<ClassSchedulePage />} />

        {/* Transactions */}
        <Route path="/transactions/admission" element={<AdmissionPage />} />
        <Route path="/transactions/advising" element={<AdvisingPage />} />
        <Route path="/transactions/assessment" element={<AssessmentPage />} />
        <Route path="/transactions/payment" element={<PaymentPage />} />
        <Route path="/transactions/sectioning" element={<SectioningPage />} />
        <Route path="/transactions/grade-posting" element={<ComingSoonPage title="Grade Posting" subtitle="Post and manage student grades" />} />
        <Route path="/transactions/subject-crediting" element={<ComingSoonPage title="Subject Crediting" subtitle="Credit previously taken subjects" />} />
        <Route path="/transactions/enrollment-withdrawal" element={<ComingSoonPage title="Enrollment Withdrawal" subtitle="Process enrollment withdrawals" />} />

        {/* Inquiry */}
        <Route path="/inquiry/students" element={<ComingSoonPage title="Students" subtitle="Search and view student records" />} />

        {/* Reports */}
        <Route path="/reports/certificate-of-registration" element={<ComingSoonPage title="Certificate of Registration" subtitle="Generate COR for enrolled students" />} />
        <Route path="/reports/transcript-of-records" element={<ComingSoonPage title="Transcript of Records" subtitle="Generate official transcript" />} />
        <Route path="/reports/grade-reports" element={<ComingSoonPage title="Grade Reports" subtitle="View and print grade reports" />} />
        <Route path="/reports/scholastic-record" element={<ComingSoonPage title="Scholastic Record" subtitle="Complete academic history per student" />} />
        <Route path="/reports/enrolled-students" element={<ComingSoonPage title="List of Enrolled Students" subtitle="View enrolled students per term" />} />
        <Route path="/reports/curriculum" element={<ComingSoonPage title="Curriculum" subtitle="Full curriculum view per course" />} />

        {/* Utilities */}
        <Route path="/utilities/users" element={<ComingSoonPage title="User Maintenance" subtitle="Manage system users and access" />} />
        <Route path="/utilities/audit-trail" element={<ComingSoonPage title="Audit Trail" subtitle="View system activity logs" />} />
        <Route path="/utilities/backup-restore" element={<ComingSoonPage title="Backup & Restore" subtitle="Database backup and restore" />} />
        <Route path="/utilities/hero-slides" element={<HeroSlidePage />} />
        <Route path="/utilities/announcements" element={<AnnouncementPage />} />
        <Route path="/utilities/highlights" element={<HighlightPage />} />
        <Route path="/utilities/faqs" element={<FaqPage />} />
        <Route path="/utilities/school-officials" element={<SchoolOfficialPage />} />
        <Route path="/utilities/course-offerings" element={<CourseOfferingPage />} />
        <Route path="/utilities/institution" element={<InstitutionSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
