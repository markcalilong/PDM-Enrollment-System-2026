import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HiOutlineGlobeAlt,
  HiOutlineLightBulb,
  HiOutlineHeart,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import type { SdgGoalDetail } from "@shared/types";
import { API_BASE as BASE_URL } from "../services/apiBase";
import { PublicPageShell, useInstitution, EmptyState } from "../components/PublicPageShell";
import { SdgBadge, sdgByNumber } from "../components/sdg/sdg";

export function SdgGoalPage() {
  const { number } = useParams();
  const n = Number(number);
  const institution = useInstitution();
  const [goal, setGoal] = useState<SdgGoalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/landing/sdg-goals/${n}`)
      .then((r) => r.json())
      .then((res) => setGoal(res.success ? res.data : null))
      .finally(() => setLoading(false));
  }, [n]);

  const color = goal?.color || sdgByNumber(n)?.color;
  const prev = sdgByNumber(n - 1);
  const next = sdgByNumber(n + 1);
  const institutionName = institution?.name || "our institution";
  const empty = goal && goal.initiatives.length === 0 && goal.programs.length === 0;

  return (
    <PublicPageShell
      institution={institution}
      loading={loading}
      backTo={{ to: "/sdg", label: "All 17 Goals" }}
      badge={<><HiOutlineGlobeAlt className="h-4 w-4" /> SDG {n}</>}
      title={goal?.title || (loading ? "" : "Goal not found")}
      subtitle={goal?.tagline}
      heroStyle={color ? { background: color } : undefined}
    >
      {!goal ? (
        <EmptyState icon={<HiOutlineGlobeAlt className="h-12 w-12" />} text="This goal could not be found." />
      ) : (
        <div className="space-y-16">
          {goal.description && (
            <div className="rounded-2xl border-l-4 bg-gray-50 p-6 sm:p-8" style={{ borderColor: goal.color }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Our commitment</h2>
              <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-gray-700">{goal.description}</p>
            </div>
          )}

          {empty && (
            <EmptyState
              icon={<HiOutlineLightBulb className="h-12 w-12" />}
              text={`Initiatives of ${institutionName} supporting this goal will be posted here.`}
            />
          )}

          {goal.initiatives.length > 0 && (
            <section>
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
                <HiOutlineLightBulb className="h-6 w-6" style={{ color: goal.color }} /> Initiatives
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {goal.initiatives.map((i) => (
                  <article key={i.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    {i.image_path && <img src={i.image_path} alt="" className="aspect-[16/9] w-full object-cover" />}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {i.sdgs.map((s) => <SdgBadge key={s} number={s} link={s !== n} />)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{i.title}</h3>
                      {i.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{i.description}</p>}
                      {i.link && (
                        <a
                          href={i.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          Learn more <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {goal.programs.length > 0 && (
            <section>
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
                <HiOutlineHeart className="h-6 w-6" style={{ color: goal.color }} /> Extension Programs
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {goal.programs.map((p) => (
                  <Link
                    key={p.id}
                    to={`/extension/${p.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md"
                  >
                    {p.image_path ? (
                      <img src={p.image_path} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-300">
                        <HiOutlineHeart className="h-8 w-8" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition">{p.title}</h3>
                      {p.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{p.description}</p>}
                    </div>
                    <HiOutlineArrowRight className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-primary-600 transition" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <nav className="flex items-center justify-between gap-4 border-t border-gray-100 pt-8 text-sm font-medium">
            {prev ? (
              <Link to={`/sdg/${prev.number}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <HiOutlineArrowLeft className="h-4 w-4" /> SDG {prev.number}: {prev.title}
              </Link>
            ) : <span />}
            {next && (
              <Link to={`/sdg/${next.number}`} className="inline-flex items-center gap-2 text-right text-gray-600 hover:text-gray-900">
                SDG {next.number}: {next.title} <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            )}
          </nav>
        </div>
      )}
    </PublicPageShell>
  );
}
