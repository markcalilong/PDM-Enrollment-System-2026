import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiOutlineHeart, HiOutlineArrowRight, HiOutlineCalendarDays } from "react-icons/hi2";
import type { ExtensionProgram } from "@shared/types";
import { API_BASE as BASE_URL } from "../services/apiBase";
import { PublicPageShell, useInstitution, EmptyState } from "../components/PublicPageShell";
import { SdgBadge } from "../components/sdg/sdg";

export function ExtensionPage() {
  const institution = useInstitution();
  const [programs, setPrograms] = useState<ExtensionProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/landing/extension-programs`)
      .then((r) => r.json())
      .then((res) => setPrograms(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const institutionName = institution?.name || "our institution";

  return (
    <PublicPageShell
      institution={institution}
      loading={loading}
      badge={<><HiOutlineHeart className="h-4 w-4" /> Community Engagement</>}
      title="Extension Programs"
      subtitle={`How ${institutionName} brings its knowledge and service beyond the campus, through community programs and outreach.`}
    >
      {programs.length === 0 ? (
        <EmptyState icon={<HiOutlineHeart className="h-12 w-12" />} text="Extension programs will be listed here soon." />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => {
            const count = p.activities?.length || 0;
            return (
              <Link
                key={p.id}
                to={`/extension/${p.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
              >
                <div className="aspect-[16/9] overflow-hidden bg-primary-50">
                  {p.image_path ? (
                    <img src={p.image_path} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary-300">
                      <HiOutlineHeart className="h-14 w-14" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  {p.sdgs.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {p.sdgs.map((n) => <SdgBadge key={n} number={n} />)}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition">{p.title}</h3>
                  {p.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{p.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-gray-500">
                      <HiOutlineCalendarDays className="h-4 w-4" />
                      {count} {count === 1 ? "activity" : "activities"}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary-600">
                      View program <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PublicPageShell>
  );
}
