// frontend/app/components/departments/DepartmentCard.tsx
import { Department } from "@/app/lib/types";
import { Building2, Link2, Hash, Edit, Trash2 } from "lucide-react"; // Import new icons
import Link from "next/link";

interface DepartmentCardProps {
  department: Department;
  onEdit: (department: Department) => void; // Add handler prop
  onDelete: (department: Department) => void; // Add handler prop
}

export default function DepartmentCard({
  department,
  onEdit,
  onDelete,
}: DepartmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{department.name}</h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              department.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {department.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
              {department.code}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span>{department.chainLength || 0} Blocks</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t space-y-2">
        {/* Main Actions */}
        <div className="flex space-x-2">
          <Link
            href={`/classes?departmentId=${department.id}`}
            className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Classes
          </Link>
          <Link
            href={`/explorer/department/${department.id}`}
            className="flex-1 text-center bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            View Chain
          </Link>
        </div>

        {/* Edit/Delete Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(department)}
            className="flex-1 flex items-center justify-center bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-600 transition-colors"
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(department)}
            className="flex-1 flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
