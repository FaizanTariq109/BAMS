import crypto from "crypto";

/**
 * Interface defining the structure of transactions stored in a block
 * Can be attendance records, department info, class info, or student info
 */
export interface Transaction {
  type: "attendance" | "department" | "class" | "student" | "update" | "delete";
  data: any;
  timestamp: number;
}

/**
 * Block class represents a single block in the blockchain
 * Each block contains:
 * - index: Position in the chain
 * - timestamp: When the block was created
 * - transactions: Data stored in the block
 * - prev_hash: Hash of the previous block (creates the chain link)
 * - nonce: Number used for Proof of Work mining
 * - hash: SHA-256 hash of this block's content
 */
export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public prev_hash: string;
  public nonce: number;
  public hash: string;

  constructor(
    index: number,
    timestamp: number,
    transactions: Transaction[],
    prev_hash: string = ""
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.prev_hash = prev_hash;
    this.nonce = 0; // Start with 0, will be incremented during mining
    this.hash = this.calculateHash(); // Calculate initial hash
  }

  /**
   * calculateHash() - Creates SHA-256 hash of block contents
   *
   * WHY: This is the core of blockchain immutability
   * - Any change to block data changes the hash
   * - This hash becomes the prev_hash for the next block
   * - Changing one block invalidates all subsequent blocks
   *
   * WHAT IT DOES:
   * 1. Combines all block properties into a single string
   * 2. Uses SHA-256 (cryptographically secure) to hash it
   * 3. Returns hexadecimal string representation
   *
   * HOW IT WORKS:
   * - crypto.createHash('sha256') creates a hash object
   * - update() feeds data into the hash function
   * - digest('hex') outputs the final hash as a hex string
   */
  calculateHash(): string {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.prev_hash +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.nonce
      )
      .digest("hex");
  }

  /**
   * mineBlock() - Implements Proof of Work (PoW)
   *
   * WHY: Makes it computationally expensive to create blocks
   * - Prevents spam and malicious chain modifications
   * - In real blockchains, this protects against 51% attacks
   * - For our system, it demonstrates blockchain mining concept
   *
   * WHAT IT DOES:
   * 1. Repeatedly changes the nonce (number used once)
   * 2. Recalculates hash each time
   * 3. Stops when hash starts with required number of zeros
   *
   * HOW IT WORKS:
   * - difficulty=4 means hash must start with "0000"
   * - We keep incrementing nonce until we find a valid hash
   * - Average attempts needed: 16^difficulty (16^4 = 65,536 attempts for difficulty 4)
   * - This is why mining takes time - it's intentionally hard!
   *
   * EXAMPLE:
   * difficulty=4 requires: 0000a3f2b1c... ✅
   * but not:               000fa3f2b1c... ❌ (only 3 zeros)
   *
   * @param difficulty - Number of leading zeros required in hash
   */
  mineBlock(difficulty: number): void {
    // Create target string: difficulty=4 → "0000"
    const target = Array(difficulty + 1).join("0");

    // Keep trying until hash starts with target
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++; // Increment nonce
      this.hash = this.calculateHash(); // Recalculate hash
    }

    console.log(`Block mined: ${this.hash} (nonce: ${this.nonce})`);
  }

  /**
   * isValid() - Verifies block integrity
   *
   * WHY: Detects tampering
   * - If block data is changed, hash won't match
   * - This is how we know someone tried to modify history
   *
   * WHAT IT DOES:
   * Recalculates hash and compares with stored hash
   *
   * HOW IT WORKS:
   * - Calls calculateHash() with current block data
   * - If result differs from this.hash, block was tampered with
   *
   * @returns true if block is valid, false if tampered
   */
  isValid(): boolean {
    return this.hash === this.calculateHash();
  }

  /**
   * toJSON() - Converts block to plain object for storage
   *
   * WHY: Needed for saving to JSON files
   * - JSON.stringify() needs plain objects
   * - Class instances have methods that can't be serialized
   *
   * @returns Plain object representation of block
   */
  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      prev_hash: this.prev_hash,
      nonce: this.nonce,
      hash: this.hash,
    };
  }

  /**
   * fromJSON() - Creates Block instance from stored data
   *
   * WHY: When loading from JSON files, we need to recreate Block objects
   * - JSON only stores data, not methods
   * - This static method reconstructs a proper Block instance
   *
   * @param data - Plain object from JSON file
   * @returns New Block instance with all methods available
   */
  static fromJSON(data: any): Block {
    const block = new Block(
      data.index,
      data.timestamp,
      data.transactions,
      data.prev_hash
    );
    block.nonce = data.nonce;
    block.hash = data.hash;
    return block;
  }
}
