import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineNewspaper,
} from "react-icons/hi2";
import type { Announcement, InstitutionSettings } from "@shared/types";
import { applyThemeToDOM } from "../hooks/useTheme";
import { API_BASE as BASE_URL } from "../services/apiBase";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  enrollment: "Enrollment",
  academic: "Academic",
  event: "Event",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  enrollment: "bg-green-100 text-green-700",
  academic: "bg-purple-100 text-purple-700",
  event: "bg-orange-100 text-orange-700",
};

export function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/landing/announcements/${id}`).then((r) => r.json()),
      fetch(`${BASE_URL}/landing/institution`).then((r) => r.json()),
    ]).then(([annRes, instRes]) => {
      if (annRes.success) {
        setAnnouncement(annRes.data);
      } else {
        setError(true);
      }
      const inst = instRes.data || null;
      setInstitution(inst);
      if (inst?.primary_color && inst?.secondary_color) {
        applyThemeToDOM(inst.primary_color, inst.secondary_color);
      }
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const institutionName = institution?.name || "PDM Enrollment System";
  const logoPath = institution?.logo_path;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3">
              {logoPath && <img src={logoPath} alt="" className="h-10 w-10 rounded-lg object-contain" />}
              <span className="text-lg font-bold text-primary-800">{institutionName}</span>
            </Link>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <HiOutlineNewspaper className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Announcement not found</h2>
          <p className="mt-2 text-gray-500">This announcement may have been removed or is no longer available.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = new Date(announcement.published_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            {logoPath && <img src={logoPath} alt="" className="h-10 w-10 rounded-lg object-contain" />}
            <span className="text-lg font-bold text-primary-800">{institutionName}</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Hero Image */}
      {announcement.image_path && (
        <div className="relative h-64 sm:h-80 lg:h-96 bg-gray-200">
          <img
            src={announcement.image_path}
            alt={announcement.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
          {/* Category & Date */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[announcement.category] || CATEGORY_COLORS.general}`}>
              {CATEGORY_LABELS[announcement.category] || announcement.category}
            </span>
            {announcement.is_pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Pinned
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
              <HiOutlineClock className="h-4 w-4" />
              {publishedDate}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl leading-tight mb-6">
            {announcement.title}
          </h1>

          {/* Body */}
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
              {announcement.content}
            </p>
          </div>
        </article>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            to="/#announcements"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to all announcements
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-10 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
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
