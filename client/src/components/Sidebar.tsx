import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineCog6Tooth,
  HiOutlineCalendarDays,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentList,
  HiOutlineTableCells,
  HiOutlineBuildingOffice2,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineWrenchScrewdriver,
  HiOutlineArrowsRightLeft,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentChartBar,
  HiOutlineSquares2X2,
  HiOutlineChevronDown,
  HiOutlineRectangleGroup,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCalculator,
  HiOutlineUserPlus,
  HiOutlineClipboardDocumentList as HiOutlineAdvising,
  HiOutlineBanknotes,
  HiOutlineCreditCard,
  HiOutlineUserGroup,
  HiOutlinePencilSquare,
  HiOutlineArrowUturnLeft,
  HiOutlineDocumentDuplicate,
  HiOutlineIdentification,
  HiOutlineNewspaper,
  HiOutlineListBullet,
  HiOutlineShieldCheck,
  HiOutlineCircleStack,
  HiOutlineArrowPath,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlinePhoto,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <HiOutlineHome className="h-5 w-5" /> },
];

const navGroups: NavGroup[] = [
  {
    label: "Maintenance",
    icon: <HiOutlineWrenchScrewdriver className="h-5 w-5" />,
    items: [
      { to: "/maintenance/school-years", label: "School Years", icon: <HiOutlineCalendarDays className="h-4.5 w-4.5" /> },
      { to: "/maintenance/semesters", label: "Semesters", icon: <HiOutlineTableCells className="h-4.5 w-4.5" /> },
      { to: "/maintenance/courses", label: "Courses", icon: <HiOutlineAcademicCap className="h-4.5 w-4.5" /> },
      { to: "/maintenance/subjects", label: "Subjects", icon: <HiOutlineBookOpen className="h-4.5 w-4.5" /> },
      { to: "/maintenance/curricula", label: "Curricula", icon: <HiOutlineClipboardDocumentList className="h-4.5 w-4.5" /> },
      { to: "/maintenance/sections", label: "Sections", icon: <HiOutlineRectangleGroup className="h-4.5 w-4.5" /> },
      { to: "/maintenance/rooms", label: "Rooms", icon: <HiOutlineSquares2X2 className="h-4.5 w-4.5" /> },
      { to: "/maintenance/admission-requirements", label: "Admission Req.", icon: <HiOutlineClipboardDocumentCheck className="h-4.5 w-4.5" /> },
      { to: "/maintenance/miscellaneous-fees", label: "Misc. Fees", icon: <HiOutlineCurrencyDollar className="h-4.5 w-4.5" /> },
      { to: "/maintenance/tuition-rates", label: "Tuition Rates", icon: <HiOutlineBanknotes className="h-4.5 w-4.5" /> },
      { to: "/maintenance/class-schedules", label: "Class Schedules", icon: <HiOutlineCalendarDays className="h-4.5 w-4.5" /> },
      { to: "/maintenance/rating-transmutations", label: "Transmutations", icon: <HiOutlineCalculator className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: "Transactions",
    icon: <HiOutlineArrowsRightLeft className="h-5 w-5" />,
    items: [
      { to: "/transactions/admission", label: "Admission", icon: <HiOutlineUserPlus className="h-4.5 w-4.5" /> },
      { to: "/transactions/advising", label: "Advising", icon: <HiOutlineAdvising className="h-4.5 w-4.5" /> },
      { to: "/transactions/assessment", label: "Assessment", icon: <HiOutlineBanknotes className="h-4.5 w-4.5" /> },
      { to: "/transactions/payment", label: "Payment", icon: <HiOutlineCreditCard className="h-4.5 w-4.5" /> },
      { to: "/transactions/sectioning", label: "Sectioning", icon: <HiOutlineUserGroup className="h-4.5 w-4.5" /> },
      { to: "/transactions/grade-posting", label: "Grade Posting", icon: <HiOutlinePencilSquare className="h-4.5 w-4.5" /> },
      { to: "/transactions/subject-crediting", label: "Subject Crediting", icon: <HiOutlineCheckBadge className="h-4.5 w-4.5" /> },
      { to: "/transactions/enrollment-withdrawal", label: "Enrollment Withdrawal", icon: <HiOutlineArrowUturnLeft className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: "Inquiry",
    icon: <HiOutlineMagnifyingGlass className="h-5 w-5" />,
    items: [
      { to: "/inquiry/students", label: "Students", icon: <HiOutlineAcademicCap className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: "Reports",
    icon: <HiOutlineDocumentChartBar className="h-5 w-5" />,
    items: [
      { to: "/reports/certificate-of-registration", label: "Certificate of Registration", icon: <HiOutlineIdentification className="h-4.5 w-4.5" /> },
      { to: "/reports/transcript-of-records", label: "Transcript of Records", icon: <HiOutlineDocumentDuplicate className="h-4.5 w-4.5" /> },
      { to: "/reports/grade-reports", label: "Grade Reports", icon: <HiOutlineChartBar className="h-4.5 w-4.5" /> },
      { to: "/reports/scholastic-record", label: "Scholastic Record", icon: <HiOutlineNewspaper className="h-4.5 w-4.5" /> },
      { to: "/reports/enrolled-students", label: "Enrolled Students", icon: <HiOutlineListBullet className="h-4.5 w-4.5" /> },
      { to: "/reports/curriculum", label: "Curriculum", icon: <HiOutlineDocumentText className="h-4.5 w-4.5" /> },
    ],
  },
  {
    label: "Utilities",
    icon: <HiOutlineCog6Tooth className="h-5 w-5" />,
    items: [
      { to: "/utilities/users", label: "User Maintenance", icon: <HiOutlineShieldCheck className="h-4.5 w-4.5" /> },
      { to: "/utilities/audit-trail", label: "Audit Trail", icon: <HiOutlineCircleStack className="h-4.5 w-4.5" /> },
      { to: "/utilities/backup-restore", label: "Backup & Restore", icon: <HiOutlineArrowPath className="h-4.5 w-4.5" /> },
      { to: "/utilities/institution", label: "Institution", icon: <HiOutlineBuildingOffice2 className="h-4.5 w-4.5" /> },
      { to: "/utilities/hero-slides", label: "Hero Slides", icon: <HiOutlinePhoto className="h-4.5 w-4.5" /> },
      { to: "/utilities/announcements", label: "Announcements", icon: <HiOutlineNewspaper className="h-4.5 w-4.5" /> },
      { to: "/utilities/highlights", label: "Highlights", icon: <HiOutlineSparkles className="h-4.5 w-4.5" /> },
      { to: "/utilities/faqs", label: "FAQs", icon: <HiOutlineQuestionMarkCircle className="h-4.5 w-4.5" /> },
      { to: "/utilities/school-officials", label: "School Officials", icon: <HiOutlineUserGroup className="h-4.5 w-4.5" /> },
      { to: "/utilities/course-offerings", label: "Course Offerings", icon: <HiOutlineStar className="h-4.5 w-4.5" /> },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

function CollapsibleGroup({ group, collapsed }: { group: NavGroup; collapsed: boolean }) {
  const location = useLocation();
  const isAnyActive = group.items.some((item) => location.pathname.startsWith(item.to));
  const [open, setOpen] = useState(isAnyActive);

  // When sidebar is collapsed, show icon-only with tooltip on group header
  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {/* Show just the first-level icon as a section indicator */}
        <div className="group relative flex h-9 w-9 mx-auto items-center justify-center rounded-lg text-gray-500">
          {group.icon}
          <span className="absolute left-full ml-3 z-50 hidden group-hover:flex items-center whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
            {group.label}
          </span>
        </div>
        {/* Show child icons */}
        {group.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group relative flex h-9 w-9 mx-auto items-center justify-center rounded-lg transition ${
                isActive
                  ? "bg-primary-50 text-primary-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`
            }
          >
            {item.icon}
            <span className="absolute left-full ml-3 z-50 hidden group-hover:flex items-center whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
          isAnyActive ? "text-primary-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
        }`}
      >
        <span className={isAnyActive ? "text-primary-600" : "text-gray-500"}>{group.icon}</span>
        <span className="flex-1 text-left">{group.label}</span>
        <HiOutlineChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="ml-2 space-y-0.5 border-l border-gray-200 pl-2 pt-1 pb-2">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-14 z-20 h-[calc(100vh-3.5rem)] border-r border-gray-200 bg-white transition-all duration-200 ${
        collapsed ? "w-[60px]" : "w-60"
      }`}
    >
      <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden p-2 h-full scrollbar-thin">
        {/* Main nav */}
        {mainNav.map((item) =>
          collapsed ? (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `group relative flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition ${
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`
              }
            >
              {item.icon}
              <span className="absolute left-full ml-3 z-50 hidden group-hover:flex items-center whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
                {item.label}
              </span>
            </NavLink>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <span className="text-gray-500">{item.icon}</span>
              {item.label}
            </NavLink>
          )
        )}

        {/* Divider */}
        <div className={`my-2 border-t border-gray-200 ${collapsed ? "mx-2" : "mx-3"}`} />

        {/* Menu groups */}
        {navGroups.map((group) => (
          <CollapsibleGroup key={group.label} group={group} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}
