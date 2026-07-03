import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth";

const stats = [
  { label: "Courses", value: "—", icon: <HiOutlineAcademicCap className="h-6 w-6" />, color: "text-blue-600 bg-blue-50" },
  { label: "Subjects", value: "—", icon: <HiOutlineBookOpen className="h-6 w-6" />, color: "text-emerald-600 bg-emerald-50" },
  { label: "Students", value: "—", icon: <HiOutlineUserGroup className="h-6 w-6" />, color: "text-violet-600 bg-violet-50" },
  { label: "School Year", value: "—", icon: <HiOutlineCalendarDays className="h-6 w-6" />, color: "text-amber-600 bg-amber-50" },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your enrollment system.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <HiOutlineCalendarDays className="h-4 w-4 text-gray-500" />
              Set up your active school year in Maintenance
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <HiOutlineAcademicCap className="h-4 w-4 text-gray-500" />
              Add courses and subjects under Maintenance
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <HiOutlineBookOpen className="h-4 w-4 text-gray-500" />
              Build your curriculum to start enrollment
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">System Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Logged in as</span>
              <span className="font-medium text-gray-700">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="font-medium text-gray-700 capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active School Year</span>
              <span className="font-medium text-gray-500">Not set</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
