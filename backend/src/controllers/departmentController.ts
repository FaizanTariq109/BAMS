import { Request, Response } from "express";
import blockchainService from "../services/blockchainService";
import validationService from "../services/validationService";
import { generateId, sanitizeInput } from "../utils/helpers";

/**
 * Department Controller
 *
 * WHY: Handles all HTTP requests related to departments
 * - Separates routing logic from business logic
 * - Uses blockchainService for blockchain operations
 * - Returns consistent JSON responses
 *
 * PATTERN: Controller → Service → Blockchain Classes → Storage
 *
 * REQUEST FLOW:
 * 1. Frontend sends HTTP request
 * 2. Route directs to controller method
 * 3. Controller validates input
 * 4. Controller calls service
 * 5. Service updates blockchain
 * 6. Controller returns JSON response
 */

/**
 * createDepartment() - Creates new department
 *
 * POST /api/departments
 *
 * Body:
 * {
 *   "name": "School of Computing",
 *   "code": "SOC",
 *   "description": "Computer Science Department"
 * }
 *
 * WHY: Initialize a new department blockchain
 *
 * WHAT IT DOES:
 * 1. Validate input
 * 2. Generate unique ID
 * 3. Create department chain with genesis block
 * 4. Return department info
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        error: "Name and code are required",
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedCode = sanitizeInput(code.toUpperCase());

    // Generate unique ID
    const departmentId = generateId("dept");

    // Create department chain
    const chain = blockchainService.createDepartment(
      departmentId,
      sanitizedName,
      {
        code: sanitizedCode,
        description: description || "",
      }
    );

    // Get current state
    const currentState = chain.getCurrentState();

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: {
        id: departmentId,
        ...currentState,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
      },
    });
  } catch (error: any) {
    console.error("Error creating department:", error);
    res.status(500).json({
      error: "Failed to create department",
      details: error.message,
    });
  }
};

/**
 * getAllDepartments() - Retrieves all departments
 *
 * GET /api/departments
 *
 * WHY: Display all departments in UI
 *
 * WHAT IT DOES:
 * 1. Get all department chains
 * 2. Extract current state from each
 * 3. Filter out deleted departments (optional)
 * 4. Return array
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const { includeDeleted } = req.query;

    // Get all department chains
    const chains = blockchainService.getAllDepartments();

    // Map to current state
    const departments = chains.map((chain) => {
      const state = chain.getCurrentState();
      return {
        id: chain.departmentId,
        ...state,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
      };
    });

    // Filter deleted if requested
    const filtered =
      includeDeleted === "true"
        ? departments
        : departments.filter((d) => d.status === "active");

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    console.error("Error getting departments:", error);
    res.status(500).json({
      error: "Failed to retrieve departments",
      details: error.message,
    });
  }
};

/**
 * getDepartmentById() - Retrieves specific department
 *
 * GET /api/departments/:id
 *
 * WHY: View department details
 *
 * WHAT IT DOES:
 * Returns department with full blockchain info
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getDepartment(id);

    if (!chain) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    const currentState = chain.getCurrentState();

    res.json({
      success: true,
      data: {
        id: chain.departmentId,
        ...currentState,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
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
    console.error("Error getting department:", error);
    res.status(500).json({
      error: "Failed to retrieve department",
      details: error.message,
    });
  }
};

/**
 * updateDepartment() - Updates department information
 *
 * PUT /api/departments/:id
 *
 * Body:
 * {
 *   "name": "Updated Name",
 *   "description": "New description"
 * }
 *
 * WHY: Immutable update - adds new block
 *
 * WHAT IT DOES:
 * 1. Validate input
 * 2. Add update block to department chain
 * 3. Return updated state
 *
 * BLOCKCHAIN PRINCIPLE:
 * - Don't modify existing blocks
 * - Add new block with updated data
 * - Latest block = current state
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if department exists
    const chain = blockchainService.getDepartment(id);
    if (!chain) {
      return res.status(404).json({
        error: "Department not found",
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
    blockchainService.updateDepartment(id, updates);

    // Get updated state
    const updatedChain = blockchainService.getDepartment(id);
    const currentState = updatedChain?.getCurrentState();

    res.json({
      success: true,
      message: "Department updated successfully",
      data: {
        id,
        ...currentState,
        chainLength: updatedChain?.getChainLength(),
        latestHash: updatedChain?.getLatestBlock().hash,
      },
    });
  } catch (error: any) {
    console.error("Error updating department:", error);
    res.status(500).json({
      error: "Failed to update department",
      details: error.message,
    });
  }
};

/**
 * deleteDepartment() - Marks department as deleted
 *
 * DELETE /api/departments/:id
 *
 * WHY: Soft delete - preserves history
 *
 * WHAT IT DOES:
 * 1. Check if department exists
 * 2. Add deletion block (status = 'deleted')
 * 3. Return confirmation
 *
 * BLOCKCHAIN PRINCIPLE:
 * - Can't actually delete blocks
 * - Add block marking as deleted
 * - Frontend filters deleted departments
 * - History preserved for auditing
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const chain = blockchainService.getDepartment(id);
    if (!chain) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    // Add deletion block
    blockchainService.deleteDepartment(id);

    res.json({
      success: true,
      message: "Department marked as deleted",
      data: {
        id,
        status: "deleted",
      },
    });
  } catch (error: any) {
    console.error("Error deleting department:", error);
    res.status(500).json({
      error: "Failed to delete department",
      details: error.message,
    });
  }
};

/**
 * searchDepartments() - Searches departments by name
 *
 * GET /api/departments/search?q=computing
 *
 * WHY: Quick find functionality
 *
 * WHAT IT DOES:
 * Filters departments by name (case-insensitive)
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const searchDepartments = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: "Search query required",
      });
    }

    const searchTerm = (q as string).toLowerCase();

    // Get all departments
    const chains = blockchainService.getAllDepartments();

    // Filter by name
    const results = chains
      .map((chain) => {
        const state = chain.getCurrentState();
        return {
          id: chain.departmentId,
          ...state,
          chainLength: chain.getChainLength(),
        };
      })
      .filter(
        (dept) =>
          dept.status === "active" &&
          dept.name && // Check name exists
          (dept.name.toLowerCase().includes(searchTerm) ||
            dept.code?.toLowerCase().includes(searchTerm))
      );

    res.json({
      success: true,
      count: results.length,
      query: q,
      data: results,
    });
  } catch (error: any) {
    console.error("Error searching departments:", error);
    res.status(500).json({
      error: "Failed to search departments",
      details: error.message,
    });
  }
};

/**
 * validateDepartment() - Validates department blockchain
 *
 * GET /api/departments/:id/validate
 *
 * WHY: Verify blockchain integrity
 *
 * WHAT IT DOES:
 * Runs validation checks and returns results
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const validateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getDepartment(id);
    if (!chain) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    // Run validation
    const validationResult = validationService.validateDepartmentChain(id);

    res.json({
      success: true,
      data: validationResult,
    });
  } catch (error: any) {
    console.error("Error validating department:", error);
    res.status(500).json({
      error: "Failed to validate department",
      details: error.message,
    });
  }
};

/**
 * getDepartmentStats() - Gets department statistics
 *
 * GET /api/departments/:id/stats
 *
 * WHY: Dashboard and reporting
 *
 * WHAT IT DOES:
 * Returns stats like number of classes, students, etc.
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getDepartmentStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getDepartment(id);
    if (!chain) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    // Get classes in this department
    const classes = blockchainService.getClassesByDepartment(id);
    const activeClasses = classes.filter(
      (c) => c.getCurrentState()?.status === "active"
    );

    // Get students in this department
    const students = blockchainService.getStudentsByDepartment(id);
    const activeStudents = students.filter(
      (s) => s.getCurrentState()?.status === "active"
    );

    res.json({
      success: true,
      data: {
        departmentId: id,
        chainLength: chain.getChainLength(),
        totalClasses: classes.length,
        activeClasses: activeClasses.length,
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        createdAt: chain.getBlock(0)?.timestamp,
      },
    });
  } catch (error: any) {
    console.error("Error getting department stats:", error);
    res.status(500).json({
      error: "Failed to get department stats",
      details: error.message,
    });
  }
};
