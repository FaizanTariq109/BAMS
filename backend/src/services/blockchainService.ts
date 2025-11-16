import {
  DepartmentChain,
  Department,
} from "../models/blockchain/DepartmentChain";
import { ClassChain, Class } from "../models/blockchain/ClassChain";
import {
  StudentChain,
  Student,
  AttendanceRecord,
} from "../models/blockchain/StudentChain";
import storageService from "./storageService";

/**
 * BlockchainService - Central manager for all blockchain operations
 *
 * WHY WE NEED THIS:
 * - Single source of truth for all blockchain data
 * - Manages in-memory blockchain instances
 * - Handles loading/saving from storage
 * - Provides high-level blockchain operations
 * - Used by all controllers
 *
 * ARCHITECTURE:
 * Controllers → BlockchainService → Blockchain Classes → Storage
 *
 * IN-MEMORY DESIGN:
 * - All blockchains loaded into memory on startup
 * - Operations happen in memory (fast)
 * - Changes saved to JSON files (persistent)
 * - For production, consider database + caching
 *
 * WHY IN-MEMORY:
 * - Fast access (no disk I/O per operation)
 * - Simple for demo/assignment purposes
 * - Easy to reason about
 * - Good for 100s of students (not millions)
 */
class BlockchainService {
  // In-memory storage of all blockchains
  private departmentChains: Map<string, DepartmentChain> = new Map();
  private classChains: Map<string, ClassChain> = new Map();
  private studentChains: Map<string, StudentChain> = new Map();

  private difficulty: number;
  private initialized: boolean = false;

  constructor() {
    this.difficulty = parseInt(process.env.DIFFICULTY || "4");
  }

  /**
   * initialize() - Loads all blockchains from storage
   *
   * WHY: Server needs to restore state on startup
   * - Blockchains persist in JSON files
   * - Need to load them into memory
   * - Recreate blockchain objects with methods
   *
   * WHAT IT DOES:
   * 1. Load department chains from JSON
   * 2. Load class chains from JSON
   * 3. Load student chains from JSON
   * 4. Recreate blockchain instances
   * 5. Store in memory (Maps)
   *
   * HOW IT WORKS:
   * - Read JSON files via storageService
   * - Use fromJSON() methods to recreate objects
   * - Store in Map for fast lookup by ID
   *
   * WHEN CALLED:
   * - Server startup
   * - After clearing data
   * - After importing data
   */
  async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing blockchain service...");

      // Load departments
      const deptData = storageService.getDepartments();
      deptData.forEach((data: any) => {
        const chain = DepartmentChain.fromJSON(data);
        this.departmentChains.set(data.departmentId, chain);
      });
      console.log(`✅ Loaded ${deptData.length} department chains`);

      // Load classes
      const classData = storageService.getClasses();
      classData.forEach((data: any) => {
        const chain = ClassChain.fromJSON(data);
        this.classChains.set(data.classId, chain);
      });
      console.log(`✅ Loaded ${classData.length} class chains`);

      // Load students
      const studentData = storageService.getStudents();
      studentData.forEach((data: any) => {
        const chain = StudentChain.fromJSON(data);
        this.studentChains.set(data.studentId, chain);
      });
      console.log(`✅ Loaded ${studentData.length} student chains`);

