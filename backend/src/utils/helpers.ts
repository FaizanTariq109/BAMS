import crypto from "crypto";

/**
 * Utility Helper Functions
 *
 * WHY: Common functions used across the application
 * - ID generation
 * - Date formatting
 * - Validation helpers
 */

/**
 * generateId() - Generates unique ID
 *
 * WHY: Need unique IDs for departments, classes, students
 * - Simple and collision-resistant
 * - Human-readable prefix
 *
 * HOW: prefix + timestamp + random hex
 *
 * @param prefix - Type of entity (dept, class, student)
 * @returns Unique ID string
 */
export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36); // Base36 for shorter strings
  const randomPart = crypto.randomBytes(4).toString("hex");
  return `${prefix}_${timestamp}_${randomPart}`;
};

/**
 * formatDate() - Formats date to YYYY-MM-DD
 *
 * WHY: Consistent date format for attendance
 * - Easy to compare
 * - Standard format
 *
 * @param date - Date object or timestamp
 * @returns Formatted date string
 */
export const formatDate = (date: Date | number = new Date()): string => {
  const d = typeof date === "number" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * isValidDate() - Validates date string format
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if valid
 */
export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * validateEmail() - Basic email validation
 *
 * @param email - Email address
 * @returns true if valid format
 */
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * sanitizeInput() - Basic input sanitization
 *
 * WHY: Prevent injection attacks
 * - Remove dangerous characters
 * - Trim whitespace
 *
 * @param input - User input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};

/**
 * generateRollNumber() - Generates student roll number
 *
 * WHY: Consistent format for roll numbers
 * - Year + Department code + Sequential number
 *
 * @param year - Admission year
 * @param deptCode - Department code (e.g., "CS", "SE")
 * @param sequence - Sequential number
 * @returns Roll number (e.g., "2024-CS-001")
 */
export const generateRollNumber = (
  year: number,
  deptCode: string,
  sequence: number
): string => {
  const seqStr = String(sequence).padStart(3, "0");
  return `${year}-${deptCode.toUpperCase()}-${seqStr}`;
};

/**
 * parseRollNumber() - Extracts components from roll number
 *
 * @param rollNumber - Roll number string
 * @returns Object with year, deptCode, sequence
 */
export const parseRollNumber = (
  rollNumber: string
): {
  year: number;
  deptCode: string;
  sequence: number;
} | null => {
  const parts = rollNumber.split("-");
  if (parts.length !== 3) return null;

  return {
    year: parseInt(parts[0]),
    deptCode: parts[1],
    sequence: parseInt(parts[2]),
  };
};

/**
 * calculateAttendancePercentage() - Calculates attendance percentage
 *
 * @param present - Number of present days
 * @param total - Total days
 * @returns Percentage rounded to 2 decimals
 */
export const calculateAttendancePercentage = (
  present: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((present / total) * 10000) / 100;
};

/**
 * getCurrentAcademicYear() - Gets current academic year
 *
 * WHY: For automatic year assignment
 * - Assumes academic year starts in September
 *
 * @returns Academic year (e.g., 2024)
 */
export const getCurrentAcademicYear = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // If before September, use previous year
  return month < 8 ? year - 1 : year;
};
