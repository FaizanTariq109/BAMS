// frontend/app/departments/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react"; // 1. Import useMemo
import { departmentAPI } from "@/app/lib/api";
import { Department } from "@/app/lib/types";
import { Building2, Plus, Search } from "lucide-react"; // 2. Import Search icon
import DepartmentCard from "../components/departments/DepartmentCard";
import CreateDepartmentModal from "../components/departments/CreateDepartmentModal";
import EditDepartmentModal from "../components/departments/EditDepartmentModal";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Add state for the search query
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const fetchDepartments = async () => {
    // ... (existing fetchDepartments logic)
    try {
      setLoading(true);
      setError(null);
      const res = await departmentAPI.getAll();
      setDepartments(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // ... (existing modal handlers: handleCreateSuccess, handleEditSuccess, etc)
  const handleCreateSuccess = () => {
    fetchDepartments();
  };
  const handleEditSuccess = () => {
    fetchDepartments();
  };
  const handleEditClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditModalOpen(true);
  };
  const handleDeleteClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!selectedDepartment) return;
    setIsDeleting(true);
    try {
      await departmentAPI.delete(selectedDepartment.id);
      setIsDeleteModalOpen(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete department.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 4. Create a memoized list of filtered departments
  const filteredDepartments = useMemo(() => {
    if (!searchQuery) {
      return departments; // Return all if no search
    }
    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, searchQuery]); // Re-run when departments or search query change

  // 5. Update renderContent to use the filtered list
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-gray-500 py-10">
          Loading departments...
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-500 py-10">{error}</div>;
    }

    // Updated empty state logic
    if (departments.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No Departments Found</h3>
          <p className="text-sm mb-4">
            Get started by creating your first department.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Department
          </button>
        </div>
      );
    }

    // New empty state for when search yields no results
    if (filteredDepartments.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">
            No Departments Match Your Search
          </h3>
          <p className="text-sm mb-4">Try a different search query.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Use filteredDepartments here */}
        {filteredDepartments.map((dept) => (
          <DepartmentCard
            key={dept.id}
            department={dept}
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
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">
            Manage all departments in the system.
          </p>
        </div>

        {/* 6. Add the Search Bar and Create Button */}
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

      {/* All Modals */}
      <CreateDepartmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditDepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        department={selectedDepartment}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete Department"
        message={`Are you sure you want to delete "${selectedDepartment?.name}"? This will add a "deleted" block to the chain. This action is immutable.`}
      />
    </div>
  );
}
