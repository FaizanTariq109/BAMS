// frontend/app/components/attendance/AttendanceSheet.tsx
"use client";

import { useState, useEffect } from "react";
import { Student, AttendanceRecord } from "@/app/lib/types";
import { attendanceAPI } from "@/app/lib/api";

type AttendanceStatus = "Present" | "Absent" | "Leave";

interface AttendanceSheetProps {
  students: Student[];
  classId: string;
  date: string; // YYYY-MM-DD
  existingRecords: AttendanceRecord[];
}

// Helper to build the initial state from existing records
const buildInitialState = (
  students: Student[],
  records: AttendanceRecord[]
): Record<string, AttendanceStatus> => {
  const state: Record<string, AttendanceStatus> = {};
  const recordMap = new Map(records.map((r) => [r.studentId, r.status]));

  for (const student of students) {
    // Default to 'Present' if no record exists, or use the existing status
    state[student.id] = recordMap.get(student.id) || "Present";
  }
  return state;
};

export default function AttendanceSheet({
  students,
  classId,
  date,
  existingRecords,
}: AttendanceSheetProps) {
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >(() => buildInitialState(students, existingRecords));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Re-initialize state if the props (students/date) change
  useEffect(() => {
    setAttendance(buildInitialState(students, existingRecords));
  }, [students, existingRecords]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Format data for the bulk API call
    const attendanceRecords = Object.entries(attendance).map(
      ([studentId, status]) => ({
        studentId,
        status,
        date,
      })
    );

    try {
      await attendanceAPI.markBulk(attendanceRecords);
      setSuccess("Attendance marked successfully! Blocks are being mined.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to mark attendance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (students.length === 0) {
    return <p className="text-gray-500">No students found in this class.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-bold mb-4">
        Mark Attendance for {new Date(date + "T00:00:00").toLocaleDateString()}
      </h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm mb-4">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Header Row */}
        <div className="hidden md:grid grid-cols-3 gap-4 font-semibold text-gray-700 border-b pb-2">
          <div>Student Name</div>
          <div>Roll Number</div>
          <div>Status</div>
        </div>

        {/* Student Rows */}
        {students.map((student) => (
          <div
            key={student.id}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg md:border-0 md:p-0 md:pb-4 md:border-b"
          >
            <div className="md:flex md:items-center">
              <span className="font-semibold md:hidden">Name: </span>
              {student.name}
            </div>
            <div className="md:flex md:items-center">
              <span className="font-semibold md:hidden">Roll No: </span>
              <span className="font-mono">{student.rollNumber}</span>
            </div>

            {/* Radio Buttons */}
            <div className="flex space-x-2">
              {(["Present", "Absent", "Leave"] as AttendanceStatus[]).map(
                (status) => (
                  <label
                    key={status}
                    className={`flex-1 text-center px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors ${
                      attendance[student.id] === status
                        ? status === "Present"
                          ? "bg-green-600 text-white"
                          : status === "Absent"
                          ? "bg-red-600 text-white"
                          : "bg-yellow-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`status-${student.id}`}
                      value={status}
                      checked={attendance[student.id] === status}
                      onChange={() => handleStatusChange(student.id, status)}
                      className="sr-only" // Hide the actual radio button
                    />
                    {status}
                  </label>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Attendance"}
        </button>
      </div>
    </div>
  );
}
