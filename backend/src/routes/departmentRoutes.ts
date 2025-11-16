import { Router } from "express";
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  searchDepartments,
  validateDepartment,
  getDepartmentStats,
} from "../controllers/departmentController";

/**
 * Department Routes
 *
 * WHY: Define API endpoints for department operations
 * - Maps URLs to controller functions
 * - RESTful API design
 * - Clear, predictable endpoints
 *
 * RESTFUL PATTERN:
 * - GET = Read
 * - POST = Create
 * - PUT = Update
 * - DELETE = Delete (soft delete in our case)
 *
 * URL STRUCTURE:
 * /api/departments           - Collection
 * /api/departments/:id       - Specific resource
 * /api/departments/:id/stats - Resource action
 */

const router = Router();

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @access  Public (in real app, would be admin only)
 * @body    { name, code, description }
 */
router.post("/", createDepartment);

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Public
 * @query   ?includeDeleted=true - Include deleted departments
 */
router.get("/", getAllDepartments);

/**
 * @route   GET /api/departments/search
 * @desc    Search departments by name or code
 * @access  Public
 * @query   ?q=computing - Search term
 *
 * NOTE: This route MUST come before /:id
 * WHY: Express matches routes in order
 * If /:id was first, "search" would be treated as an ID
 */
router.get("/search", searchDepartments);

/**
 * @route   GET /api/departments/:id
 * @desc    Get specific department with full chain
 * @access  Public
 * @param   id - Department ID
 */
router.get("/:id", getDepartmentById);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department (adds update block)
 * @access  Public (in real app, would be admin only)
 * @param   id - Department ID
 * @body    { name?, code?, description? }
 */
router.put("/:id", updateDepartment);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department (adds deletion block)
 * @access  Public (in real app, would be admin only)
 * @param   id - Department ID
 */
router.delete("/:id", deleteDepartment);

/**
 * @route   GET /api/departments/:id/validate
 * @desc    Validate department blockchain
 * @access  Public
 * @param   id - Department ID
 */
router.get("/:id/validate", validateDepartment);

/**
 * @route   GET /api/departments/:id/stats
 * @desc    Get department statistics
 * @access  Public
 * @param   id - Department ID
 */
router.get("/:id/stats", getDepartmentStats);

export default router;
