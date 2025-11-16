import { Router } from "express";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  getStudentsByDepartment,
  updateStudent,
  deleteStudent,
  searchStudents,
  validateStudent,
  getStudentAttendance,
} from "../controllers/studentController";

/**
 * Student Routes
 *
 * WHY: Define API endpoints for student operations
 * - RESTful API design
 * - Includes class and department filtering
 * - Attendance ledger access
 * - Complete hierarchy endpoints
 *
 * HIERARCHY AWARENESS:
 * - /api/students/class/:classId - Filter by parent class
 * - /api/students/department/:deptId - Filter by parent department
 * - /api/students/:id/attendance - Student's blockchain ledger
 */

const router = Router();

/**
 * @route   POST /api/students
 * @desc    Create new student (links to class)
 * @access  Public (in real app, would be admin only)
 * @body    { name, rollNumber, email?, classId, departmentId }
 */
router.post("/", createStudent);

/**
 * @route   GET /api/students
 * @desc    Get all students
 * @access  Public
 * @query   ?includeDeleted=true - Include deleted students
 */
router.get("/", getAllStudents);

/**
 * @route   GET /api/students/search
 * @desc    Search students by name or roll number
 * @access  Public
 * @query   ?q=john - Search term
 *
 * NOTE: Must come before /:id route
 */
router.get("/search", searchStudents);

/**
 * @route   GET /api/students/class/:classId
 * @desc    Get all students for specific class
 * @access  Public
 * @param   classId - Parent class ID
 * @query   ?includeDeleted=true - Include deleted students
 *
 * NOTE: Must come before /:id to avoid conflict
 */
router.get("/class/:classId", getStudentsByClass);

/**
 * @route   GET /api/students/department/:departmentId
 * @desc    Get all students for specific department
 * @access  Public
 * @param   departmentId - Parent department ID
 * @query   ?includeDeleted=true - Include deleted students
 *
 * NOTE: Must come before /:id to avoid conflict
 */
router.get("/department/:departmentId", getStudentsByDepartment);

/**
 * @route   GET /api/students/:id
 * @desc    Get specific student with full chain
 * @access  Public
 * @param   id - Student ID
 */
router.get("/:id", getStudentById);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student (adds update block)
 * @access  Public (in real app, would be admin only)
 * @param   id - Student ID
 * @body    { name?, rollNumber?, email? }
 */
router.put("/:id", updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student (adds deletion block)
 * @access  Public (in real app, would be admin only)
 * @param   id - Student ID
 */
router.delete("/:id", deleteStudent);

/**
 * @route   GET /api/students/:id/validate
 * @desc    Validate student blockchain and full hierarchy
 * @access  Public
 * @param   id - Student ID
 */
router.get("/:id/validate", validateStudent);

/**
 * @route   GET /api/students/:id/attendance
 * @desc    Get student's attendance history (blockchain ledger)
 * @access  Public
 * @param   id - Student ID
 */
router.get("/:id/attendance", getStudentAttendance);

export default router;
