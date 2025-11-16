// frontend/app/students/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { studentAPI, classAPI, departmentAPI } from "@/app/lib/api";
import { Student, Class, Department } from "@/app/lib/types";
import { GraduationCap, Plus } from "lucide-react";
import StudentCard from "../components/students/StudentCard";
import CreateStudentModal from "../components/students/CreateStudentModal";

// Helper to create maps for quick name lookups
const createNameMap = (items: Array<{ id: string; name: string }>) => {
  return items.reduce((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {} as { [key: string]: string });
};

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const classIdFilter = searchParams.get("classId");
  const departmentIdFilter = searchParams.get("departmentId");

  // All fetched data
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);

  // Derived name maps
  const [classNameMap, setClassNameMap] = useState<{ [key: string]: string }>(
    {}
  );
  const [deptNameMap, setDeptNameMap] = useState<{ [key: string]: string }>({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [studentRes, classRes, deptRes] = await Promise.all([
        studentAPI.getAll(),
        classAPI.getAll(),
        departmentAPI.getAll(),
      ]);

      const students = studentRes.data || [];
      const classes = classRes.data || [];
      const departments = deptRes.data || [];

      // Set all data
      setAllStudents(students);
      setAllClasses(classes);
      setAllDepartments(departments);

      // Create name maps
      setClassNameMap(createNameMap(classes));
      setDeptNameMap(createNameMap(departments));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSuccess = () => {
    fetchData(); // Refetch all data on success
  };

  // Filter the students based on URL params
  const filteredStudents = useMemo(() => {
    let students = allStudents;
    if (classIdFilter) {
      students = students.filter((s) => s.classId === classIdFilter);
    } else if (departmentIdFilter) {
      students = students.filter((s) => s.departmentId === departmentIdFilter);
    }
    return students;
  }, [allStudents, classIdFilter, departmentIdFilter]);

  // Get name for page title
  const pageTitle = useMemo(() => {
    if (classIdFilter)
      return `${classNameMap[classIdFilter] || "Class"} - Students`;
    if (departmentIdFilter)
      return `${deptNameMap[departmentIdFilter] || "Department"} - Students`;
    return "All Students";
  }, [classIdFilter, departmentIdFilter, classNameMap, deptNameMap]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-gray-500 py-10">
          Loading students...
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-500 py-10">{error}</div>;
    }

    if (filteredStudents.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No Students Found</h3>
          <p className="text-sm mb-4">
            Get started by creating your first student.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Student
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            className={classNameMap[student.classId]}
            departmentName={deptNameMap[student.departmentId]}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">
            Manage all students in the system.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New
        </button>
      </div>

      {renderContent()}

      <CreateStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        departments={allDepartments}
        classes={allClasses}
      />
    </div>
  );
}
