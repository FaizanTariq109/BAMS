import { Request, Response } from "express";
import blockchainService from "../services/blockchainService";
import { formatDate, isValidDate } from "../utils/helpers";
import { AttendanceRecord } from "../models/blockchain/StudentChain";

/**
 * Attendance Controller
 *
 * WHY: This is the CORE feature of our blockchain system!
 * - Each attendance record becomes a blockchain block
 * - Once mined, attendance cannot be changed
 * - Creates immutable attendance history
 * - Prevents attendance fraud and tampering
 *
 * HOW IT WORKS:
 * 1. Admin marks attendance (Present/Absent/Leave)
 * 2. System creates attendance record
 * 3. Record becomes a block in student's personal chain
 * 4. Block is mined with Proof of Work
 * 5. Block is permanently added to blockchain
 *
 * BLOCKCHAIN ADVANTAGE:
 * - Can't retroactively change attendance
 * - Complete audit trail
 * - Cryptographically secured
 * - Student can prove their attendance
 * - School can verify integrity
 */

/**
 * markAttendance() - Marks attendance for student(s)
 *
 * POST /api/attendance/mark
 *
 * Body (single student):
 * {
 *   "studentId": "student_xyz",
 *   "status": "Present",
 *   "date": "2024-11-16"
 * }
 *
 * Body (bulk - multiple students):
 * {
 *   "attendanceRecords": [
 *     { "studentId": "student_1", "status": "Present", "date": "2024-11-16" },
 *     { "studentId": "student_2", "status": "Absent", "date": "2024-11-16" },
 *     { "studentId": "student_3", "status": "Leave", "date": "2024-11-16" }
 *   ]
 * }
 *
 * WHY: Core attendance marking functionality
 * - Single or bulk marking
 * - Each record becomes blockchain block
 * - Mining takes time (proof of work)
 *
 * WHAT IT DOES:
 * 1. Validate input
 * 2. Verify student exists
 * 3. Check for duplicate attendance on same date
 * 4. Create attendance record
 * 5. Add as block to student's chain (with mining)
 * 6. Save to storage
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, status, date, attendanceRecords } = req.body;

    // Check if bulk or single
    if (attendanceRecords && Array.isArray(attendanceRecords)) {
      // Bulk attendance marking
      return await markBulkAttendance(req, res);
    }

    // Single attendance marking
    // Validation
    if (!studentId || !status) {
      return res.status(400).json({
        error: "studentId and status are required",
      });
    }

    // Validate status
    if (!["Present", "Absent", "Leave"].includes(status)) {
      return res.status(400).json({
        error: "Status must be Present, Absent, or Leave",
      });
    }

    // Get student chain
    const studentChain = blockchainService.getStudent(studentId);
    if (!studentChain) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    // Check if student is active
    const studentState = studentChain.getCurrentState();
    if (studentState?.status === "deleted") {
      return res.status(400).json({
        error: "Cannot mark attendance for deleted student",
      });
    }

    // Parse and validate date
    const attendanceDate = date ? date : formatDate();
    if (!isValidDate(attendanceDate)) {
      return res.status(400).json({
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Check for duplicate attendance on same date
    const existingAttendance = studentChain.getAttendanceByDate(attendanceDate);
    if (existingAttendance) {
      return res.status(400).json({
        error: `Attendance already marked for ${attendanceDate}`,
        existing: existingAttendance,
      });
    }

    // Create attendance record
    const attendanceRecord: AttendanceRecord = {
      studentId: studentChain.studentId,
      studentName: studentChain.studentName,
      rollNumber: studentChain.rollNumber,
      classId: studentChain.classId,
      departmentId: studentChain.departmentId,
      date: attendanceDate,
      status: status as "Present" | "Absent" | "Leave",
      markedAt: Date.now(),
    };

    // Add attendance block to student's blockchain
    // This is where the magic happens - mining takes place!
    console.log(
      `⏳ Mining attendance block for ${studentChain.studentName}...`
    );
    blockchainService.markAttendance(studentId, attendanceRecord);

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        studentId,
        studentName: studentChain.studentName,
        rollNumber: studentChain.rollNumber,
        attendance: attendanceRecord,
        chainLength: studentChain.getChainLength(),
        latestHash: studentChain.getLatestBlock().hash,
      },
    });
  } catch (error: any) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      error: "Failed to mark attendance",
      details: error.message,
    });
  }
};

/**
 * markBulkAttendance() - Marks attendance for multiple students
 *
 * WHY: Efficient classroom attendance marking
 * - Mark entire class at once
 * - Each student gets their own block
 * - All blocks are mined
 *
 * @param req - Express request object
 * @param res - Express response object
 */
