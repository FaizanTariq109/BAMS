import { Router } from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  getClassesByDepartment,
  updateClass,
  deleteClass,
  searchClasses,
  validateClass,
  getClassStats,
} from "../controllers/classController";

/**
 * Class Routes
 *
 * WHY: Define API endpoints for class operations
 * - RESTful API design
 * - Includes department filtering
 * - Parent-child relationship endpoints
 *
 * HIERARCHY AWARENESS:
 * - /api/classes/department/:deptId - Filter by parent
 * - This shows the hierarchical nature of our blockchain
 */

const router = Router();

/**
 * @route   POST /api/classes
 * @desc    Create new class (links to department)
 * @access  Public (in real app, would be admin only)
 * @body    { name, code, departmentId, semester?, year? }
 */
router.post("/", createClass);

/**
 * @route   GET /api/classes
 * @desc    Get all classes
 * @access  Public
 * @query   ?includeDeleted=true - Include deleted classes
 */
router.get("/", getAllClasses);

/**
 * @route   GET /api/classes/search
 * @desc    Search classes by name or code
 * @access  Public
 * @query   ?q=cs101 - Search term
 *
 * NOTE: Must come before /:id route
 */
router.get("/search", searchClasses);

/**
 * @route   GET /api/classes/department/:departmentId
 * @desc    Get all classes for specific department
 * @access  Public
 * @param   departmentId - Parent department ID
 * @query   ?includeDeleted=true - Include deleted classes
 *
 * NOTE: Must come before /:id to avoid conflict
 * "department" is treated as literal path, not ID
 */
router.get("/department/:departmentId", getClassesByDepartment);

/**
 * @route   GET /api/classes/:id
 * @desc    Get specific class with full chain
 * @access  Public
 * @param   id - Class ID
 */
router.get("/:id", getClassById);

/**
 * @route   PUT /api/classes/:id
 * @desc    Update class (adds update block)
 * @access  Public (in real app, would be admin only)
 * @param   id - Class ID
 * @body    { name?, code?, semester?, year? }
 */
router.put("/:id", updateClass);

/**
 * @route   DELETE /api/classes/:id
 * @desc    Delete class (adds deletion block)
 * @access  Public (in real app, would be admin only)
 * @param   id - Class ID
 */
router.delete("/:id", deleteClass);

/**
 * @route   GET /api/classes/:id/validate
 * @desc    Validate class blockchain and parent link
 * @access  Public
 * @param   id - Class ID
 */
router.get("/:id/validate", validateClass);

/**
 * @route   GET /api/classes/:id/stats
 * @desc    Get class statistics
 * @access  Public
 * @param   id - Class ID
 */
router.get("/:id/stats", getClassStats);

export default router;
