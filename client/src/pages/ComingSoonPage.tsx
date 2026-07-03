import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";
import { PageHeader } from "../components/ui/PageHeader";

interface ComingSoonPageProps {
  title: string;
  subtitle?: string;
}

export function ComingSoonPage({ title, subtitle }: ComingSoonPageProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
        <HiOutlineWrenchScrewdriver className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-3 text-sm font-medium text-gray-500">This module is under development</p>
      </div>
    </div>
  );
}
