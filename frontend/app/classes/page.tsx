// frontend/app/classes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { classAPI, departmentAPI } from "@/app/lib/api";
import { Class, Department } from "@/app/lib/types";
import { Users, Plus } from "lucide-react";
import ClassCard from "../components/classes/ClassCard";
import CreateClassModal from "../components/classes/CreateClassModal";

// Helper to create a map for quick name lookups
const createDeptNameMap = (depts: Department[]) => {
  return depts.reduce((acc, dept) => {
    acc[dept.id] = dept.name;
    return acc;
  }, {} as { [key: string]: string });
};

export default function ClassesPage() {
  const searchParams = useSearchParams();
  const departmentIdFilter = searchParams.get("departmentId");

  const [classes, setClasses] = useState<Class[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptNameMap, setDeptNameMap] = useState<{ [key: string]: string }>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both departments and classes
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
    // Refetch when filter changes
  }, [departmentIdFilter]);

  const handleSuccess = () => {
    fetchData(); // Refetch the list after successful creation
  };

  const filteredDeptName = departmentIdFilter
    ? deptNameMap[departmentIdFilter]
    : null;

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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Class
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <ClassCard
            key={cls.id}
            class={cls}
            departmentName={deptNameMap[cls.departmentId]}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {filteredDeptName ? `${filteredDeptName} - Classes` : "All Classes"}
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all classes in the system.
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

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        departments={departments} // Pass the fetched departments to the modal
      />
    </div>
  );
}
