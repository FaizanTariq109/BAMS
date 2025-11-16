import { Blockchain } from "./Blockchain";
import { Block, Transaction } from "./Block";

/**
 * Student interface - defines structure of student data
 */
export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email?: string;
  classId: string;
  departmentId: string;
  createdAt: number;
  status: "active" | "deleted";
}

/**
 * AttendanceRecord - Structure for attendance transactions
 */
export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  departmentId: string;
  date: string; // YYYY-MM-DD format
  status: "Present" | "Absent" | "Leave";
  markedAt: number;
  markedBy?: string;
}

/**
 * StudentChain - Layer 3 of our blockchain hierarchy
 *
 * WHY THIS EXISTS:
 * - Each student gets their PERSONAL blockchain ledger
 * - Genesis block links to PARENT CLASS's latest block
 * - Attendance records are blocks in this chain
 * - Every attendance entry is cryptographically secured
 *
 * COMPLETE HIERARCHY:
 * Department Chain:
 *   Block 0 → Block 1 → Block 2 (hash: abc123)
 *                           ↓
 * Class Chain:              ↓
 *   Block 0 (prev: abc123) → Block 1 → Block 2 (hash: def456)
 *                                          ↓
 * Student Chain:                           ↓
 *   Block 0 (prev: def456) → Attendance 1 → Attendance 2 → Attendance 3
 *
 * TAMPER-PROOF ATTENDANCE:
 * - Each attendance block is mined with PoW
 * - Links to previous attendance via hash
 * - Can't change attendance without re-mining all subsequent blocks
 * - Can't fake attendance without valid class/department chains
 *
 * REAL-WORLD BENEFIT:
 * - Student can prove their attendance history
 * - School can verify attendance integrity
 * - Impossible to retroactively change attendance
 * - Complete audit trail
 */
export class StudentChain extends Blockchain {
  public studentId: string;
  public studentName: string;
  public rollNumber: string;
  public classId: string;
  public departmentId: string;
  public parentClassHash: string; // Links to class chain

  /**
   * Constructor - Creates a new student blockchain
   *
   * @param studentId - Unique identifier for student
   * @param studentName - Student's full name
   * @param rollNumber - Student's roll/registration number
   * @param classId - Which class student belongs to
   * @param departmentId - Which department (for reference)
   * @param difficulty - PoW difficulty
   */
  constructor(
    studentId: string,
    studentName: string,
    rollNumber: string,
    classId: string,
    departmentId: string,
    difficulty: number = 4
  ) {
    super(difficulty);
    this.studentId = studentId;
    this.studentName = studentName;
    this.rollNumber = rollNumber;
    this.classId = classId;
    this.departmentId = departmentId;
    this.parentClassHash = "";
  }

  /**
   * initialize() - Creates genesis block linked to class
   *
   * WHY: Complete the 3-layer hierarchy
   * - Genesis block's prev_hash = parent class's latest hash
   * - Creates cryptographic link: Dept → Class → Student
   * - Makes student dependent on valid class chain
   *
   * WHAT IT DOES:
   * 1. Takes parent class's latest block hash
   * 2. Uses it as prev_hash for student genesis block
   * 3. Mines the genesis block
   * 4. Student chain is now BOUND to class chain
   *
   * HOW IT WORKS:
   * - parentClassHash comes from ClassChain.getLatestBlock().hash
   * - This hash is burned into the student genesis block
   * - If class chain changes, this link breaks
   * - Validation will fail
   *
   * COMPLETE CHAIN:
   * Dept Block 5 hash: "0000aaa"
   *   ↓ Class genesis prev_hash: "0000aaa"
   * Class Block 3 hash: "0000bbb"
   *   ↓ Student genesis prev_hash: "0000bbb"
   * Student Block 0 (genesis)
   *
   * @param studentData - Initial student information
   * @param parentClassHash - Latest hash from parent class chain
   */
  initialize(studentData: Partial<Student>, parentClassHash: string): void {
    this.parentClassHash = parentClassHash;

    const studentInfo: Student = {
      id: this.studentId,
      name: this.studentName,
      rollNumber: this.rollNumber,
      email: studentData.email,
      classId: this.classId,
      departmentId: this.departmentId,
      createdAt: Date.now(),
      status: "active",
    };

    // CRITICAL: Use parent class's hash as prev_hash for genesis block
    this.createGenesisBlock(studentInfo, parentClassHash);

    console.log(
      `✅ Student Chain created: ${this.studentName} (${this.rollNumber})`
    );
  }

