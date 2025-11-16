// frontend/app/attendance/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  departmentAPI,
  classAPI,
  studentAPI,
  attendanceAPI,
} from "@/app/lib/api";
import { Department, Class, Student, AttendanceRecord } from "@/app/lib/types";
import { ClipboardCheck, Search } from "lucide-react";
import AttendanceSheet from "../components/attendance/AttendanceSheet";

// Helper to get today's date as YYYY-MM-DD
const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
};

export default function AttendancePage() {
  // All fetched data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // Form selection
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  // Data for the sheet
  const [students, setStudents] = useState<Student[]>([]);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>(
    []
  );
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  // Flag to show sheet
  const [showSheet, setShowSheet] = useState(false);

  // Load initial departments and classes
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [deptRes, classRes] = await Promise.all([
          departmentAPI.getAll(),
          classAPI.getAll(),
        ]);
        setDepartments(deptRes.data || []);
        setClasses(classRes.data || []);
      } catch (error) {
        console.error("Failed to load initial data", error);
      }
    };
    loadInitialData();
  }, []);

  // Filter classes based on selected department
  const availableClasses = useMemo(() => {
    if (!selectedDeptId) return [];
    return classes.filter((cls) => cls.departmentId === selectedDeptId);
  }, [selectedDeptId, classes]);

  // Handle department change
  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    setSelectedClassId(""); // Reset class
    setShowSheet(false); // Hide sheet
  };

  // Handle class change
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(e.target.value);
    setShowSheet(false); // Hide sheet
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setShowSheet(false); // Hide sheet
  };

  // Fetch student list and existing attendance
  const handleShowSheet = async () => {
    if (!selectedClassId || !selectedDate) return;

    setIsLoadingSheet(true);
    setShowSheet(false);
    try {
      const [studentRes, attendanceRes] = await Promise.all([
        studentAPI.getByClass(selectedClassId),
        attendanceAPI.getByClass(selectedClassId, selectedDate),
      ]);
      setStudents(studentRes.data || []);
      setExistingRecords(attendanceRes.data?.records || []);
      setShowSheet(true); // Now show the sheet
    } catch (error) {
      console.error("Failed to fetch attendance data", error);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-600 mt-1">
          Select a class and date to mark attendance.
        </p>
      </div>

      {/* Selection Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Department Dropdown */}
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

          {/* Class Dropdown */}
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
              onChange={handleClassChange}
              disabled={!selectedDeptId}
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

          {/* Date Picker */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Load Button */}
          <button
            onClick={handleShowSheet}
            disabled={!selectedClassId || !selectedDate || isLoadingSheet}
            className="inline-flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isLoadingSheet ? (
              "Loading..."
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Load Sheet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attendance Sheet */}
      {showSheet && !isLoadingSheet && (
        <AttendanceSheet
          students={students}
          classId={selectedClassId}
          date={selectedDate}
          existingRecords={existingRecords}
        />
      )}
      {isLoadingSheet && (
        <div className="text-center text-gray-500 py-10">
          Loading attendance sheet...
        </div>
      )}
    </div>
  );
}
