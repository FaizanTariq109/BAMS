import { Blockchain } from "./Blockchain";
import { Block, Transaction } from "./Block";

/**
 * Department interface - defines structure of department data
 */
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: number;
  status: "active" | "deleted";
}

/**
 * DepartmentChain - Layer 1 of our blockchain hierarchy
 *
 * WHY THIS EXISTS:
 * - Each department gets its own independent blockchain
 * - Genesis block has prev_hash = '0' (no parent)
 * - This is the ROOT of the hierarchy
 * - Classes will link to this chain
 *
 * DESIGN PHILOSOPHY:
 * - Departments are independent entities
 * - No department depends on another
 * - Each maintains its own immutable history
 *
 * EXAMPLE STRUCTURE:
 * Department: "School of Computing"
 * Block 0 (Genesis): Created department
 * Block 1: Updated description
 * Block 2: Added new metadata
 *
 * Child classes link to Block 2's hash →
 */
export class DepartmentChain extends Blockchain {
  public departmentId: string;
  public departmentName: string;

  /**
   * Constructor - Creates a new department blockchain
   *
   * @param departmentId - Unique identifier for department
   * @param departmentName - Display name
   * @param difficulty - PoW difficulty (default 4)
   */
  constructor(
    departmentId: string,
    departmentName: string,
    difficulty: number = 4
  ) {
    super(difficulty);
    this.departmentId = departmentId;
    this.departmentName = departmentName;
  }

  /**
   * initialize() - Creates the genesis block for this department
   *
   * WHY: Every blockchain needs a genesis block
   * - This is the department's birth certificate
   * - All department history starts here
   * - Classes will reference this chain's latest block
   *
   * WHAT IT DOES:
   * 1. Creates department data object
   * 2. Wraps it in a transaction
   * 3. Creates genesis block (prev_hash = '0')
   * 4. Mines the block
   *
   * HOW IT WORKS:
   * - Calls parent's createGenesisBlock()
   * - Uses '0' as parentHash (no parent for departments)
   * - Transaction type is 'department'
   *
   * @param departmentData - Initial department information
   */
  initialize(departmentData: Partial<Department>): void {
    const dept: Department = {
      id: this.departmentId,
      name: this.departmentName,
      code: departmentData.code || "",
      description: departmentData.description || "",
      createdAt: Date.now(),
      status: "active",
    };

    // Create genesis block with no parent (prev_hash = '0')
    this.createGenesisBlock(dept, "0");

    console.log(`✅ Department Chain created: ${this.departmentName}`);
  }

  /**
   * addDepartmentUpdate() - Adds update block to department chain
   *
   * WHY: Blockchain is immutable - we can't edit blocks
   * - Instead, we add a NEW block with updated info
   * - The latest block represents current state
   * - Old blocks preserve history
   *
   * WHAT IT DOES:
   * Creates a block containing updated department data
   *
   * HOW IT WORKS:
   * 1. Create transaction with type 'update'
   * 2. Include updated fields
   * 3. Create new block
   * 4. Mine and add to chain
   *
   * EXAMPLE:
   * Block 0: name = "School of Computing"
   * Block 1: name = "School of Computer Science" (update)
   * Latest block (Block 1) is the current state
   *
   * @param updates - Fields to update
   */
  addDepartmentUpdate(updates: Partial<Department>): void {
    const updateTransaction: Transaction = {
      type: "update",
      data: {
        departmentId: this.departmentId,
        updates: updates,
        updatedAt: Date.now(),
      },
      timestamp: Date.now(),
    };

    const newBlock = new Block(
      this.chain.length, // Next index
      Date.now(),
      [updateTransaction],
      this.getLatestBlock().hash
    );

    this.addBlock(newBlock);
    console.log(`✅ Department updated: ${this.departmentName}`);
  }

  /**
   * addDepartmentDeletion() - Marks department as deleted
   *
   * WHY: Can't actually delete blocks - immutability!
   * - Add a "deletion" block instead
   * - Status changes to 'deleted'
   * - History is preserved
   *
   * WHAT IT DOES:
   * Adds a block marking the department as deleted
   *
   * HOW IT WORKS:
   * - Create transaction with type 'delete'
   * - Set status to 'deleted'
   * - Add block to chain
   *
   * IMPORTANT:
   * - Physical blocks aren't removed
   * - Application logic reads latest status
   * - If status = 'deleted', don't show department in UI
   * - But blockchain history remains intact
   */
  addDepartmentDeletion(): void {
    const deleteTransaction: Transaction = {
      type: "delete",
      data: {
        departmentId: this.departmentId,
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
    console.log(`🗑️ Department marked as deleted: ${this.departmentName}`);
  }

  /**
   * getCurrentState() - Gets the current state by reading all blocks
   *
   * WHY: State is distributed across blocks
   * - Genesis block has initial data
   * - Update blocks modify fields
   * - Delete block changes status
   * - We need to replay all blocks to get current state
   *
   * WHAT IT DOES:
   * Iterates through all blocks and applies changes sequentially
   *
   * HOW IT WORKS:
   * 1. Start with genesis block data
   * 2. For each subsequent block:
   *    - If 'update': merge updates
   *    - If 'delete': set status to 'deleted'
   * 3. Return final state
   *
   * EXAMPLE:
   * Block 0: { name: "Computing", status: "active" }
   * Block 1: { description: "CS Dept" } (update)
   * Block 2: { status: "deleted" } (delete)
   * Result: { name: "Computing", description: "CS Dept", status: "deleted" }
   *
   * @returns Current department state
   */
  getCurrentState(): Department | null {
    if (this.chain.length === 0) return null;

    // Start with genesis block data
    let state: Department = { ...this.chain[0].transactions[0].data };

    // Apply all subsequent changes
    for (let i = 1; i < this.chain.length; i++) {
      const transaction = this.chain[i].transactions[0];

      if (transaction.type === "update") {
        // Merge updates
        state = { ...state, ...transaction.data.updates };
      } else if (transaction.type === "delete") {
        // Mark as deleted
        state.status = "deleted";
      }
    }

    return state;
  }

  /**
   * toJSON() - Serializes department chain for storage
   *
   * WHY: Save to JSON files
   * - Persist across server restarts
   * - Easy to inspect and debug
   *
   * @returns Plain object with all chain data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      departmentId: this.departmentId,
      departmentName: this.departmentName,
    };
  }

  /**
   * fromJSON() - Recreates DepartmentChain from saved data
   *
   * WHY: Load blockchains when server starts
   * - Read from JSON files
   * - Restore full functionality
   *
   * @param data - Saved chain data
   * @returns New DepartmentChain instance
   */
  static fromJSON(data: any): DepartmentChain {
    const chain = new DepartmentChain(
      data.departmentId,
      data.departmentName,
      data.difficulty
    );
    chain.chain = data.chain.map((blockData: any) => Block.fromJSON(blockData));
    return chain;
  }
}
