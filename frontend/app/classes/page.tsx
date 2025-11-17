// frontend/app/classes/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { classAPI, departmentAPI } from "@/app/lib/api";
import { Class, Department } from "@/app/lib/types";
import { Users, Plus, Search } from "lucide-react";
import ClassCard from "../components/classes/ClassCard";
import CreateClassModal from "../components/classes/CreateClassModal";
import EditClassModal from "../components/classes/EditClassModal";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";

const createDeptNameMap = (depts: Department[]) => {
  return depts.reduce((acc, dept) => {
    acc[dept.id] = dept.name;
    return acc;
  }, {} as { [key: string]: string });
};

// Separate component that uses useSearchParams
function ClassesContent() {
  const searchParams = useSearchParams();
  const departmentIdFilter = searchParams.get("departmentId");

  const [classes, setClasses] = useState<Class[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptNameMap, setDeptNameMap] = useState<{ [key: string]: string }>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [deptRes, classRes] = await Promise.all([
        departmentAPI.getAll(),
        departmentIdFilter
          ? classAPI.getByDepartment(departmentIdFilter)
          : classAPI.getAll(),
      ]);
      const depts = deptRes.data || [];
      setDepartments(depts);
      setDeptNameMap(createDeptNameMap(depts));
      setClasses(classRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentIdFilter]);

  const handleSuccess = () => {
    fetchData();
  };

  const handleEditClick = (classToEdit: Class) => {
    setSelectedClass(classToEdit);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (classToDelete: Class) => {
    setSelectedClass(classToDelete);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClass) return;
    setIsDeleting(true);
    try {
      await classAPI.delete(selectedClass.id);
      setIsDeleteModalOpen(false);
      setSelectedClass(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete class.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDeptName = departmentIdFilter
    ? deptNameMap[departmentIdFilter]
    : null;

  const filteredClasses = useMemo(() => {
    if (!searchQuery) {
      return classes;
    }
    return classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classes, searchQuery]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-gray-500 py-10">
          Loading classes...
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-500 py-10">{error}</div>;
    }

    if (classes.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No Classes Found</h3>
          <p className="text-sm mb-4">
            Get started by creating your first class.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Class
          </button>
        </div>
      );
    }

    if (filteredClasses.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">
            No Classes Match Your Search
          </h3>
          <p className="text-sm mb-4">Try a different search query.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <ClassCard
            key={cls.id}
            class={cls}
            departmentName={deptNameMap[cls.departmentId]}
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
          <h1 className="text-3xl font-bold text-gray-900">
            {filteredDeptName ? `${filteredDeptName} - Classes` : "All Classes"}
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all classes in the system.
          </p>
        </div>

        <div className="flex w-full md:w-auto space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or code..."
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

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccess}
        departments={departments}
      />
      <EditClassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSuccess}
        classToEdit={selectedClass}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete Class"
        message={`Are you sure you want to delete "${selectedClass?.name}"? This will add a "deleted" block to its chain. This action is immutable.`}
      />
    </div>
  );
}

// Main component wrapped in Suspense
export default function ClassesPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-gray-500 py-10">
          Loading classes...
        </div>
      }
    >
      <ClassesContent />
    </Suspense>
  );
}
