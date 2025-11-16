/**
 * TypeScript Types & Interfaces
 *
 * WHY: Type safety for frontend
 * - Matches backend data structures
 * - Autocomplete in IDE
 * - Catch errors at compile time
 */

/**
 * Department
 */
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: number;
  status: "active" | "deleted";
  chainLength?: number;
  latestHash?: string;
}

export interface DepartmentChain extends Department {
  chain: Block[];
}

/**
 * Class
 */
export interface Class {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  semester?: string;
  year?: number;
  createdAt: number;
  status: "active" | "deleted";
  chainLength?: number;
  latestHash?: string;
  parentDepartmentHash?: string;
}

export interface ClassChain extends Class {
  chain: Block[];
}

/**
 * Student
 */
export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email?: string;
  classId: string;
  departmentId: string;
  createdAt: number;
  status: "active" | "deleted";
  chainLength?: number;
  latestHash?: string;
  parentClassHash?: string;
  attendanceStats?: AttendanceStats;
}

export interface StudentChain extends Student {
  chain: Block[];
}

/**
 * Attendance Record
 */
export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  departmentId: string;
  date: string;
  status: "Present" | "Absent" | "Leave";
  markedAt: number;
  markedBy?: string;
}

/**
 * Attendance Stats
 */
export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
}

/**
 * Block (for blockchain explorer)
 */
export interface Block {
  index: number;
  timestamp: number;
  hash: string;
  prev_hash: string;
  nonce: number;
  transactions: Array<{
    type: string;
    data: any;
    timestamp: number;
  }>;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  entityType: "department" | "class" | "student" | "system";
  entityId?: string;
  entityName?: string;
  errors: string[];
  warnings: string[];
  details: {
    chainLength?: number;
    genesisValid?: boolean;
    chainIntegrity?: boolean;
    proofOfWork?: boolean;
    parentLink?: boolean;
  };
}

/**
 * System Validation Result
 */
export interface SystemValidationResult {
  isValid: boolean;
  summary: {
    totalDepartments: number;
    validDepartments: number;
    totalClasses: number;
    validClasses: number;
    totalStudents: number;
    validStudents: number;
  };
  invalidEntities: {
    departments: string[];
    classes: string[];
    students: string[];
  };
  details: ValidationResult[];
}

/**
 * API Response (generic)
 */
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
  details?: string;
}
