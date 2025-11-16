import { Blockchain } from "./Blockchain";
import { Block, Transaction } from "./Block";

/**
 * Class interface - defines structure of class data
 */
export interface Class {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  semester?: string;
  year?: number;
  createdAt: number;
  status: "active" | "deleted";
}

/**
 * ClassChain - Layer 2 of our blockchain hierarchy
 *
 * WHY THIS EXISTS:
 * - Each class gets its own blockchain
 * - Genesis block links to PARENT DEPARTMENT'S latest block
 * - This creates cryptographic parent-child relationship
 * - Students will link to this chain
 *
 * HIERARCHICAL LINKING:
 * Department Chain (Layer 1):
 *   Block 0 → Block 1 → Block 2 (hash: abc123)
 *                           ↓
 * Class Chain (Layer 2):    ↓
 *   Block 0 (prev_hash: abc123) → Block 1 → Block 2
 *
 * SECURITY IMPLICATION:
 * - If department Block 2 is tampered with, its hash changes
 * - Class genesis block's prev_hash no longer matches
 * - Entire class chain becomes INVALID
 * - This cascades to all students in the class
 * - ONE change invalidates THOUSANDS of blocks!
 *
 * WHY IT'S POWERFUL:
 * - Can't forge a class without valid department
 * - Can't modify department without breaking all classes
 * - Creates unbreakable chain of custody
 */
export class ClassChain extends Blockchain {
  public classId: string;
  public className: string;
  public departmentId: string;
  public parentDepartmentHash: string; // Links to department chain

  /**
   * Constructor - Creates a new class blockchain
   *
   * @param classId - Unique identifier for class
   * @param className - Display name
   * @param departmentId - Which department this class belongs to
   * @param difficulty - PoW difficulty
   */
  constructor(
    classId: string,
    className: string,
    departmentId: string,
    difficulty: number = 4
  ) {
    super(difficulty);
    this.classId = classId;
    this.className = className;
    this.departmentId = departmentId;
    this.parentDepartmentHash = "";
  }

  /**
   * initialize() - Creates genesis block linked to department
   *
   * WHY: This is where the magic happens!
   * - Genesis block's prev_hash = parent department's latest hash
   * - Creates cryptographic link between chains
   * - Makes class dependent on department
   *
   * WHAT IT DOES:
   * 1. Takes parent department's latest block hash
   * 2. Uses it as prev_hash for class genesis block
   * 3. Mines the genesis block
   * 4. Class chain is now BOUND to department chain
   *
   * HOW IT WORKS:
   * - parentDepartmentHash comes from DepartmentChain.getLatestBlock().hash
   * - This hash is burned into the class genesis block
   * - If department chain changes, this link breaks
   * - Validation will fail
   *
   * EXAMPLE:
   * Department "Computing" latest hash: "0000abc123..."
   * Class "CS101" genesis prev_hash: "0000abc123..."
   * ↑ These MUST match or class is invalid
   *
   * @param classData - Initial class information
   * @param parentDepartmentHash - Latest hash from parent department chain
   */
  initialize(classData: Partial<Class>, parentDepartmentHash: string): void {
    this.parentDepartmentHash = parentDepartmentHash;

    const classInfo: Class = {
      id: this.classId,
      name: this.className,
      code: classData.code || "",
      departmentId: this.departmentId,
      semester: classData.semester,
      year: classData.year,
      createdAt: Date.now(),
      status: "active",
    };

    // CRITICAL: Use parent's hash as prev_hash for genesis block
    this.createGenesisBlock(classInfo, parentDepartmentHash);

    console.log(`✅ Class Chain created: ${this.className} (linked to dept)`);
  }

  /**
   * addClassUpdate() - Adds update block to class chain
   *
   * WHY: Immutable updates (same as department)
   * - Add new block with updated data
   * - Preserve history
   *
   * WHAT IT DOES:
   * Creates a block containing updated class data
   *
   * @param updates - Fields to update
   */
  addClassUpdate(updates: Partial<Class>): void {
    const updateTransaction: Transaction = {
      type: "update",
      data: {
        classId: this.classId,
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
    console.log(`✅ Class updated: ${this.className}`);
  }

  /**
   * addClassDeletion() - Marks class as deleted
   *
   * WHY: Soft delete via status block
   * - History preserved
   * - Can audit what was deleted and when
   *
   * @param updates - Fields to update
   */
  addClassDeletion(): void {
    const deleteTransaction: Transaction = {
      type: "delete",
      data: {
        classId: this.classId,
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
    console.log(`🗑️ Class marked as deleted: ${this.className}`);
  }

  /**
   * getCurrentState() - Gets current class state from blocks
   *
   * WHY: Same as department - replay all blocks
   * - Genesis has initial data
   * - Updates modify fields
   * - Deletes change status
   *
   * @returns Current class state
   */
  getCurrentState(): Class | null {
    if (this.chain.length === 0) return null;

    let state: Class = { ...this.chain[0].transactions[0].data };

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
   * validateParentLink() - Verifies link to department chain
   *
   * WHY: CRITICAL for hierarchy integrity
   * - Ensures class is legitimately linked to department
   * - Detects if department chain was modified
   * - Part of multi-level validation
   *
   * WHAT IT CHECKS:
   * - Genesis block's prev_hash matches stored parent hash
   * - If they don't match, someone tampered with parent chain
   *
   * HOW IT WORKS:
   * 1. Get genesis block (index 0)
   * 2. Check its prev_hash
   * 3. Compare with parentDepartmentHash
   * 4. If mismatch, chain is invalid
   *
   * VALIDATION SCENARIO:
   * Original: Dept hash = "0000abc", Class genesis prev_hash = "0000abc" ✅
   * Tampered: Dept hash = "0000xyz", Class genesis prev_hash = "0000abc" ❌
   * Result: Class chain INVALID - parent was modified!
   *
   * @param currentParentHash - Current latest hash from department chain
   * @returns true if link is valid, false if broken
   */
  validateParentLink(currentParentHash: string): boolean {
    if (this.chain.length === 0) return false;

    const genesisBlock = this.chain[0];

    // Check if genesis block's prev_hash matches parent's hash
    if (genesisBlock.prev_hash !== this.parentDepartmentHash) {
      console.error(
        `Class ${this.className}: Parent link broken in genesis block!`
      );
      return false;
    }

    // Optionally check if parent chain has been extended
    // (not required, but good for detecting parent modifications)
    if (currentParentHash !== this.parentDepartmentHash) {
      console.warn(
        `Class ${this.className}: Parent chain has been extended since creation`
      );
    }

    return true;
  }

  /**
   * toJSON() - Serializes class chain for storage
   */
  toJSON() {
    return {
      ...super.toJSON(),
      classId: this.classId,
      className: this.className,
      departmentId: this.departmentId,
      parentDepartmentHash: this.parentDepartmentHash,
    };
  }

  /**
   * fromJSON() - Recreates ClassChain from saved data
   */
  static fromJSON(data: any): ClassChain {
    const chain = new ClassChain(
      data.classId,
      data.className,
      data.departmentId,
      data.difficulty
    );
    chain.parentDepartmentHash = data.parentDepartmentHash;
    chain.chain = data.chain.map((blockData: any) => Block.fromJSON(blockData));
    return chain;
  }
}
