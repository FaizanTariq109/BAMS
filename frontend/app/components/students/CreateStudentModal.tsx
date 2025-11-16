// frontend/app/components/students/CreateStudentModal.tsx
"use client";

import { useState, useMemo } from "react";
import { studentAPI } from "@/app/lib/api";
import { Department, Class } from "@/app/lib/types";
import Modal from "../common/Modal";

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: Department[];
  classes: Class[];
}

export default function CreateStudentModal({
  isOpen,
  onClose,
  onSuccess,
  departments,
  classes,
}: CreateStudentModalProps) {
  // Form state
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Dependent Dropdown Logic ---
  // Filter available classes based on the selected department
  const availableClasses = useMemo(() => {
    if (!selectedDeptId) return [];
    return classes.filter((cls) => cls.departmentId === selectedDeptId);
  }, [selectedDeptId, classes]);

  // Handle department change
  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    setSelectedClassId(""); // Reset class selection
  };
  // --- End of Logic ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedDeptId) {
      setError("Please select both a department and a class.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await studentAPI.create({
        name,
        rollNumber,
        email: email || undefined, // Send undefined if empty
        classId: selectedClassId,
        departmentId: selectedDeptId,
      });
      onSuccess();
      onClose();
      // Reset form
      setName("");
      setRollNumber("");
      setEmail("");
      setSelectedDeptId("");
      setSelectedClassId("");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Failed to create student. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Student">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="dept"
              className="block text-sm font-medium text-gray-700"
            >
              Department
            </label>
            <select
              id="dept"
              value={selectedDeptId}
              onChange={handleDeptChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                Select Department
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="class"
              className="block text-sm font-medium text-gray-700"
            >
              Class
            </label>
            <select
              id="class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              required
              disabled={!selectedDeptId} // Disable if no department is selected
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="" disabled>
                Select Class
              </option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr className="my-2" />

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Student Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., John Doe"
          />
        </div>

        <div>
          <label
            htmlFor="rollNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Roll Number
          </label>
          <input
            type="text"
            id="rollNumber"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., F22-1234"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email (Optional)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., john.doe@example.com"
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
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
