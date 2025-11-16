// frontend/app/components/departments/EditDepartmentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { departmentAPI } from "@/app/lib/api";
import { Department } from "@/app/lib/types";
import Modal from "../common/Modal";

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  department: Department | null; // Pass the department to edit
}

export default function EditDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  department,
}: EditDepartmentModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when the department prop is set
  useEffect(() => {
    if (department) {
      setName(department.name);
      setCode(department.code);
      setDescription(department.description || "");
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the update API
      await departmentAPI.update(department.id, {
        name,
        code,
        description,
      });
      onSuccess(); // Trigger refetch
      onClose(); // Close modal
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Department">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="edit-name"
            className="block text-sm font-medium text-gray-700"
          >
            Department Name
          </label>
          <input
            type="text"
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="edit-code"
            className="block text-sm font-medium text-gray-700"
          >
            Department Code
          </label>
          <input
            type="text"
            id="edit-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="edit-description"
            className="block text-sm font-medium text-gray-700"
          >
            Description (Optional)
          </label>
          <textarea
            id="edit-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
