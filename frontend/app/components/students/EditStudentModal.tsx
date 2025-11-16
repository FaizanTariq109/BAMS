// frontend/app/components/students/EditStudentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { studentAPI } from "@/app/lib/api";
import { Student } from "@/app/lib/types";
import Modal from "../common/Modal";

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: Student | null; // Pass the student to edit
}

export default function EditStudentModal({
  isOpen,
  onClose,
  onSuccess,
  student,
}: EditStudentModalProps) {
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when the student prop is set
  useEffect(() => {
    if (student) {
      setName(student.name);
      setRollNumber(student.rollNumber);
      setEmail(student.email || "");
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the update API
      await studentAPI.update(student.id, {
        name,
        rollNumber,
        email: email || undefined,
      });
      onSuccess(); // Trigger refetch
      onClose(); // Close modal
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Student">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
          <strong>Note:</strong> Class and Department cannot be changed as this
          would invalidate the blockchain hierarchy.
        </div>

        <div>
          <label
            htmlFor="edit-student-name"
            className="block text-sm font-medium text-gray-700"
          >
            Student Name
          </label>
          <input
            type="text"
            id="edit-student-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="edit-rollNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Roll Number
          </label>
          <input
            type="text"
            id="edit-rollNumber"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="edit-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email (Optional)
          </label>
          <input
            type="email"
            id="edit-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
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
