import { Router } from "express";
import { Request, Response } from "express";
import validationService from "../services/validationService";

/**
 * Validation Routes
 *
 * WHY: System-wide validation endpoints
 * - Verify blockchain integrity
 * - Check hierarchical links
 * - Detect tampering
 * - System health checks
 *
 * VALIDATION LEVELS:
 * 1. Individual chain validation
 * 2. Parent-child link validation
 * 3. Full system validation
 */

const router = Router();

/**
 * validateFullSystem() - Validates entire blockchain system
 *
 * GET /api/validate/system
 *
 * WHY: Complete system health check
 * - Validates all departments
 * - Validates all classes (and parent links)
 * - Validates all students (and parent links)
 * - Reports any issues
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const validateFullSystem = async (req: Request, res: Response) => {
  try {
    console.log("🔍 Starting full system validation...");

    const result = validationService.validateFullSystem();

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error validating system:", error);
    res.status(500).json({
      error: "Failed to validate system",
      details: error.message,
    });
  }
};

/**
 * @route   GET /api/validate/system
 * @desc    Validate entire blockchain system
 * @access  Public
 *
 * RETURNS:
 * - isValid: boolean
 * - summary: counts of valid/invalid chains
 * - invalidEntities: list of invalid chains
 * - details: array of validation results
 */
router.get("/system", validateFullSystem);

/**
 * @route   GET /api/validate/department/:id
 * @desc    Validate specific department chain
 * @access  Public
 * @param   id - Department ID
 *
 * NOTE: Individual entity validation is also available via:
 * - GET /api/departments/:id/validate
 * - GET /api/classes/:id/validate
 * - GET /api/students/:id/validate
 *
 * This route provides a centralized validation endpoint
 */
router.get("/department/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = validationService.validateDepartmentChain(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/validate/class/:id
 * @desc    Validate specific class chain and parent link
 * @access  Public
 * @param   id - Class ID
 */
router.get("/class/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = validationService.validateClassChain(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/validate/student/:id
 * @desc    Validate specific student chain and full hierarchy
 * @access  Public
 * @param   id - Student ID
 */
router.get("/student/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = validationService.validateStudentChain(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