const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        error: "attendanceRecords must be a non-empty array",
      });
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process each attendance record
    for (const record of attendanceRecords) {
      try {
        const { studentId, status, date } = record;

        // Validate
        if (!studentId || !status) {
          errors.push({
            studentId,
            error: "Missing studentId or status",
          });
          continue;
        }

        if (!["Present", "Absent", "Leave"].includes(status)) {
          errors.push({
            studentId,
            error: "Invalid status",
          });
          continue;
        }

        // Get student
        const studentChain = blockchainService.getStudent(studentId);
        if (!studentChain) {
          errors.push({
            studentId,
            error: "Student not found",
          });
          continue;
        }

        // Check if active
        const studentState = studentChain.getCurrentState();
        if (studentState?.status === "deleted") {
          errors.push({
            studentId,
            error: "Student is deleted",
          });
          continue;
        }

        // Parse date
        const attendanceDate = date ? date : formatDate();
        if (!isValidDate(attendanceDate)) {
          errors.push({
            studentId,
            error: "Invalid date format",
          });
          continue;
        }

        // Check duplicate
        const existing = studentChain.getAttendanceByDate(attendanceDate);
        if (existing) {
          errors.push({
            studentId,
            error: `Attendance already marked for ${attendanceDate}`,
          });
          continue;
        }

        // Create and mark attendance
        const attendanceRecord: AttendanceRecord = {
          studentId: studentChain.studentId,
          studentName: studentChain.studentName,
          rollNumber: studentChain.rollNumber,
          classId: studentChain.classId,
          departmentId: studentChain.departmentId,
          date: attendanceDate,
          status: status as "Present" | "Absent" | "Leave",
          markedAt: Date.now(),
        };

        console.log(`⏳ Mining block for ${studentChain.studentName}...`);
        blockchainService.markAttendance(studentId, attendanceRecord);

        results.push({
          studentId,
          studentName: studentChain.studentName,
          rollNumber: studentChain.rollNumber,
          status,
          date: attendanceDate,
        });
      } catch (err: any) {
        errors.push({
          studentId: record.studentId,
          error: err.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Bulk attendance marking completed",
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors,
      },
    });
  } catch (error: any) {
    console.error("Error in bulk attendance marking:", error);
    res.status(500).json({
      error: "Failed to mark bulk attendance",
      details: error.message,
    });
  }
};

