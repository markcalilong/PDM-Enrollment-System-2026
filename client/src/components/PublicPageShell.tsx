import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2";
import type { InstitutionSettings } from "@shared/types";
import { applyThemeToDOM } from "../hooks/useTheme";
import { API_BASE as BASE_URL } from "../services/apiBase";

export const PUBLIC_NAV = [
  { to: "/school-officials", label: "School Officials" },
  { to: "/extension", label: "Extension" },
  { to: "/sdg", label: "SDG" },
];

/** Fetches institution settings and applies the dynamic theme (shared by public subpages). */
export function useInstitution() {
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null);
  useEffect(() => {
    fetch(`${BASE_URL}/landing/institution`)
      .then((r) => r.json())
      .then((res) => {
        const inst = res.data || null;
        setInstitution(inst);
        if (inst?.primary_color && inst?.secondary_color) {
          applyThemeToDOM(inst.primary_color, inst.secondary_color);
        }
      })
      .catch(() => {});
  }, []);
  return institution;
}

interface PublicPageShellProps {
  institution: InstitutionSettings | null;
  loading?: boolean;
  backTo?: { to: string; label: string };
  badge: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  heroStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/** Header + hero band + footer used by the public Extension and SDG pages. */
export function PublicPageShell({ institution, loading, backTo = { to: "/", label: "Back to Home" }, badge, title, subtitle, heroStyle, children }: PublicPageShellProps) {
  const institutionName = institution?.name || "PDM Enrollment System";
  const logoPath = institution?.logo_path;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            {logoPath && <img src={logoPath} alt="" className="h-10 w-10 rounded-lg object-contain" />}
            <span className="truncate text-lg font-bold text-primary-800">{institutionName}</span>
          </Link>
          <div className="flex items-center gap-5">
            {PUBLIC_NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `hidden md:inline-flex text-sm font-medium transition ${isActive ? "text-primary-700" : "text-gray-600 hover:text-primary-600"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition"
            >
              Sign In
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white"
        style={heroStyle}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Link to={backTo.to} className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition">
            <HiOutlineArrowLeft className="h-4 w-4" />
            {backTo.label}
          </Link>
          <div className="mt-6 flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
              {badge}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
            {subtitle && <p className="mt-4 max-w-3xl text-lg text-white/85">{subtitle}</p>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
          </div>
        ) : (
          children
        )}
      </div>

      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
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

export function formatDate(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

export function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
      <div className="mx-auto flex justify-center text-gray-300">{icon}</div>
      <p className="mt-4 text-gray-500">{text}</p>
    </div>
  );
}
