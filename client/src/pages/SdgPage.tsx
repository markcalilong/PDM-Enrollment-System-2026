import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import type { SdgGoal } from "@shared/types";
import { API_BASE as BASE_URL } from "../services/apiBase";
import { PublicPageShell, useInstitution } from "../components/PublicPageShell";

export function SdgPage() {
  const institution = useInstitution();
  const [goals, setGoals] = useState<SdgGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/landing/sdg-goals`)
      .then((r) => r.json())
      .then((res) => setGoals(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const institutionName = institution?.name || "our institution";

  return (
    <PublicPageShell
      institution={institution}
      loading={loading}
      badge={<><HiOutlineGlobeAlt className="h-4 w-4" /> Real-World Impact</>}
      title="Sustainable Development Goals"
      subtitle={`The 17 UN Sustainable Development Goals are a shared blueprint for peace and prosperity for people and the planet. See how ${institutionName} contributes to each goal.`}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {goals.map((g) => {
          const total = (g.initiative_count || 0) + (g.program_count || 0);
          return (
            <Link
              key={g.number}
              to={`/sdg/${g.number}`}
              className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl p-4 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ backgroundColor: g.color }}
            >
              <div className="flex items-start gap-2">
                <span className="text-4xl font-extrabold leading-none">{g.number}</span>
                <span className="mt-0.5 text-[11px] font-bold uppercase leading-tight tracking-wide">{g.title}</span>
              </div>
              <span className="self-start rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                {total > 0 ? `${total} ${total === 1 ? "initiative" : "initiatives"}` : "View goal"}
              </span>
            </Link>
          );
        })}
      </div>
    </PublicPageShell>
  );
}
