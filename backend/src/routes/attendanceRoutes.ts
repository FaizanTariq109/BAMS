import { Router } from "express";
import {
  markAttendance,
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceByDepartment,
  getTodayAttendance,
} from "../controllers/attendanceController";

/**
 * Attendance Routes
 *
 * WHY: Define API endpoints for attendance operations
 * - Core blockchain feature
 * - Marking attendance creates blocks
 * - Viewing attendance reads blockchain
 *
 * KEY ENDPOINTS:
 * - POST /mark - Creates blockchain blocks
 * - GET /student/:id - Reads student's blockchain
 * - GET /class/:id - Aggregates class attendance
 * - GET /today - System-wide overview
 */

const router = Router();

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance (single or bulk)
 * @access  Public (in real app, would be admin/teacher only)
 * @body    Single: { studentId, status, date? }
 * @body    Bulk: { attendanceRecords: [{studentId, status, date?}] }
 *
 * THIS IS WHERE THE BLOCKCHAIN MAGIC HAPPENS:
 * - Each record becomes a block
 * - Block is mined with PoW
 * - Block is added to student's personal chain
 * - Attendance is now IMMUTABLE
 */
router.post("/mark", markAttendance);

/**
 * @route   GET /api/attendance/student/:studentId
 * @desc    Get student's complete attendance history
 * @access  Public
 * @param   studentId - Student ID
 *
 * RETURNS: Complete blockchain ledger of attendance
 */
router.get("/student/:studentId", getAttendanceByStudent);

/**
 * @route   GET /api/attendance/class/:classId
 * @desc    Get class attendance for specific date
 * @access  Public
 * @param   classId - Class ID
 * @query   ?date=2024-11-16 - Date (defaults to today)
 *
 * RETURNS: All students in class with their attendance status
 */
router.get("/class/:classId", getAttendanceByClass);

/**
 * @route   GET /api/attendance/department/:departmentId
 * @desc    Get department attendance for specific date
 * @access  Public
 * @param   departmentId - Department ID
 * @query   ?date=2024-11-16 - Date (defaults to today)
 *
 * RETURNS: All students in department with attendance
 */
router.get("/department/:departmentId", getAttendanceByDepartment);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance across entire system
 * @access  Public
 *
 * RETURNS: System-wide attendance summary for today
 */
router.get("/today", getTodayAttendance);

export default router;
