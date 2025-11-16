// frontend/app/components/classes/EditClassModal.tsx
"use client";

import { useState, useEffect } from "react";
import { classAPI } from "@/app/lib/api";
import { Class } from "@/app/lib/types";
import Modal from "../common/Modal";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classToEdit: Class | null; // Pass the class to edit
}

export default function EditClassModal({
  isOpen,
  onClose,
  onSuccess,
  classToEdit,
}: EditClassModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when the class prop is set
  useEffect(() => {
    if (classToEdit) {
      setName(classToEdit.name);
      setCode(classToEdit.code);
      setSemester(classToEdit.semester || "");
      setYear(classToEdit.year?.toString() || "");
    }
  }, [classToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classToEdit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the update API
      await classAPI.update(classToEdit.id, {
        name,
        code,
        semester: semester || undefined,
        year: year ? parseInt(year) : undefined,
      });
      onSuccess(); // Trigger refetch
      onClose(); // Close modal
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Class">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="edit-class-name"
            className="block text-sm font-medium text-gray-700"
          >
            Class Name
          </label>
          <input
            type="text"
            id="edit-class-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="edit-class-code"
            className="block text-sm font-medium text-gray-700"
          >
            Class Code
          </label>
          <input
            type="text"
            id="edit-class-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="edit-semester"
              className="block text-sm font-medium text-gray-700"
            >
              Semester (Optional)
            </label>
            <input
              type="text"
              id="edit-semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Fall"
            />
          </div>
          <div>
            <label
              htmlFor="edit-year"
              className="block text-sm font-medium text-gray-700"
            >
              Year (Optional)
            </label>
            <input
              type="number"
              id="edit-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2025"
            />
          </div>
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
