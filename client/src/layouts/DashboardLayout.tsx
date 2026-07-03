import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  HiOutlineBars3,
  HiOutlineBars3BottomLeft,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { Sidebar } from "../components/Sidebar";

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { settings } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const institutionName = settings?.name || "PDM Enrollment";
  const logoPath = settings?.logo_path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="fixed top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: toggle + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <HiOutlineBars3 className="h-5 w-5" />
              ) : (
                <HiOutlineBars3BottomLeft className="h-5 w-5" />
              )}
            </button>
            <div className="flex items-center gap-2.5">
              {logoPath && (
                <img
                  src={logoPath}
                  alt=""
                  className="h-8 w-8 rounded-md object-contain"
                />
              )}
              <span className="text-base font-bold text-primary-700 hidden sm:block">{institutionName}</span>
            </div>
          </div>

          {/* Right: settings + profile */}
          <div className="flex items-center gap-1">
            {/* Settings shortcut */}
            <button
              onClick={() => navigate("/utilities/institution")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
              title="Institution Settings"
            >
              <HiOutlineCog6Tooth className="h-5 w-5" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-gray-100 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">{user?.first_name} {user?.last_name}</p>
                  <p className="text-[11px] text-gray-500 capitalize leading-tight">{user?.role}</p>
                </div>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/utilities/institution"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      <HiOutlineCog6Tooth className="h-4 w-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="flex pt-14">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className={`flex-1 transition-all duration-200 ${sidebarCollapsed ? "ml-[60px]" : "ml-60"}`}>
          <div className="mx-auto max-w-6xl px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
