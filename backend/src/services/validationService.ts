import blockchainService from "./blockchainService";

/**
 * ValidationResult - Structure for validation responses
 */
export interface ValidationResult {
  isValid: boolean;
  entityType: "department" | "class" | "student" | "system";
  entityId?: string;
  entityName?: string;
  errors: string[];
  warnings: string[];
  details: {
    chainLength?: number;
    genesisValid?: boolean;
    chainIntegrity?: boolean;
    proofOfWork?: boolean;
    parentLink?: boolean;
  };
}

/**
 * ValidationService - Multi-level blockchain validation
 *
 * WHY WE NEED THIS:
 * - Verify blockchain integrity (no tampering)
 * - Check hierarchical links (dept → class → student)
 * - Validate Proof of Work for all blocks
 * - Detect any inconsistencies
 * - Required by assignment (5 marks for validation)
 *
 * WHAT IT VALIDATES:
 * 1. Individual chain integrity (hashes match)
 * 2. Proof of Work (hashes start with zeros)
 * 3. Parent-child links (genesis blocks link correctly)
 * 4. Complete system validation
 *
 * HOW IT WORKS:
 * - Uses blockchain validation methods
 * - Checks parent hash relationships
 * - Returns detailed validation results
 * - Reports all errors and warnings
 */
class ValidationService {
  /**
   * validateDepartmentChain() - Validates a single department chain
   *
   * WHY: Ensure department blockchain hasn't been tampered with
   *
   * WHAT IT CHECKS:
   * 1. Chain exists
   * 2. Genesis block is valid (prev_hash = '0')
   * 3. All blocks hash correctly
   * 4. All blocks link properly (prev_hash matches)
   * 5. All blocks satisfy PoW (start with required zeros)
   *
   * HOW IT WORKS:
   * - Get department chain from service
   * - Call isChainValid() method
   * - Check genesis block separately
   * - Compile detailed results
   *
   * @param departmentId - Department to validate
   * @returns ValidationResult with details
   */
  validateDepartmentChain(departmentId: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      entityType: "department",
      entityId: departmentId,
      errors: [],
      warnings: [],
      details: {},
    };

