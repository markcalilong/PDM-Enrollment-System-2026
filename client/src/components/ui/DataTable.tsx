import { HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: number }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: number }>({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  actions,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-500">No records found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50/80">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete || actions) && (
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 w-32">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
              {(onEdit || onDelete || actions) && (
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {actions?.(item)}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-primary-50 hover:text-primary-600 transition"
                        title="Edit"
                      >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
