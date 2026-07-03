import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineUserGroup,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import type { InstitutionSettings, OfficialSection } from "@shared/types";
import { applyThemeToDOM } from "../hooks/useTheme";

const BASE_URL = "/api";

export function SchoolOfficialsPage() {
  const [sections, setSections] = useState<OfficialSection[]>([]);
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/landing/school-officials`).then((r) => r.json()),
      fetch(`${BASE_URL}/landing/institution`).then((r) => r.json()),
    ])
      .then(([offRes, instRes]) => {
        setSections(offRes.data || []);
        const inst = instRes.data || null;
        setInstitution(inst);
        if (inst?.primary_color && inst?.secondary_color) {
          applyThemeToDOM(inst.primary_color, inst.secondary_color);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const institutionName = institution?.name || "PDM Enrollment System";
  const logoPath = institution?.logo_path;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            {logoPath && <img src={logoPath} alt="" className="h-10 w-10 rounded-lg object-contain" />}
            <span className="text-lg font-bold text-primary-800">{institutionName}</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition"
          >
            Sign In
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero band */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="mt-6 flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
              <HiOutlineUserGroup className="h-4 w-4" />
              Leadership & Governance
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">School Officials</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              Meet the dedicated individuals who lead and guide {institutionName}.
            </p>
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
            <HiOutlineUserGroup className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">School officials will be listed here soon.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {sections.map((section) => (
              <section key={section.id}>
                <div className="mb-8 flex flex-col items-center text-center">
                  <span className="eyebrow mb-4">{institutionName}</span>
                  <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{section.name}</h2>
                  {section.description && <p className="mt-3 max-w-2xl text-gray-600">{section.description}</p>}
                  <span className="mt-5 h-1 w-16 rounded-full bg-primary-600" />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {section.officials?.map((o) => (
                    <div
                      key={o.id}
                      className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                    >
                      {o.image_path ? (
                        <img
                          src={o.image_path}
                          alt={o.name}
                          className="h-28 w-28 rounded-full object-cover ring-4 ring-primary-50"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-4 ring-primary-50 group-hover:bg-primary-100 transition">
                          <HiOutlineUserCircle className="h-20 w-20" />
                        </div>
                      )}
                      <h3 className="mt-5 text-lg font-semibold text-gray-900">{o.name}</h3>
                      {o.position && <p className="mt-1 text-sm font-medium text-primary-600">{o.position}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
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
