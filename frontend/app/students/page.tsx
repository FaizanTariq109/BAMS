// frontend/app/students/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { studentAPI, classAPI, departmentAPI } from "@/app/lib/api";
import { Student, Class, Department } from "@/app/lib/types";
import { GraduationCap, Plus, Search } from "lucide-react";
import StudentCard from "../components/students/StudentCard";
import CreateStudentModal from "../components/students/CreateStudentModal";
import EditStudentModal from "../components/students/EditStudentModal";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";

const createNameMap = (items: Array<{ id: string; name: string }>) => {
  return items.reduce((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {} as { [key: string]: string });
};

// Separate component that uses useSearchParams
function StudentsContent() {
  const searchParams = useSearchParams();
  const classIdFilter = searchParams.get("classId");
  const departmentIdFilter = searchParams.get("departmentId");

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [classNameMap, setClassNameMap] = useState<{ [key: string]: string }>(
    {}
  );
  const [deptNameMap, setDeptNameMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentRes, classRes, deptRes] = await Promise.all([
        studentAPI.getAll(),
        classAPI.getAll(),
        departmentAPI.getAll(),
      ]);
      setAllStudents(studentRes.data || []);
      setAllClasses(classRes.data || []);
      setAllDepartments(deptRes.data || []);
      setClassNameMap(createNameMap(classRes.data || []));
      setDeptNameMap(createNameMap(deptRes.data || []));
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
    fetchData();
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStudent) return;
    setIsDeleting(true);
    try {
      await studentAPI.delete(selectedStudent.id);
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete student.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let students = allStudents;

    if (classIdFilter) {
      students = students.filter((s) => s.classId === classIdFilter);
    } else if (departmentIdFilter) {
      students = students.filter((s) => s.departmentId === departmentIdFilter);
    }

    if (searchQuery) {
      students = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return students;
  }, [allStudents, classIdFilter, departmentIdFilter, searchQuery]);

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

    if (allStudents.length === 0 && !classIdFilter && !departmentIdFilter) {
      return (
        <div className="text-center text-gray-500 py-10">
          <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No Students Found</h3>
          <p className="text-sm mb-4">
            Get started by creating your first student.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Student
          </button>
        </div>
      );
    }

    if (filteredStudents.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">
            No Students Match Your Criteria
          </h3>
          <p className="text-sm mb-4">
            Try a different search query or filter.
          </p>
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
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-lg shadow-md gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">
            Manage all students in the system.
          </p>
        </div>

        <div className="flex w-full md:w-auto space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Create New</span>
          </button>
        </div>
      </div>

      {renderContent()}

      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccess}
        departments={allDepartments}
        classes={allClasses}
      />
      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSuccess}
        student={selectedStudent}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete Student"
        message={`Are you sure you want to delete "${selectedStudent?.name}"? This will add a "deleted" block to their personal chain. This action is immutable.`}
      />
    </div>
  );
}

// Main component wrapped in Suspense
export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-gray-500 py-10">
          Loading students...
        </div>
      }
    >
      <StudentsContent />
    </Suspense>
  );
}