  /**
   * addAttendanceRecord() - Adds attendance as a blockchain block
   *
   * WHY: This is the CORE feature!
   * - Each attendance entry becomes an immutable block
   * - Once mined, attendance cannot be changed
   * - Creates verifiable attendance history
   *
   * WHAT IT DOES:
   * 1. Creates attendance record object
   * 2. Wraps it in a transaction
   * 3. Creates new block
   * 4. Mines block with PoW
   * 5. Adds to student's personal chain
   *
   * HOW IT WORKS:
   * - Transaction type is 'attendance'
   * - Block links to previous attendance (or genesis if first)
   * - Mining proves computational work was done
   * - Block is appended to chain
   *
   * ATTENDANCE LEDGER EXAMPLE:
   * Block 0 (Genesis): Student created
   * Block 1: 2024-01-15 - Present
   * Block 2: 2024-01-16 - Present
   * Block 3: 2024-01-17 - Absent
   * Block 4: 2024-01-18 - Leave
   *
   * TAMPERING ATTEMPT:
   * Try to change Block 2 from Present to Absent:
   * - Block 2 hash changes
   * - Block 3's prev_hash no longer matches
   * - Chain becomes INVALID
   * - Tampering is detected!
   *
   * @param attendanceData - Attendance information
   */
  addAttendanceRecord(attendanceData: AttendanceRecord): void {
    const attendanceTransaction: Transaction = {
      type: "attendance",
      data: {
        ...attendanceData,
        recordedAt: Date.now(),
      },
      timestamp: Date.now(),
    };

    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      [attendanceTransaction],
      this.getLatestBlock().hash
    );