      this.initialized = true;
      console.log("✅ Blockchain service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize blockchain service:", error);
      throw error;
    }
  }

  /**
   * saveAll() - Persists all blockchains to storage
   *
   * WHY: Keep JSON files in sync with memory
   * - Called after any blockchain modification
   * - Ensures data isn't lost on server crash
   *
   * WHAT IT DOES:
   * Convert all in-memory chains to JSON and save
   *
   * HOW IT WORKS:
   * - Iterate through Maps
   * - Call toJSON() on each chain
   * - Write arrays to JSON files
   */
  private saveAll(): void {
    try {
      // Save departments
      const deptArray = Array.from(this.departmentChains.values()).map(
        (chain) => chain.toJSON()
      );
      storageService.saveDepartments(deptArray);

      // Save classes
      const classArray = Array.from(this.classChains.values()).map((chain) =>
        chain.toJSON()
      );
      storageService.saveClasses(classArray);

      // Save students
      const studentArray = Array.from(this.studentChains.values()).map(
        (chain) => chain.toJSON()
      );
      storageService.saveStudents(studentArray);

      console.log("💾 All blockchains saved to storage");
    } catch (error) {
      console.error("❌ Failed to save blockchains:", error);
      throw error;
    }
  }

  /**
   * DEPARTMENT OPERATIONS
   */

  /**
   * createDepartment() - Creates new department blockchain
   *
   * WHY: Each department needs its own chain
   *
   * WHAT IT DOES:
   * 1. Create new DepartmentChain instance
   * 2. Initialize with genesis block
   * 3. Store in memory
   * 4. Save to storage
   *
   * @param id - Unique department ID
   * @param name - Department name
   * @param data - Additional department data
   * @returns Created department chain
   */
  createDepartment(
    id: string,
    name: string,
    data: Partial<Department>
  ): DepartmentChain {
    if (this.departmentChains.has(id)) {
      throw new Error(`Department ${id} already exists`);
    }

    const chain = new DepartmentChain(id, name, this.difficulty);
    chain.initialize(data);

    this.departmentChains.set(id, chain);
    this.saveAll();

    return chain;
  }

  /**
   * getDepartment() - Retrieves department chain
   */
  getDepartment(id: string): DepartmentChain | undefined {
    return this.departmentChains.get(id);
  }

  /**
   * getAllDepartments() - Gets all department chains
   */
  getAllDepartments(): DepartmentChain[] {
    return Array.from(this.departmentChains.values());
  }

  /**
   * updateDepartment() - Adds update block to department chain
   */
  updateDepartment(id: string, updates: Partial<Department>): void {
    const chain = this.departmentChains.get(id);
    if (!chain) {
      throw new Error(`Department ${id} not found`);
    }

    chain.addDepartmentUpdate(updates);
    this.saveAll();
  }

  /**
   * deleteDepartment() - Marks department as deleted
   */
  deleteDepartment(id: string): void {
    const chain = this.departmentChains.get(id);
    if (!chain) {
      throw new Error(`Department ${id} not found`);
    }

    chain.addDepartmentDeletion();
    this.saveAll();
  }

  /**
   * CLASS OPERATIONS
   */

  /**
   * createClass() - Creates new class blockchain linked to department
   *
   * WHY: Classes must link to parent department
   *
   * WHAT IT DOES:
   * 1. Verify parent department exists
   * 2. Get department's latest block hash
   * 3. Create ClassChain with that hash as genesis prev_hash
   * 4. Store and save
   *
   * @param id - Unique class ID
   * @param name - Class name
   * @param departmentId - Parent department ID
   * @param data - Additional class data
   * @returns Created class chain
   */
  createClass(
    id: string,
    name: string,
    departmentId: string,
    data: Partial<Class>
  ): ClassChain {
    if (this.classChains.has(id)) {
      throw new Error(`Class ${id} already exists`);
    }

    // Verify parent department exists
    const parentDept = this.departmentChains.get(departmentId);
    if (!parentDept) {
      throw new Error(`Parent department ${departmentId} not found`);
    }

    // Get parent's latest hash for linking
    const parentHash = parentDept.getLatestBlock().hash;

    // Create and initialize class chain
    const chain = new ClassChain(id, name, departmentId, this.difficulty);
    chain.initialize(data, parentHash);

    this.classChains.set(id, chain);
    this.saveAll();

    return chain;
  }

  /**
   * getClass() - Retrieves class chain
   */
  getClass(id: string): ClassChain | undefined {
    return this.classChains.get(id);
  }

  /**
   * getAllClasses() - Gets all class chains
   */
  getAllClasses(): ClassChain[] {
    return Array.from(this.classChains.values());
  }

  /**
   * getClassesByDepartment() - Filters classes by department
   */
  getClassesByDepartment(departmentId: string): ClassChain[] {
    return Array.from(this.classChains.values()).filter(
      (chain) => chain.departmentId === departmentId
    );
  }

  /**
   * updateClass() - Adds update block to class chain
   */
  updateClass(id: string, updates: Partial<Class>): void {
    const chain = this.classChains.get(id);
    if (!chain) {
      throw new Error(`Class ${id} not found`);
    }

    chain.addClassUpdate(updates);
    this.saveAll();
  }

  /**
   * deleteClass() - Marks class as deleted
   */
  deleteClass(id: string): void {
    const chain = this.classChains.get(id);
    if (!chain) {
      throw new Error(`Class ${id} not found`);
    }

    chain.addClassDeletion();
    this.saveAll();
  }

  /**
   * STUDENT OPERATIONS
   */

  /**
   * createStudent() - Creates new student blockchain linked to class
   *
   * WHY: Students link to parent class (which links to department)
   *
   * WHAT IT DOES:
   * 1. Verify parent class exists
   * 2. Get class's latest block hash
   * 3. Create StudentChain with that hash as genesis prev_hash
   * 4. Store and save
   *
   * This completes the 3-layer hierarchy!
   */
  createStudent(
    id: string,
    name: string,
    rollNumber: string,
    classId: string,
    departmentId: string,
    data: Partial<Student>
  ): StudentChain {
    if (this.studentChains.has(id)) {
      throw new Error(`Student ${id} already exists`);
    }

    // Verify parent class exists
    const parentClass = this.classChains.get(classId);
    if (!parentClass) {
      throw new Error(`Parent class ${classId} not found`);
    }

    // Get parent's latest hash for linking
    const parentHash = parentClass.getLatestBlock().hash;

    // Create and initialize student chain
    const chain = new StudentChain(
      id,
      name,
      rollNumber,
      classId,
      departmentId,
      this.difficulty
    );
    chain.initialize(data, parentHash);

    this.studentChains.set(id, chain);
    this.saveAll();

    return chain;
  }

  /**
   * getStudent() - Retrieves student chain
   */
  getStudent(id: string): StudentChain | undefined {
    return this.studentChains.get(id);
  }

  /**
   * getAllStudents() - Gets all student chains
   */
  getAllStudents(): StudentChain[] {
    return Array.from(this.studentChains.values());
  }

  /**
   * getStudentsByClass() - Filters students by class
   */
  getStudentsByClass(classId: string): StudentChain[] {
    return Array.from(this.studentChains.values()).filter(
      (chain) => chain.classId === classId
    );
  }

  /**
   * getStudentsByDepartment() - Filters students by department
   */
  getStudentsByDepartment(departmentId: string): StudentChain[] {
    return Array.from(this.studentChains.values()).filter(
      (chain) => chain.departmentId === departmentId
    );
  }

  /**
   * updateStudent() - Adds update block to student chain
   */
  updateStudent(id: string, updates: Partial<Student>): void {
    const chain = this.studentChains.get(id);
    if (!chain) {
      throw new Error(`Student ${id} not found`);
    }

    chain.addStudentUpdate(updates);
    this.saveAll();
  }

  /**
   * deleteStudent() - Marks student as deleted
   */
  deleteStudent(id: string): void {
    const chain = this.studentChains.get(id);
    if (!chain) {
      throw new Error(`Student ${id} not found`);
    }

    chain.addStudentDeletion();
    this.saveAll();
  }

  /**
   * ATTENDANCE OPERATIONS
   */

  /**
   * markAttendance() - Adds attendance block to student chain
   *
   * WHY: Core feature - attendance as blockchain
   *
   * WHAT IT DOES:
   * Adds new block to student's personal chain containing attendance data
   */
  markAttendance(studentId: string, attendanceData: AttendanceRecord): void {
    const chain = this.studentChains.get(studentId);
    if (!chain) {
      throw new Error(`Student ${studentId} not found`);
    }

    chain.addAttendanceRecord(attendanceData);
    this.saveAll();
  }

  /**
   * getStudentAttendance() - Gets student's full attendance history
   */
  getStudentAttendance(studentId: string): AttendanceRecord[] {
    const chain = this.studentChains.get(studentId);
    if (!chain) {
      throw new Error(`Student ${studentId} not found`);
    }

    return chain.getAttendanceHistory();
  }

  /**
   * isInitialized() - Checks if service is ready
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export default new BlockchainService();
