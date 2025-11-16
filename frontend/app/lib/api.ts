// frontend/app/lib/api.ts

import axios from "axios";
import { DepartmentChain, ClassChain, StudentChain } from "./types"; // Added these types

/**
 * API Client
 *
 * WHY: Centralized API communication
 * - All backend requests go through this client
 * - Handles base URL configuration
 * - Provides type-safe API methods
 * - Easy error handling
 *
 * HOW IT WORKS:
 * - Uses axios for HTTP requests
 * - Base URL from environment variable
 * - Each method maps to a backend endpoint
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * DEPARTMENT API
 */
export const departmentAPI = {
  // Get all departments
  getAll: async (includeDeleted = false) => {
    const response = await api.get(
      `/departments?includeDeleted=${includeDeleted}`
    );
    return response.data;
  },

  // Get single department (Updated return type)
  getById: async (
    id: string
  ): Promise<{ success: boolean; data: DepartmentChain }> => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // Create department
  create: async (data: {
    name: string;
    code: string;
    description?: string;
  }) => {
    const response = await api.post("/departments", data);
    return response.data;
  },

  // Update department
  update: async (id: string, data: any) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  // Delete department
  delete: async (id: string) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  // Search departments
  search: async (query: string) => {
    const response = await api.get(`/departments/search?q=${query}`);
    return response.data;
  },

  // Validate department
  validate: async (id: string) => {
    const response = await api.get(`/departments/${id}/validate`);
    return response.data;
  },

  // Get department stats
  getStats: async (id: string) => {
    const response = await api.get(`/departments/${id}/stats`);
    return response.data;
  },
};

/**
 * CLASS API
 */
export const classAPI = {
  // Get all classes
  getAll: async (includeDeleted = false) => {
    const response = await api.get(`/classes?includeDeleted=${includeDeleted}`);
    return response.data;
  },

  // Get single class (Updated return type)
  getById: async (
    id: string
  ): Promise<{ success: boolean; data: ClassChain }> => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  // Get classes by department
  getByDepartment: async (departmentId: string, includeDeleted = false) => {
    const response = await api.get(
      `/classes/department/${departmentId}?includeDeleted=${includeDeleted}`
    );
    return response.data;
  },

  // Create class
  create: async (data: {
    name: string;
    code: string;
    departmentId: string;
    semester?: string;
    year?: number;
  }) => {
    const response = await api.post("/classes", data);
    return response.data;
  },

  // Update class
  update: async (id: string, data: any) => {
    const response = await api.put(`/classes/${id}`, data);
    return response.data;
  },

  // Delete class
  delete: async (id: string) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  // Search classes
  search: async (query: string) => {
    const response = await api.get(`/classes/search?q=${query}`);
    return response.data;
  },

  // Validate class
  validate: async (id: string) => {
    const response = await api.get(`/classes/${id}/validate`);
    return response.data;
  },

  // Get class stats
  getStats: async (id: string) => {
    const response = await api.get(`/classes/${id}/stats`);
    return response.data;
  },
};

/**
 * STUDENT API
 */
export const studentAPI = {
  // Get all students
  getAll: async (includeDeleted = false) => {
    const response = await api.get(
      `/students?includeDeleted=${includeDeleted}`
    );
    return response.data;
  },

  // Get single student (Updated return type)
  getById: async (
    id: string
  ): Promise<{ success: boolean; data: StudentChain }> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Get students by class
  getByClass: async (classId: string, includeDeleted = false) => {
    const response = await api.get(
      `/students/class/${classId}?includeDeleted=${includeDeleted}`
    );
    return response.data;
  },

  // Get students by department
  getByDepartment: async (departmentId: string, includeDeleted = false) => {
    const response = await api.get(
      `/students/department/${departmentId}?includeDeleted=${includeDeleted}`
    );
    return response.data;
  },

  // Create student
  create: async (data: {
    name: string;
    rollNumber: string;
    email?: string;
    classId: string;
    departmentId: string;
  }) => {
    const response = await api.post("/students", data);
    return response.data;
  },

  // Update student
  update: async (id: string, data: any) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  // Delete student
  delete: async (id: string) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  // Search students
  search: async (query: string) => {
    const response = await api.get(`/students/search?q=${query}`);
    return response.data;
  },

  // Validate student
  validate: async (id: string) => {
    const response = await api.get(`/students/${id}/validate`);
    return response.data;
  },

  // Get student attendance
  getAttendance: async (id: string) => {
    const response = await api.get(`/students/${id}/attendance`);
    return response.data;
  },
};

/**
 * ATTENDANCE API
 */
export const attendanceAPI = {
  // Mark single attendance
  markSingle: async (data: {
    studentId: string;
    status: "Present" | "Absent" | "Leave";
    date?: string;
  }) => {
    const response = await api.post("/attendance/mark", data);
    return response.data;
  },

  // Mark bulk attendance
  markBulk: async (
    attendanceRecords: Array<{
      studentId: string;
      status: "Present" | "Absent" | "Leave";
      date?: string;
    }>
  ) => {
    const response = await api.post("/attendance/mark", { attendanceRecords });
    return response.data;
  },

  // Get attendance by student
  getByStudent: async (studentId: string) => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
  },

  // Get attendance by class
  getByClass: async (classId: string, date?: string) => {
    const url = date
      ? `/attendance/class/${classId}?date=${date}`
      : `/attendance/class/${classId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get attendance by department
  getByDepartment: async (departmentId: string, date?: string) => {
    const url = date
      ? `/attendance/department/${departmentId}?date=${date}`
      : `/attendance/department/${departmentId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get today's attendance
  getToday: async () => {
    const response = await api.get("/attendance/today");
    return response.data;
  },
};

/**
 * VALIDATION API
 */
export const validationAPI = {
  // Validate entire system
  validateSystem: async () => {
    const response = await api.get("/validate/system");
    return response.data;
  },

  // Validate department
  validateDepartment: async (id: string) => {
    const response = await api.get(`/validate/department/${id}`);
    return response.data;
  },

  // Validate class
  validateClass: async (id: string) => {
    const response = await api.get(`/validate/class/${id}`);
    return response.data;
  },

  // Validate student
  validateStudent: async (id: string) => {
    const response = await api.get(`/validate/student/${id}`);
    return response.data;
  },
};

export default api;