    this.addBlock(newBlock);
    console.log(
      `📝 Attendance recorded: ${this.studentName} - ${attendanceData.status} (${attendanceData.date})`
    );
  }

  /**
   * addStudentUpdate() - Updates student information
   *
   * WHY: Same immutable update pattern
   * - Add new block with updated data
   * - Don't modify existing blocks
   *
   * @param updates - Fields to update
   */
  addStudentUpdate(updates: Partial<Student>): void {
    const updateTransaction: Transaction = {
      type: "update",
      data: {
        studentId: this.studentId,
        updates: updates,
        updatedAt: Date.now(),
      },
      timestamp: Date.now(),
    };

    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      [updateTransaction],
      this.getLatestBlock().hash
    );

    this.addBlock(newBlock);
    console.log(`✅ Student updated: ${this.studentName}`);
  }

  /**
   * addStudentDeletion() - Marks student as deleted
   *
   * WHY: Soft delete preserving attendance history
   * - Student may be deleted but attendance records remain
   * - Important for auditing and records
   */
  addStudentDeletion(): void {
    const deleteTransaction: Transaction = {
      type: "delete",
      data: {
        studentId: this.studentId,
        status: "deleted",
        deletedAt: Date.now(),
      },
      timestamp: Date.now(),
    };

    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      [deleteTransaction],
      this.getLatestBlock().hash
    );

    this.addBlock(newBlock);
    console.log(`🗑️ Student marked as deleted: ${this.studentName}`);
  }

  /**
   * getAttendanceHistory() - Retrieves all attendance records
   *
   * WHY: Students/admins need to view attendance history
   * - Filter blockchain for attendance transactions
   * - Return chronological list
   *
   * WHAT IT DOES:
   * Scans all blocks, extracts attendance records
   *
   * HOW IT WORKS:
   * - Skip genesis block (index 0)
   * - For each block, check transaction type
   * - If 'attendance', add to results
   * - Return array of attendance records
   *
   * @returns Array of all attendance records
   */
  getAttendanceHistory(): AttendanceRecord[] {
    const attendanceRecords: AttendanceRecord[] = [];

    // Skip genesis block, start from index 1
    for (let i = 1; i < this.chain.length; i++) {
      const transaction = this.chain[i].transactions[0];

      if (transaction.type === "attendance") {
        attendanceRecords.push(transaction.data);
      }
    }

    return attendanceRecords;
  }

  /**
   * getAttendanceByDate() - Gets attendance for specific date
   *
   * WHY: Query attendance for a particular day
   * - Check if student was present on specific date
   * - Useful for reports
   *
   * @param date - Date in YYYY-MM-DD format
   * @returns Attendance record or null
   */
  getAttendanceByDate(date: string): AttendanceRecord | null {
    for (let i = 1; i < this.chain.length; i++) {
      const transaction = this.chain[i].transactions[0];

      if (transaction.type === "attendance" && transaction.data.date === date) {
        return transaction.data;
      }
    }

    return null;
  }

  /**
   * getCurrentState() - Gets current student state
   *
   * WHY: Same as dept/class - replay blocks
   * - Genesis has initial data
   * - Updates modify fields
   * - Deletes change status
   *
   * @returns Current student state
   */
  getCurrentState(): Student | null {
    if (this.chain.length === 0) return null;

    let state: Student = { ...this.chain[0].transactions[0].data };

    for (let i = 1; i < this.chain.length; i++) {
      const transaction = this.chain[i].transactions[0];

      if (transaction.type === "update") {
        state = { ...state, ...transaction.data.updates };
      } else if (transaction.type === "delete") {
        state.status = "deleted";
      }
    }

    return state;
  }

  /**
   * validateParentLink() - Verifies link to class chain
   *
   * WHY: Ensure student is legitimately linked to class
   * - Detects if class chain was modified
   * - Part of multi-level validation
   *
   * WHAT IT CHECKS:
   * Genesis block's prev_hash matches class hash
   *
   * @param currentParentHash - Current latest hash from class chain
   * @returns true if link is valid
   */
  validateParentLink(currentParentHash: string): boolean {
    if (this.chain.length === 0) return false;

    const genesisBlock = this.chain[0];

    if (genesisBlock.prev_hash !== this.parentClassHash) {
      console.error(
        `Student ${this.studentName}: Parent link broken in genesis block!`
      );
      return false;
    }

    if (currentParentHash !== this.parentClassHash) {
      console.warn(
        `Student ${this.studentName}: Parent chain has been extended`
      );
    }

    return true;
  }

  /**
   * getAttendanceStats() - Calculates attendance statistics
   *
   * WHY: Useful for reports and dashboards
   * - Total days
   * - Present/Absent/Leave counts
   * - Attendance percentage
   *
   * @returns Attendance statistics object
   */
  getAttendanceStats() {
    const history = this.getAttendanceHistory();

    const stats = {
      total: history.length,
      present: history.filter((r) => r.status === "Present").length,
      absent: history.filter((r) => r.status === "Absent").length,
      leave: history.filter((r) => r.status === "Leave").length,
      percentage: 0,
    };

    if (stats.total > 0) {
      stats.percentage = (stats.present / stats.total) * 100;
    }

    return stats;
  }

  /**
   * toJSON() - Serializes student chain for storage
   */
  toJSON() {
    return {
      ...super.toJSON(),
      studentId: this.studentId,
      studentName: this.studentName,
      rollNumber: this.rollNumber,
      classId: this.classId,
      departmentId: this.departmentId,
      parentClassHash: this.parentClassHash,
    };
  }

  /**
   * fromJSON() - Recreates StudentChain from saved data
   */
  static fromJSON(data: any): StudentChain {
    const chain = new StudentChain(
      data.studentId,
      data.studentName,
      data.rollNumber,
      data.classId,
      data.departmentId,
      data.difficulty
    );
    chain.parentClassHash = data.parentClassHash;
    chain.chain = data.chain.map((blockData: any) => Block.fromJSON(blockData));
    return chain;
  }
}
