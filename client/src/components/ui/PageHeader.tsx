import { HiOutlinePlus } from "react-icons/hi2";
import { Button } from "./Button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
}

export function PageHeader({ title, subtitle, onAdd, addLabel = "Add New" }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="hidden h-9 w-1.5 rounded-full bg-primary-600 sm:block" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {onAdd && (
        <Button onClick={onAdd} className="gap-1.5">
          <HiOutlinePlus className="h-4 w-4" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
