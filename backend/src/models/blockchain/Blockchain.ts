import { Block, Transaction } from "./Block";

/**
 * Blockchain base class - manages a chain of blocks
 *
 * WHY WE NEED THIS:
 * - Provides common functionality for all blockchain types
 * - Manages the chain array and ensures integrity
 * - Implements validation logic
 * - DepartmentChain, ClassChain, StudentChain will extend this
 *
 * KEY CONCEPTS:
 * - Genesis Block: The first block in any chain (index 0)
 * - Chain: Array of blocks linked by prev_hash values
 * - Difficulty: How many leading zeros required in PoW
 */
export class Blockchain {
  public chain: Block[];
  public difficulty: number;

  constructor(difficulty: number = 4) {
    this.chain = [];
    this.difficulty = difficulty; // Default: hash must start with "0000"
  }

  /**
   * createGenesisBlock() - Creates the first block in the chain
   *
   * WHY: Every blockchain needs a starting point
   * - Genesis block has no previous block (prev_hash = '0')
   * - It establishes the foundation for the entire chain
   * - In Bitcoin, genesis block was created on Jan 3, 2009
   *
   * WHAT IT DOES:
   * - Creates block at index 0
   * - Sets prev_hash to '0' (no previous block)
   * - Mines the block with PoW
   * - Adds it to the chain
   *
   * HOW IT WORKS:
   * 1. Create new Block with special genesis transaction
   * 2. Mine it (find valid hash with required zeros)
   * 3. Push to chain array
   *
   * @param genesisData - Initial data for the chain (dept/class/student info)
   * @param parentHash - For child chains, this links to parent's latest block
   */
  createGenesisBlock(genesisData: any, parentHash: string = "0"): void {
    const genesisTransaction: Transaction = {
      type: "department", // Will be overridden by child classes
      data: genesisData,
      timestamp: Date.now(),
    };

    const genesisBlock = new Block(
      0, // Genesis block is always index 0
      Date.now(),
      [genesisTransaction],
      parentHash // '0' for departments, parent hash for classes/students
    );

    genesisBlock.mineBlock(this.difficulty);
    this.chain.push(genesisBlock);
  }

  /**
   * getLatestBlock() - Returns the most recent block in the chain
   *
   * WHY: We need this constantly
   * - To get prev_hash for new blocks
   * - To check chain length
   * - To verify chain integrity
   *
   * WHAT IT DOES:
   * Returns the last element in the chain array
   *
   * @returns The most recent Block object
   */
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * addBlock() - Adds a new block to the chain
   *
   * WHY: This is how we append new data to the blockchain
   * - Attendance records become new blocks
   * - Updates/deletes are added as new blocks
   * - This maintains immutability (no editing old blocks)
   *
   * WHAT IT DOES:
   * 1. Sets the new block's index (next in sequence)
   * 2. Links it to previous block via prev_hash
   * 3. Mines the block (PoW)
   * 4. Adds it to the chain
   *
   * HOW IT WORKS:
   * - Get latest block's hash
   * - Set new block's prev_hash to that hash
   * - Mine new block (find valid nonce)
   * - Append to chain array
   *
   * CRITICAL: The prev_hash creates the "chain"
   * Block 1 hash: abc123
   * Block 2 prev_hash: abc123 ← Creates the link!
   *
   * @param newBlock - Block to be added to the chain
   */
  addBlock(newBlock: Block): void {
    // Set the index to next position
    newBlock.index = this.chain.length;

    // Link to previous block
    newBlock.prev_hash = this.getLatestBlock().hash;

    // Mine the block (Proof of Work)
    newBlock.mineBlock(this.difficulty);

    // Add to chain
    this.chain.push(newBlock);
  }

  /**
   * isChainValid() - Validates entire blockchain integrity
   *
   * WHY: This is CRITICAL for blockchain security
   * - Detects if anyone tampered with blocks
   * - Verifies the chain hasn't been corrupted
   * - Ensures PoW was properly done for each block
   *
   * WHAT IT CHECKS:
   * 1. Each block's hash is correctly calculated
   * 2. Each block's prev_hash matches previous block's hash
   * 3. Each block satisfies PoW requirement (starts with zeros)
   *
   * HOW IT WORKS:
   * - Skip genesis block (index 0) - it has no previous
   * - For each block starting at index 1:
   *   a) Recalculate its hash - should match stored hash
   *   b) Check prev_hash matches previous block's hash
   *   c) Verify hash starts with required zeros (PoW)
   *
   * TAMPERING EXAMPLE:
   * Original: Block 5 data = "Present"
   * Tampered: Block 5 data = "Absent"
   * Result: Hash changes, no longer matches stored hash → INVALID!
   *
   * @returns true if entire chain is valid, false if any tampering detected
   */
  isChainValid(): boolean {
    // Start from block 1 (skip genesis)
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check 1: Is block's stored hash correct?
      if (!currentBlock.isValid()) {
        console.error(`Block ${i} has invalid hash!`);
        return false;
      }

      // Check 2: Does prev_hash link correctly?
      if (currentBlock.prev_hash !== previousBlock.hash) {
        console.error(`Block ${i} has broken chain link!`);
        return false;
      }

      // Check 3: Does hash satisfy PoW requirement?
      const target = Array(this.difficulty + 1).join("0");
      if (currentBlock.hash.substring(0, this.difficulty) !== target) {
        console.error(`Block ${i} doesn't satisfy Proof of Work!`);
        return false;
      }
    }

    return true;
  }

  /**
   * getChainLength() - Returns number of blocks in chain
   *
   * WHY: Useful for:
   * - Displaying chain stats
   * - Determining next block index
   * - Checking if chain exists (length > 0)
   */
  getChainLength(): number {
    return this.chain.length;
  }

  /**
   * getBlock() - Retrieves a specific block by index
   *
   * WHY: For blockchain explorer
   * - Users want to see specific blocks
   * - Auditing requires accessing historical blocks
   *
   * @param index - Position of block in chain
   * @returns Block at that index, or undefined if not found
   */
  getBlock(index: number): Block | undefined {
    return this.chain[index];
  }

  /**
   * toJSON() - Converts entire chain to JSON format
   *
   * WHY: For saving to JSON files
   * - Persist blockchain to disk
   * - Can be loaded later
   *
   * @returns Object containing chain data and difficulty
   */
  toJSON() {
    return {
      chain: this.chain.map((block) => block.toJSON()),
      difficulty: this.difficulty,
    };
  }

  /**
   * fromJSON() - Reconstructs blockchain from saved data
   *
   * WHY: When server restarts, we need to reload blockchains
   * - Reads from JSON files
   * - Recreates Block objects with all methods
   *
   * @param data - Saved blockchain data from JSON file
   * @returns New Blockchain instance
   */
  static fromJSON(data: any): Blockchain {
    const blockchain = new Blockchain(data.difficulty);
    blockchain.chain = data.chain.map((blockData: any) =>
      Block.fromJSON(blockData)
    );
    return blockchain;
  }
}
