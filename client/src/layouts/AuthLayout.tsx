import { Outlet } from "react-router-dom";
import {
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineClock,
} from "react-icons/hi2";
import { useTheme } from "../hooks/useTheme";

const TRUST_POINTS = [
  { icon: <HiOutlineAcademicCap className="h-5 w-5" />, title: "Streamlined enrollment", desc: "Register, advise, and assess in one place." },
  { icon: <HiOutlineShieldCheck className="h-5 w-5" />, title: "Secure & reliable", desc: "Your academic records, safely managed." },
  { icon: <HiOutlineClock className="h-5 w-5" />, title: "Always available", desc: "Access your student portal anytime." },
];

export function AuthLayout() {
  const { settings } = useTheme();

  const institutionName = settings?.name || "PDM Enrollment";
  const logoPath = settings?.logo_path;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left branded panel — hidden on small screens */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 -left-16 h-72 w-72 rounded-full bg-white/5 animate-[pulse_6s_ease-in-out_infinite_1s]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        {/* Brand */}
        <div className="relative flex items-center gap-3 text-white">
          {logoPath && (
            <img src={logoPath} alt="" className="h-12 w-12 rounded-xl bg-white/10 p-1.5 object-contain ring-1 ring-white/20 backdrop-blur-sm" />
          )}
          <span className="text-xl font-bold font-display">{institutionName}</span>
        </div>

        {/* Headline + trust points */}
        <div className="relative max-w-md text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
            <HiOutlineSparkles className="h-4 w-4" />
            Student Enrollment System
          </div>
          <h2 className="text-3xl font-bold leading-tight font-display xl:text-4xl">
            Your academic journey, all in one portal.
          </h2>
          <div className="mt-10 space-y-5">
            {TRUST_POINTS.map((p) => (
              <div key={p.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
                  {p.icon}
                </div>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-white/70">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/50">
          &copy; {new Date().getFullYear()} {institutionName}. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-up">
          {/* Compact brand — only shows when the left panel is hidden */}
          <div className="mb-8 text-center lg:hidden">
            {logoPath && (
              <img src={logoPath} alt="" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain" />
            )}
            <h1 className="text-2xl font-bold text-primary-800 font-display">{institutionName}</h1>
            <p className="mt-1 text-sm text-gray-600">Student Enrollment System</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
