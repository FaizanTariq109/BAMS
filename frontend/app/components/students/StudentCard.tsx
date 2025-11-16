// frontend/app/components/students/StudentCard.tsx
import { Student } from "@/app/lib/types";
import { GraduationCap, Hash, Mail, Link2, Users } from "lucide-react";
import Link from "next/link";

interface StudentCardProps {
  student: Student;
  className?: string; // To show the class name
  departmentName?: string; // To show the department name
}

export default function StudentCard({
  student,
  className,
  departmentName,
}: StudentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            student.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {student.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-gray-400" />
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
            {student.rollNumber}
          </span>
        </div>
        {className && (
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{className}</span>
          </div>
        )}
        {departmentName && (
          <div className="flex items-center space-x-2">
            <Link2 className="w-4 h-4 text-gray-400" />
            <span>{departmentName}</span>
          </div>
        )}
        {student.email && (
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{student.email}</span>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t flex space-x-2">
        <Link
          href={`/students/${student.id}/ledger`}
          className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          View Ledger
        </Link>
        <Link
          href={`/explorer/student/${student.id}`}
          className="flex-1 text-center bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          View Chain
        </Link>
      </div>
    </div>
  );
}
