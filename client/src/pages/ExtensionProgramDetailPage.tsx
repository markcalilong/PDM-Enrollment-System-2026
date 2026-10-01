import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { HiOutlineHeart, HiOutlineCalendarDays, HiOutlineMapPin, HiOutlineUsers } from "react-icons/hi2";
import type { ExtensionProgram } from "@shared/types";
import { API_BASE as BASE_URL } from "../services/apiBase";
import { PublicPageShell, useInstitution, EmptyState, formatDate } from "../components/PublicPageShell";
import { SdgBadge } from "../components/sdg/sdg";

export function ExtensionProgramDetailPage() {
  const { id } = useParams();
  const institution = useInstitution();
  const [program, setProgram] = useState<ExtensionProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/landing/extension-programs/${id}`)
      .then((r) => r.json())
      .then((res) => setProgram(res.success ? res.data : null))
      .finally(() => setLoading(false));
  }, [id]);

  const activities = program?.activities || [];

  return (
    <PublicPageShell
      institution={institution}
      loading={loading}
      backTo={{ to: "/extension", label: "All Extension Programs" }}
      badge={<><HiOutlineHeart className="h-4 w-4" /> Extension Program</>}
      title={program?.title || (loading ? "" : "Program not found")}
    >
      {!program ? (
        <EmptyState icon={<HiOutlineHeart className="h-12 w-12" />} text="This extension program is unavailable." />
      ) : (
        <div className="space-y-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
            <div className={program.image_path ? "lg:col-span-3" : "lg:col-span-5"}>
              <span className="eyebrow mb-4">About the Program</span>
              {program.description ? (
                <p className="whitespace-pre-line text-lg leading-relaxed text-gray-700">{program.description}</p>
              ) : (
                <p className="text-gray-500">No description provided.</p>
              )}
              {program.sdgs.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Sustainable Development Goals addressed</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {program.sdgs.map((n) => <SdgBadge key={n} number={n} link showTitle />)}
                  </div>
                </div>
              )}
            </div>
            {program.image_path && (
              <div className="lg:col-span-2">
                <img src={program.image_path} alt="" className="w-full rounded-2xl object-cover shadow-md" />
              </div>
            )}
          </div>

          <section>
            <div className="mb-8 flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Activities</h2>
              <span className="mt-5 h-1 w-16 rounded-full bg-primary-600" />
            </div>
            {activities.length === 0 ? (
              <EmptyState icon={<HiOutlineCalendarDays className="h-12 w-12" />} text="Activities under this program will be posted here." />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {activities.map((a) => (
                  <article key={a.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:flex-row">
                    {a.image_path && (
                      <img src={a.image_path} alt="" className="h-48 w-full object-cover sm:h-auto sm:w-44 sm:shrink-0" />
                    )}
                    <div className="flex-1 p-6">
                      {a.activity_date && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">{formatDate(a.activity_date)}</p>
                      )}
                      <h3 className="mt-1 text-lg font-semibold text-gray-900">{a.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        {a.location && (
                          <span className="inline-flex items-center gap-1"><HiOutlineMapPin className="h-4 w-4" />{a.location}</span>
                        )}
                        {a.beneficiaries && (
                          <span className="inline-flex items-center gap-1"><HiOutlineUsers className="h-4 w-4" />{a.beneficiaries}</span>
                        )}
                      </div>
                      {a.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{a.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PublicPageShell>
  );
}
