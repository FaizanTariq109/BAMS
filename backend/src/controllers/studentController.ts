import { Request, Response } from "express";
import blockchainService from "../services/blockchainService";
import validationService from "../services/validationService";
import { generateId, sanitizeInput, validateEmail } from "../utils/helpers";

/**
 * Student Controller
 *
 * WHY: Handles all HTTP requests related to students
 * - Students are Layer 3 in our hierarchy
 * - Each student links to a parent class
 * - Genesis block uses class's latest hash
 * - Student chain stores attendance records
 *
 * COMPLETE HIERARCHY:
 * Department (Layer 1) → Class (Layer 2) → Student (Layer 3)
 *
 * KEY FEATURES:
 * - Must verify parent class exists
 * - Genesis block links to class
 * - Attendance records become blocks in student chain
 * - Validation checks entire hierarchy
 */

/**
 * createStudent() - Creates new student linked to class
 *
 * POST /api/students
 *
 * Body:
 * {
 *   "name": "John Doe",
 *   "rollNumber": "2024-CS-001",
 *   "email": "john@example.com",
 *   "classId": "class_xyz123",
 *   "departmentId": "dept_abc456"
 * }
 *
 * WHY: Initialize a new student blockchain
 * - Links to parent class via genesis prev_hash
 * - Creates personal attendance ledger
 *
 * WHAT IT DOES:
 * 1. Validate input
 * 2. Verify parent class exists
 * 3. Verify parent department exists
 * 4. Check roll number uniqueness
 * 5. Generate unique ID
 * 6. Create student chain with class link
 * 7. Return student info
 *
 * BLOCKCHAIN MAGIC:
 * - Gets class's latest hash
 * - Uses it as genesis prev_hash for student
 * - This completes the 3-layer hierarchy!
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const createStudent = async (req: Request, res: Response) => {
  try {
    const { name, rollNumber, email, classId, departmentId } = req.body;

    // Validation
    if (!name || !rollNumber || !classId || !departmentId) {
      return res.status(400).json({
        error: "Name, rollNumber, classId, and departmentId are required",
      });
    }

    // Verify parent class exists
    const parentClass = blockchainService.getClass(classId);
    if (!parentClass) {
      return res.status(404).json({
        error: `Parent class ${classId} not found`,
      });
    }

    // Check if class is active
    const classState = parentClass.getCurrentState();
    if (classState?.status === "deleted") {
      return res.status(400).json({
        error: "Cannot create student under deleted class",
      });
    }

    // Verify parent department exists
    const parentDept = blockchainService.getDepartment(departmentId);
    if (!parentDept) {
      return res.status(404).json({
        error: `Parent department ${departmentId} not found`,
      });
    }

    // Check for duplicate roll number
    const existingStudents = blockchainService.getAllStudents();
    const duplicateRoll = existingStudents.find((s) => {
      const state = s.getCurrentState();
      return state?.rollNumber === rollNumber && state?.status === "active";
    });

    if (duplicateRoll) {
      return res.status(400).json({
        error: `Roll number ${rollNumber} already exists`,
      });
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedRollNumber = sanitizeInput(rollNumber.toUpperCase());
    const sanitizedEmail = email ? sanitizeInput(email) : undefined;

    // Generate unique ID
    const studentId = generateId("student");

    // Create student chain (links to class)
    const chain = blockchainService.createStudent(
      studentId,
      sanitizedName,
      sanitizedRollNumber,
      classId,
      departmentId,
      {
        email: sanitizedEmail,
      }
    );

    // Get current state
    const currentState = chain.getCurrentState();

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: {
        id: studentId,
        ...currentState,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
        parentClassHash: chain.parentClassHash,
      },
    });
  } catch (error: any) {
    console.error("Error creating student:", error);
    res.status(500).json({
      error: "Failed to create student",
      details: error.message,
    });
  }
};

/**
 * getAllStudents() - Retrieves all students
 *
 * GET /api/students
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const { includeDeleted } = req.query;

    // Get all student chains
    const chains = blockchainService.getAllStudents();

    // Map to current state
    const students = chains.map((chain) => {
      const state = chain.getCurrentState();
      return {
        id: chain.studentId,
        ...state,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
        parentClassHash: chain.parentClassHash,
      };
    });

    // Filter deleted if requested
    const filtered =
      includeDeleted === "true"
        ? students
        : students.filter((s) => s.status === "active");

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    console.error("Error getting students:", error);
    res.status(500).json({
      error: "Failed to retrieve students",
      details: error.message,
    });
  }
};

/**
 * getStudentById() - Retrieves specific student
 *
 * GET /api/students/:id
 *
 * WHY: View student details with full blockchain
 * - Includes attendance history
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getStudent(id);

    if (!chain) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    const currentState = chain.getCurrentState();

    // Get parent class info
    const parentClass = blockchainService.getClass(chain.classId);
    const classInfo = parentClass
      ? {
          id: parentClass.classId,
          name: parentClass.className,
          latestHash: parentClass.getLatestBlock().hash,
        }
      : null;

    // Get parent department info
    const parentDept = blockchainService.getDepartment(chain.departmentId);
    const deptInfo = parentDept
      ? {
          id: parentDept.departmentId,
          name: parentDept.departmentName,
          latestHash: parentDept.getLatestBlock().hash,
        }
      : null;

    // Get attendance statistics
    const attendanceStats = chain.getAttendanceStats();

    res.json({
      success: true,
      data: {
        id: chain.studentId,
        ...currentState,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
        parentClassHash: chain.parentClassHash,
        parentClass: classInfo,
        parentDepartment: deptInfo,
        attendanceStats,
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
    console.error("Error getting student:", error);
    res.status(500).json({
      error: "Failed to retrieve student",
      details: error.message,
    });
  }
};

/**
 * getStudentsByClass() - Retrieves students for specific class
 *
 * GET /api/students/class/:classId
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getStudentsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { includeDeleted } = req.query;

    // Verify class exists
    const cls = blockchainService.getClass(classId);
    if (!cls) {
      return res.status(404).json({
        error: "Class not found",
      });
    }

    // Get students for this class
    const chains = blockchainService.getStudentsByClass(classId);

    // Map to current state
    const students = chains.map((chain) => {
      const state = chain.getCurrentState();
      const stats = chain.getAttendanceStats();
      return {
        id: chain.studentId,
        ...state,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
        attendanceStats: stats,
      };
    });

    // Filter deleted if requested
    const filtered =
      includeDeleted === "true"
        ? students
        : students.filter((s) => s.status === "active");

    res.json({
      success: true,
      classId,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    console.error("Error getting students by class:", error);
    res.status(500).json({
      error: "Failed to retrieve students",
      details: error.message,
    });
  }
};

/**
 * getStudentsByDepartment() - Retrieves students for specific department
 *
 * GET /api/students/department/:departmentId
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getStudentsByDepartment = async (req: Request, res: Response) => {
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

    // Get students for this department
    const chains = blockchainService.getStudentsByDepartment(departmentId);

    // Map to current state
    const students = chains.map((chain) => {
      const state = chain.getCurrentState();
      return {
        id: chain.studentId,
        ...state,
        chainLength: chain.getChainLength(),
        latestHash: chain.getLatestBlock().hash,
      };
    });

    // Filter deleted if requested
    const filtered =
      includeDeleted === "true"
        ? students
        : students.filter((s) => s.status === "active");

    res.json({
      success: true,
      departmentId,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    console.error("Error getting students by department:", error);
    res.status(500).json({
      error: "Failed to retrieve students",
      details: error.message,
    });
  }
};

/**
 * updateStudent() - Updates student information
 *
 * PUT /api/students/:id
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if student exists
    const chain = blockchainService.getStudent(id);
    if (!chain) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    // Sanitize updates
    if (updates.name) {
      updates.name = sanitizeInput(updates.name);
    }
    if (updates.rollNumber) {
      updates.rollNumber = sanitizeInput(updates.rollNumber.toUpperCase());
    }
    if (updates.email) {
      if (!validateEmail(updates.email)) {
        return res.status(400).json({
          error: "Invalid email format",
        });
      }
      updates.email = sanitizeInput(updates.email);
    }

    // Add update block
    blockchainService.updateStudent(id, updates);

    // Get updated state
    const updatedChain = blockchainService.getStudent(id);
    const currentState = updatedChain?.getCurrentState();

    res.json({
      success: true,
      message: "Student updated successfully",
      data: {
        id,
        ...currentState,
        chainLength: updatedChain?.getChainLength(),
        latestHash: updatedChain?.getLatestBlock().hash,
      },
    });
  } catch (error: any) {
    console.error("Error updating student:", error);
    res.status(500).json({
      error: "Failed to update student",
      details: error.message,
    });
  }
};

/**
 * deleteStudent() - Marks student as deleted
 *
 * DELETE /api/students/:id
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const chain = blockchainService.getStudent(id);
    if (!chain) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    // Add deletion block
    blockchainService.deleteStudent(id);

    res.json({
      success: true,
      message: "Student marked as deleted",
      data: {
        id,
        status: "deleted",
      },
    });
  } catch (error: any) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      error: "Failed to delete student",
      details: error.message,
    });
  }
};

/**
 * searchStudents() - Searches students by name or roll number
 *
 * GET /api/students/search?q=john
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const searchStudents = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: "Search query required",
      });
    }

    const searchTerm = (q as string).toLowerCase();

    // Get all students
    const chains = blockchainService.getAllStudents();

    // Filter by name or roll number
    const results = chains
      .map((chain) => {
        const state = chain.getCurrentState();
        return {
          id: chain.studentId,
          ...state,
          chainLength: chain.getChainLength(),
        };
      })
      .filter(
        (student) =>
          student.status === "active" &&
          student.name && // Check name exists
          (student.name.toLowerCase().includes(searchTerm) ||
            student.rollNumber?.toLowerCase().includes(searchTerm))
      );

    res.json({
      success: true,
      count: results.length,
      query: q,
      data: results,
    });
  } catch (error: any) {
    console.error("Error searching students:", error);
    res.status(500).json({
      error: "Failed to search students",
      details: error.message,
    });
  }
};

/**
 * validateStudent() - Validates student blockchain and full hierarchy
 *
 * GET /api/students/:id/validate
 *
 * WHY: Verify complete hierarchy
 * - Student chain integrity
 * - Student → Class link
 * - Class → Department link
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const validateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getStudent(id);
    if (!chain) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    // Run validation (includes full hierarchy check)
    const validationResult = validationService.validateStudentChain(id);

    res.json({
      success: true,
      data: validationResult,
    });
  } catch (error: any) {
    console.error("Error validating student:", error);
    res.status(500).json({
      error: "Failed to validate student",
      details: error.message,
    });
  }
};

/**
 * getStudentAttendance() - Gets student's attendance history
 *
 * GET /api/students/:id/attendance
 *
 * WHY: View complete attendance ledger
 * - All attendance records as blockchain
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chain = blockchainService.getStudent(id);
    if (!chain) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    // Get attendance history
    const history = chain.getAttendanceHistory();
    const stats = chain.getAttendanceStats();

    res.json({
      success: true,
      data: {
        studentId: id,
        studentName: chain.studentName,
        rollNumber: chain.rollNumber,
        stats,
        history,
      },
    });
  } catch (error: any) {
    console.error("Error getting student attendance:", error);
    res.status(500).json({
      error: "Failed to get student attendance",
      details: error.message,
    });
  }
};
