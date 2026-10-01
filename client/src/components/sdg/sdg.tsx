import { Link } from "react-router-dom";

// The 17 UN Sustainable Development Goals — fixed numbering, names and colors.
// Mirrors the `sdg_goals` seed so tags can render without an extra fetch.
export const SDG_LIST: { number: number; title: string; color: string }[] = [
  { number: 1, title: "No Poverty", color: "#E5243B" },
  { number: 2, title: "Zero Hunger", color: "#DDA63A" },
  { number: 3, title: "Good Health and Well-being", color: "#4C9F38" },
  { number: 4, title: "Quality Education", color: "#C5192D" },
  { number: 5, title: "Gender Equality", color: "#FF3A21" },
  { number: 6, title: "Clean Water and Sanitation", color: "#26BDE2" },
  { number: 7, title: "Affordable and Clean Energy", color: "#FCC30B" },
  { number: 8, title: "Decent Work and Economic Growth", color: "#A21942" },
  { number: 9, title: "Industry, Innovation and Infrastructure", color: "#FD6925" },
  { number: 10, title: "Reduced Inequalities", color: "#DD1367" },
  { number: 11, title: "Sustainable Cities and Communities", color: "#FD9D24" },
  { number: 12, title: "Responsible Consumption and Production", color: "#BF8B2E" },
  { number: 13, title: "Climate Action", color: "#3F7E44" },
  { number: 14, title: "Life Below Water", color: "#0A97D9" },
  { number: 15, title: "Life on Land", color: "#56C02B" },
  { number: 16, title: "Peace, Justice and Strong Institutions", color: "#00689D" },
  { number: 17, title: "Partnerships for the Goals", color: "#19486A" },
];

export const sdgByNumber = (n: number) => SDG_LIST.find((g) => g.number === n);

/** Small colored "SDG 4" chip; links to the goal page when `link` is set. */
export function SdgBadge({ number, link = false, showTitle = false }: { number: number; link?: boolean; showTitle?: boolean }) {
  const goal = sdgByNumber(number);
  if (!goal) return null;
  const className =
    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm";
  const content = (
    <>
      SDG {goal.number}
      {showTitle && <span className="font-medium normal-case tracking-normal">· {goal.title}</span>}
    </>
  );
  return link ? (
    <Link to={`/sdg/${goal.number}`} title={goal.title} className={`${className} hover:opacity-90 transition`} style={{ backgroundColor: goal.color }}>
      {content}
    </Link>
  ) : (
    <span title={goal.title} className={className} style={{ backgroundColor: goal.color }}>
      {content}
    </span>
  );
}

/** Admin multi-select: 17 toggleable colored tiles. */
export function SdgPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const toggle = (n: number) =>
    onChange(value.includes(n) ? value.filter((v) => v !== n) : [...value, n].sort((a, b) => a - b));
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {SDG_LIST.map((g) => {
        const selected = value.includes(g.number);
        return (
          <button
            key={g.number}
            type="button"
            onClick={() => toggle(g.number)}
            title={g.title}
            aria-pressed={selected}
            className={`flex h-14 flex-col items-start justify-between rounded-md p-1.5 text-left text-white transition ${
              selected ? "ring-2 ring-offset-1 ring-gray-900" : "opacity-35 hover:opacity-70"
            }`}
            style={{ backgroundColor: g.color }}
          >
            <span className="text-sm font-extrabold leading-none">{g.number}</span>
            <span className="line-clamp-2 text-[9px] font-semibold uppercase leading-tight">{g.title}</span>
          </button>
        );
      })}
    </div>
  );
}