    try {
      // Get department chain
      const chain = blockchainService.getDepartment(departmentId);

      if (!chain) {
        result.isValid = false;
        result.errors.push("Department chain not found");
        return result;
      }

      result.entityName = chain.departmentName;
      result.details.chainLength = chain.getChainLength();

      // Check if chain has blocks
      if (chain.getChainLength() === 0) {
        result.isValid = false;
        result.errors.push("Chain is empty");
        return result;
      }

      // Validate genesis block
      const genesisBlock = chain.getBlock(0);
      if (!genesisBlock) {
        result.isValid = false;
        result.errors.push("Genesis block not found");
        return result;
      }

      // Department genesis should have prev_hash = '0'
      if (genesisBlock.prev_hash !== "0") {
        result.isValid = false;
        result.errors.push(
          `Genesis block has invalid prev_hash: ${genesisBlock.prev_hash} (should be '0')`
        );
      } else {
        result.details.genesisValid = true;
      }

      // Validate entire chain integrity
      const chainValid = chain.isChainValid();
      result.details.chainIntegrity = chainValid;

      if (!chainValid) {
        result.isValid = false;
        result.errors.push("Chain integrity check failed - tampering detected");
      }

      // Additional check: Verify PoW for all blocks
      const difficulty = 4; // Should match system difficulty
      const target = "0".repeat(difficulty);

      for (let i = 0; i < chain.getChainLength(); i++) {
        const block = chain.getBlock(i);
        if (block && !block.hash.startsWith(target)) {
          result.isValid = false;
          result.errors.push(
            `Block ${i} doesn't satisfy Proof of Work requirement`
          );
        }
      }

      if (result.errors.length === 0) {
        result.details.proofOfWork = true;
      }
    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * validateClassChain() - Validates class chain and parent link
   *
   * WHY: More complex - must verify link to department
   *
   * WHAT IT CHECKS:
   * 1. Everything from department validation
   * 2. PLUS: Genesis block links to parent department
   * 3. Parent department chain is valid
   * 4. Parent department exists
   *
   * HOW IT WORKS:
   * - Validate class chain itself
   * - Get parent department
   * - Verify genesis prev_hash matches parent's latest hash
   * - This is the hierarchical validation!
   *
   * @param classId - Class to validate
   * @returns ValidationResult with parent link details
   */
  validateClassChain(classId: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      entityType: "class",
      entityId: classId,
      errors: [],
      warnings: [],
      details: {},
    };

    try {
      // Get class chain
      const chain = blockchainService.getClass(classId);

      if (!chain) {
        result.isValid = false;
        result.errors.push("Class chain not found");
        return result;
      }

      result.entityName = chain.className;
      result.details.chainLength = chain.getChainLength();

      // Check if chain has blocks
      if (chain.getChainLength() === 0) {
        result.isValid = false;
        result.errors.push("Chain is empty");
        return result;
      }

      // Validate chain integrity
      const chainValid = chain.isChainValid();
      result.details.chainIntegrity = chainValid;

      if (!chainValid) {
        result.isValid = false;
        result.errors.push("Chain integrity check failed");
      }

      // Verify parent department exists
      const parentDept = blockchainService.getDepartment(chain.departmentId);
      if (!parentDept) {
        result.isValid = false;
        result.errors.push(`Parent department ${chain.departmentId} not found`);
        return result;
      }

      // CRITICAL: Validate parent link
      // Genesis block's prev_hash should match department's hash at time of creation
      const parentCurrentHash = parentDept.getLatestBlock().hash;
      const parentLinkValid = chain.validateParentLink(parentCurrentHash);
      result.details.parentLink = parentLinkValid;

      if (!parentLinkValid) {
        result.isValid = false;
        result.errors.push(
          "Parent link validation failed - class not properly linked to department"
        );
      }

      // Verify parent department is valid
      const parentValidation = this.validateDepartmentChain(chain.departmentId);
      if (!parentValidation.isValid) {
        result.isValid = false;
        result.errors.push("Parent department chain is invalid");
        result.warnings.push(
          "Class chain depends on invalid parent - hierarchy broken"
        );
      }

      // Verify PoW
      const difficulty = 4;
      const target = "0".repeat(difficulty);

      for (let i = 0; i < chain.getChainLength(); i++) {
        const block = chain.getBlock(i);
        if (block && !block.hash.startsWith(target)) {
          result.isValid = false;
          result.errors.push(`Block ${i} doesn't satisfy Proof of Work`);
        }
      }

      if (
        result.errors.filter((e) => e.includes("Proof of Work")).length === 0
      ) {
        result.details.proofOfWork = true;
      }
    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * validateStudentChain() - Validates student chain and full hierarchy
   *
   * WHY: Most complex - validates entire 3-layer hierarchy
   *
   * WHAT IT CHECKS:
   * 1. Student chain integrity
   * 2. Student → Class link
   * 3. Class → Department link (via validateClassChain)
   * 4. All attendance blocks
   *
   * HOW IT WORKS:
   * - Validate student chain
   * - Validate parent class (which validates department)
   * - Verify genesis prev_hash matches class
   * - Check all attendance blocks
   *
   * CASCADING VALIDATION:
   * Student valid ← Class valid ← Department valid
   * If ANY level fails, student is invalid!
   *
   * @param studentId - Student to validate
   * @returns ValidationResult with full hierarchy details
   */
  validateStudentChain(studentId: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      entityType: "student",
      entityId: studentId,
      errors: [],
      warnings: [],
      details: {},
    };

    try {
      // Get student chain
      const chain = blockchainService.getStudent(studentId);

      if (!chain) {
        result.isValid = false;
        result.errors.push("Student chain not found");
        return result;
      }

      result.entityName = `${chain.studentName} (${chain.rollNumber})`;
      result.details.chainLength = chain.getChainLength();

      // Check if chain has blocks
      if (chain.getChainLength() === 0) {
        result.isValid = false;
        result.errors.push("Chain is empty");
        return result;
      }

      // Validate chain integrity
      const chainValid = chain.isChainValid();
      result.details.chainIntegrity = chainValid;

      if (!chainValid) {
        result.isValid = false;
        result.errors.push("Chain integrity check failed");
      }

      // Verify parent class exists
      const parentClass = blockchainService.getClass(chain.classId);
      if (!parentClass) {
        result.isValid = false;
        result.errors.push(`Parent class ${chain.classId} not found`);
        return result;
      }

      // CRITICAL: Validate parent link to class
      const parentCurrentHash = parentClass.getLatestBlock().hash;
      const parentLinkValid = chain.validateParentLink(parentCurrentHash);
      result.details.parentLink = parentLinkValid;

      if (!parentLinkValid) {
        result.isValid = false;
        result.errors.push(
          "Parent link validation failed - student not properly linked to class"
        );
      }

      // CASCADE: Verify parent class is valid (which checks department)
      const classValidation = this.validateClassChain(chain.classId);
      if (!classValidation.isValid) {
        result.isValid = false;
        result.errors.push("Parent class chain is invalid");
        result.warnings.push(
          "Student chain depends on invalid parent - hierarchy broken"
        );
      }

      // Verify PoW for all blocks including attendance
      const difficulty = 4;
      const target = "0".repeat(difficulty);

      for (let i = 0; i < chain.getChainLength(); i++) {
        const block = chain.getBlock(i);
        if (block && !block.hash.startsWith(target)) {
          result.isValid = false;
          result.errors.push(`Block ${i} doesn't satisfy Proof of Work`);
        }
      }

      if (
        result.errors.filter((e) => e.includes("Proof of Work")).length === 0
      ) {
        result.details.proofOfWork = true;
      }

      // Count attendance blocks
      const attendanceHistory = chain.getAttendanceHistory();
      result.warnings.push(
        `${attendanceHistory.length} attendance records found`
      );
    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * validateFullSystem() - Validates entire blockchain system
   *
   * WHY: Assignment requires full system validation
   * - Check ALL chains at once
   * - Detect any inconsistencies
   * - Provide complete system health report
   *
   * WHAT IT CHECKS:
   * 1. All department chains
   * 2. All class chains (and their parent links)
   * 3. All student chains (and their parent links)
   * 4. Complete hierarchy integrity
   *
   * HOW IT WORKS:
   * - Iterate through all chains
   * - Validate each one
   * - Compile aggregate results
   * - Report overall system health
   *
   * RETURNS:
   * - Summary of all validations
   * - List of invalid chains
   * - System-wide statistics
   */
  validateFullSystem(): {
    isValid: boolean;
    summary: {
      totalDepartments: number;
      validDepartments: number;
      totalClasses: number;
      validClasses: number;
      totalStudents: number;
      validStudents: number;
    };
    invalidEntities: {
      departments: string[];
      classes: string[];
      students: string[];
    };
    details: ValidationResult[];
  } {
    const result = {
      isValid: true,
      summary: {
        totalDepartments: 0,
        validDepartments: 0,
        totalClasses: 0,
        validClasses: 0,
        totalStudents: 0,
        validStudents: 0,
      },
      invalidEntities: {
        departments: [] as string[],
        classes: [] as string[],
        students: [] as string[],
      },
      details: [] as ValidationResult[],
    };

    try {
      // Validate all departments
      const departments = blockchainService.getAllDepartments();
      result.summary.totalDepartments = departments.length;

      for (const dept of departments) {
        const validation = this.validateDepartmentChain(dept.departmentId);
        result.details.push(validation);

        if (validation.isValid) {
          result.summary.validDepartments++;
        } else {
          result.isValid = false;
          result.invalidEntities.departments.push(dept.departmentId);
        }
      }

      // Validate all classes
      const classes = blockchainService.getAllClasses();
      result.summary.totalClasses = classes.length;

      for (const cls of classes) {
        const validation = this.validateClassChain(cls.classId);
        result.details.push(validation);

        if (validation.isValid) {
          result.summary.validClasses++;
        } else {
          result.isValid = false;
          result.invalidEntities.classes.push(cls.classId);
        }
      }

      // Validate all students
      const students = blockchainService.getAllStudents();
      result.summary.totalStudents = students.length;

      for (const student of students) {
        const validation = this.validateStudentChain(student.studentId);
        result.details.push(validation);

        if (validation.isValid) {
          result.summary.validStudents++;
        } else {
          result.isValid = false;
          result.invalidEntities.students.push(student.studentId);
        }
      }

      console.log("✅ System validation complete");
      console.log(
        `   Departments: ${result.summary.validDepartments}/${result.summary.totalDepartments}`
      );
      console.log(
        `   Classes: ${result.summary.validClasses}/${result.summary.totalClasses}`
      );
      console.log(
        `   Students: ${result.summary.validStudents}/${result.summary.totalStudents}`
      );
    } catch (error: any) {
      console.error("❌ System validation error:", error);
      result.isValid = false;
    }

    return result;
  }

  /**
   * simulateTampering() - Testing function to demonstrate validation
   *
   * WHY: For demonstration purposes
   * - Shows what happens when chain is tampered
   * - Proves validation works
   * - Good for documentation/screenshots
   *
   * DANGER: Only use for testing!
   */
  simulateTampering(
    entityType: "department" | "class" | "student",
    entityId: string
  ): string {
    try {
      let chain: any;

      if (entityType === "department") {
        chain = blockchainService.getDepartment(entityId);
      } else if (entityType === "class") {
        chain = blockchainService.getClass(entityId);
      } else if (entityType === "student") {
        chain = blockchainService.getStudent(entityId);
      }

      if (!chain) {
        return "Entity not found";
      }

      // Tamper with a block (change transaction data)
      if (chain.getChainLength() > 1) {
        const block = chain.getBlock(1);
        block.transactions[0].data.tampered = true;
        return `Tampered with ${entityType} ${entityId} - validation should now fail`;
      }

      return "Not enough blocks to tamper";
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

// Export singleton instance
export default new ValidationService();