/**
 * getAttendanceByStudent() - Gets student's attendance history
 *
 * GET /api/attendance/student/:studentId
 *
 * WHY: View complete attendance ledger
 * - All attendance blocks in chronological order
 * - Includes statistics
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAttendanceByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const studentChain = blockchainService.getStudent(studentId);
    if (!studentChain) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    const history = studentChain.getAttendanceHistory();
    const stats = studentChain.getAttendanceStats();

    res.json({
      success: true,
      data: {
        studentId,
        studentName: studentChain.studentName,
        rollNumber: studentChain.rollNumber,
        stats,
        history,
        chainLength: studentChain.getChainLength(),
      },
    });
  } catch (error: any) {
    console.error("Error getting student attendance:", error);
    res.status(500).json({
      error: "Failed to retrieve attendance",
      details: error.message,
    });
  }
};

/**
 * getAttendanceByClass() - Gets attendance for entire class
 *
 * GET /api/attendance/class/:classId?date=2024-11-16
 *
 * WHY: View class attendance for specific date
 * - Useful for daily attendance view
 * - See which students were present/absent
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAttendanceByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    // Verify class exists
    const classChain = blockchainService.getClass(classId);
    if (!classChain) {
      return res.status(404).json({
        error: "Class not found",
      });
    }

    // Parse date
    const attendanceDate = date ? (date as string) : formatDate();
    if (!isValidDate(attendanceDate)) {
      return res.status(400).json({
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Get all students in class
    const students = blockchainService.getStudentsByClass(classId);

    // Get attendance for each student on this date
    const attendanceRecords = students
      .map((studentChain) => {
        const attendance = studentChain.getAttendanceByDate(attendanceDate);
        const state = studentChain.getCurrentState();

        return {
          studentId: studentChain.studentId,
          studentName: studentChain.studentName,
          rollNumber: studentChain.rollNumber,
          status: state?.status,
          attendance: attendance || null,
        };
      })
      .filter((record) => record.status === "active"); // Only active students

    // Calculate summary
    const summary = {
      total: attendanceRecords.length,
      marked: attendanceRecords.filter((r) => r.attendance !== null).length,
      unmarked: attendanceRecords.filter((r) => r.attendance === null).length,
      present: attendanceRecords.filter(
        (r) => r.attendance?.status === "Present"
      ).length,
      absent: attendanceRecords.filter((r) => r.attendance?.status === "Absent")
        .length,
      leave: attendanceRecords.filter((r) => r.attendance?.status === "Leave")
        .length,
    };

    res.json({
      success: true,
      data: {
        classId,
        className: classChain.className,
        date: attendanceDate,
        summary,
        records: attendanceRecords,
      },
    });
  } catch (error: any) {
    console.error("Error getting class attendance:", error);
    res.status(500).json({
      error: "Failed to retrieve class attendance",
      details: error.message,
    });
  }
};

/**
 * getAttendanceByDepartment() - Gets attendance for entire department
 *
 * GET /api/attendance/department/:departmentId?date=2024-11-16
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAttendanceByDepartment = async (
  req: Request,
  res: Response
) => {
  try {
    const { departmentId } = req.params;
    const { date } = req.query;

    // Verify department exists
    const deptChain = blockchainService.getDepartment(departmentId);
    if (!deptChain) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    // Parse date
    const attendanceDate = date ? (date as string) : formatDate();
    if (!isValidDate(attendanceDate)) {
      return res.status(400).json({
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Get all students in department
    const students = blockchainService.getStudentsByDepartment(departmentId);

    // Get attendance for each student
    const attendanceRecords = students
      .map((studentChain) => {
        const attendance = studentChain.getAttendanceByDate(attendanceDate);
        const state = studentChain.getCurrentState();

        return {
          studentId: studentChain.studentId,
          studentName: studentChain.studentName,
          rollNumber: studentChain.rollNumber,
          classId: studentChain.classId,
          status: state?.status,
          attendance: attendance || null,
        };
      })
      .filter((record) => record.status === "active");

    // Calculate summary
    const summary = {
      total: attendanceRecords.length,
      marked: attendanceRecords.filter((r) => r.attendance !== null).length,
      unmarked: attendanceRecords.filter((r) => r.attendance === null).length,
      present: attendanceRecords.filter(
        (r) => r.attendance?.status === "Present"
      ).length,
      absent: attendanceRecords.filter((r) => r.attendance?.status === "Absent")
        .length,
      leave: attendanceRecords.filter((r) => r.attendance?.status === "Leave")
        .length,
    };

    res.json({
      success: true,
      data: {
        departmentId,
        departmentName: deptChain.departmentName,
        date: attendanceDate,
        summary,
        records: attendanceRecords,
      },
    });
  } catch (error: any) {
    console.error("Error getting department attendance:", error);
    res.status(500).json({
      error: "Failed to retrieve department attendance",
      details: error.message,
    });
  }
};

/**
 * getTodayAttendance() - Gets today's attendance across system
 *
 * GET /api/attendance/today
 *
 * WHY: Quick overview of today's attendance
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const today = formatDate();

    // Get all students
    const students = blockchainService.getAllStudents();

    // Get today's attendance for each
    const attendanceRecords = students
      .map((studentChain) => {
        const attendance = studentChain.getAttendanceByDate(today);
        const state = studentChain.getCurrentState();

        return {
          studentId: studentChain.studentId,
          studentName: studentChain.studentName,
          rollNumber: studentChain.rollNumber,
          classId: studentChain.classId,
          departmentId: studentChain.departmentId,
          status: state?.status,
          attendance: attendance || null,
        };
      })
      .filter((record) => record.status === "active");

    // Calculate summary
    const summary = {
      date: today,
      total: attendanceRecords.length,
      marked: attendanceRecords.filter((r) => r.attendance !== null).length,
      unmarked: attendanceRecords.filter((r) => r.attendance === null).length,
      present: attendanceRecords.filter(
        (r) => r.attendance?.status === "Present"
      ).length,
      absent: attendanceRecords.filter((r) => r.attendance?.status === "Absent")
        .length,
      leave: attendanceRecords.filter((r) => r.attendance?.status === "Leave")
        .length,
    };

    res.json({
      success: true,
      data: {
        summary,
        records: attendanceRecords,
      },
    });
  } catch (error: any) {
    console.error("Error getting today's attendance:", error);
    res.status(500).json({
      error: "Failed to retrieve today's attendance",
      details: error.message,
    });
  }
};
