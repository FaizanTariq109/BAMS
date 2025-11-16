import { Request, Response } from "express";
import blockchainService from "../services/blockchainService";
import validationService from "../services/validationService";
import { generateId, sanitizeInput } from "../utils/helpers";

/**
 * Class Controller
 *
 * WHY: Handles all HTTP requests related to classes
 * - Classes are Layer 2 in our hierarchy
 * - Each class links to a parent department
 * - Genesis block uses department's latest hash
 *
 * HIERARCHY LINKING:
 * Department (Layer 1) → Class (Layer 2) → Student (Layer 3)
 *
 * KEY DIFFERENCE FROM DEPARTMENT:
 * - Must verify parent department exists
 * - Genesis block links to parent
 * - Validation checks parent link
 */

/**
 * createClass() - Creates new class linked to department
 *
 * POST /api/classes
 *
 * Body:
 * {
 *   "name": "CS101 - Data Structures",
 *   "code": "CS101",
 *   "departmentId": "dept_xyz123",
 *   "semester": "Fall 2024",
 *   "year": 2024
 * }
 *
 * WHY: Initialize a new class blockchain
 * - Links to parent department via genesis prev_hash
 *
 * WHAT IT DOES:
 * 1. Validate input
 * 2. Verify parent department exists
 * 3. Generate unique ID
 * 4. Create class chain with department link
 * 5. Return class info
 *
 * BLOCKCHAIN MAGIC:
 * - Gets department's latest hash
 * - Uses it as genesis prev_hash for class
 * - This creates the cryptographic link!
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, code, departmentId, semester, year } = req.body;

    // Validation
    if (!name || !code || !departmentId) {
      return res.status(400).json({
        error: "Name, code, and departmentId are required",
      });
    }

    // Verify parent department exists
    const parentDept = blockchainService.getDepartment(departmentId);
    if (!parentDept) {
      return res.status(404).json({
        error: `Parent department ${departmentId} not found`,
      });
    }

    // Check if department is active
    const deptState = parentDept.getCurrentState();
    if (deptState?.status === "deleted") {
      return res.status(400).json({
        error: "Cannot create class under deleted department",
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedCode = sanitizeInput(code.toUpperCase());

    // Generate unique ID
    const classId = generateId("class");

    // Create class chain (links to department)
    const chain = blockchainService.createClass(
      classId,
      sanitizedName,
      departmentId,
      {
        code: sanitizedCode,
        semester: semester || "",
        year: year || new Date().getFullYear(),
      }
    );

    // Get current state
    const currentState = chain.getCurrentState();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: {
        id: classId,
        ...currentState,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
        parentDepartmentHash: chain.parentDepartmentHash,
      },
    });
  } catch (error: any) {
    console.error("Error creating class:", error);
    res.status(500).json({
      error: "Failed to create class",
      details: error.message,
    });
  }
};

/**
 * getAllClasses() - Retrieves all classes
 *
 * GET /api/classes
 *
 * WHY: Display all classes in UI
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const { includeDeleted } = req.query;

    // Get all class chains
    const chains = blockchainService.getAllClasses();

    // Map to current state
    const classes = chains.map((chain) => {
      const state = chain.getCurrentState();
      return {
        id: chain.classId,
        ...state,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
        parentDepartmentHash: chain.parentDepartmentHash,
      };
    });

    // Filter deleted if requested
    const filtered =
      includeDeleted === "true"
        ? classes
        : classes.filter((c) => c.status === "active");

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    console.error("Error getting classes:", error);
    res.status(500).json({
      error: "Failed to retrieve classes",
      details: error.message,
    });
  }
};

/**
 * getClassById() - Retrieves specific class
 *
 * GET /api/classes/:id
 *
 * WHY: View class details with full blockchain
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getClass(id);

    if (!chain) {
      return res.status(404).json({
        error: "Class not found",
      });
    }

    const currentState = chain.getCurrentState();

    // Get parent department info
    const parentDept = blockchainService.getDepartment(chain.departmentId);
    const parentInfo = parentDept
      ? {
          id: parentDept.departmentId,
          name: parentDept.departmentName,
          latestHash: parentDept.getLatestBlock().hash,
        }
      : null;

    res.json({
      success: true,
      data: {
        id: chain.classId,
        ...currentState,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
        parentDepartmentHash: chain.parentDepartmentHash,
        parentDepartment: parentInfo,
        chain: chain.chain.map((block) => ({
          index: block.index,
          timestamp: block.timestamp,
          hash: block.hash,
          prev_hash: block.prev_hash,
          nonce: block.nonce,
          transactions: block.transactions,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error getting class:", error);
    res.status(500).json({
      error: "Failed to retrieve class",
      details: error.message,
    });
  }
};

/**
 * getClassesByDepartment() - Retrieves classes for specific department
 *
 * GET /api/classes/department/:departmentId
 *
 * WHY: Filter classes by parent department
 * - Show all classes in a department
 * - Useful for department view
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getClassesByDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const { includeDeleted } = req.query;

    // Verify department exists
    const dept = blockchainService.getDepartment(departmentId);
    if (!dept) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    // Get classes for this department
    const chains = blockchainService.getClassesByDepartment(departmentId);

    // Map to current state
    const classes = chains.map((chain) => {
      const state = chain.getCurrentState();
      return {
        id: chain.classId,
        ...state,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
      };
    });

    // Filter deleted if requested
    const filtered =
      includeDeleted === "true"
        ? classes
        : classes.filter((c) => c.status === "active");

    res.json({
      success: true,
      departmentId,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    console.error("Error getting classes by department:", error);
    res.status(500).json({
      error: "Failed to retrieve classes",
      details: error.message,
    });
  }
};

/**
 * updateClass() - Updates class information
 *
 * PUT /api/classes/:id
 *
 * Body:
 * {
 *   "name": "Updated Name",
 *   "semester": "Spring 2025"
 * }
 *
 * WHY: Immutable update - adds new block
 *
 * WHAT IT DOES:
 * Add update block to class chain
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if class exists
    const chain = blockchainService.getClass(id);
    if (!chain) {
      return res.status(404).json({
        error: "Class not found",
      });
    }

    // Sanitize updates
    if (updates.name) {
      updates.name = sanitizeInput(updates.name);
    }
    if (updates.code) {
      updates.code = sanitizeInput(updates.code.toUpperCase());
    }

    // Add update block
    blockchainService.updateClass(id, updates);

    // Get updated state
    const updatedChain = blockchainService.getClass(id);
    const currentState = updatedChain?.getCurrentState();

    res.json({
      success: true,
      message: "Class updated successfully",
      data: {
        id,
        ...currentState,
        chainLength: updatedChain?.getChainLength(),
        latestHash: updatedChain?.getLatestBlock().hash,
      },
    });
  } catch (error: any) {
    console.error("Error updating class:", error);
    res.status(500).json({
      error: "Failed to update class",
      details: error.message,
    });
  }
};

/**
 * deleteClass() - Marks class as deleted
 *
 * DELETE /api/classes/:id
 *
 * WHY: Soft delete - preserves history
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if class exists
    const chain = blockchainService.getClass(id);
    if (!chain) {
      return res.status(404).json({
        error: "Class not found",
      });
    }

    // Add deletion block
    blockchainService.deleteClass(id);

    res.json({
      success: true,
      message: "Class marked as deleted",
      data: {
        id,
        status: "deleted",
      },
    });
  } catch (error: any) {
    console.error("Error deleting class:", error);
    res.status(500).json({
      error: "Failed to delete class",
      details: error.message,
    });
  }
};

/**
 * searchClasses() - Searches classes by name
 *
 * GET /api/classes/search?q=cs101
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const searchClasses = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: "Search query required",
      });
    }

    const searchTerm = (q as string).toLowerCase();

    // Get all classes
    const chains = blockchainService.getAllClasses();

    // Filter by name or code
    const results = chains
      .map((chain) => {
        const state = chain.getCurrentState();
        return {
          id: chain.classId,
          ...state,
          chainLength: chain.getChainLength(),
        };
      })
      .filter(
        (cls) =>
          cls.status === "active" &&
          cls.name && // Check name exists
          (cls.name.toLowerCase().includes(searchTerm) ||
            cls.code?.toLowerCase().includes(searchTerm))
      );

    res.json({
      success: true,
      count: results.length,
      query: q,
      data: results,
    });
  } catch (error: any) {
    console.error("Error searching classes:", error);
    res.status(500).json({
      error: "Failed to search classes",
      details: error.message,
    });
  }
};

/**
 * validateClass() - Validates class blockchain and parent link
 *
 * GET /api/classes/:id/validate
 *
 * WHY: Verify blockchain integrity AND parent link
 *
 * WHAT IT CHECKS:
 * - Class chain integrity
 * - Parent department link
 * - Parent department validity
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const validateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getClass(id);
    if (!chain) {
      return res.status(404).json({
        error: "Class not found",
      });
    }

    // Run validation (includes parent link check)
    const validationResult = validationService.validateClassChain(id);

    res.json({
      success: true,
      data: validationResult,
    });
  } catch (error: any) {
    console.error("Error validating class:", error);
    res.status(500).json({
      error: "Failed to validate class",
      details: error.message,
    });
  }
};

/**
 * getClassStats() - Gets class statistics
 *
 * GET /api/classes/:id/stats
 *
 * WHY: Dashboard and reporting
 * - Number of students
 * - Attendance statistics
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getClassStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getClass(id);
    if (!chain) {
      return res.status(404).json({
        error: "Class not found",
      });
    }

    // Get students in this class
    const students = blockchainService.getStudentsByClass(id);
    const activeStudents = students.filter(
      (s) => s.getCurrentState()?.status === "active"
    );

    res.json({
      success: true,
      data: {
        classId: id,
        chainLength: chain.getChainLength(),
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        departmentId: chain.departmentId,
        createdAt: chain.getBlock(0)?.timestamp,
      },
    });
  } catch (error: any) {
    console.error("Error getting class stats:", error);
    res.status(500).json({
      error: "Failed to get class stats",
      details: error.message,
    });
  }
};
