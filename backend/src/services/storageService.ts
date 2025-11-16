import fs from "fs";
import path from "path";

/**
 * StorageService - Manages JSON file storage for blockchains
 *
 * WHY WE NEED THIS:
 * - Blockchains need to persist across server restarts
 * - JSON files are simple, portable, and inspectable
 * - No database setup required
 * - Easy to version control and debug
 *
 * WHAT IT DOES:
 * - Reads blockchain data from JSON files
 * - Writes blockchain data to JSON files
 * - Creates storage directory if it doesn't exist
 * - Handles file system errors gracefully
 *
 * FILE STRUCTURE:
 * backend/src/storage/
 * ├── departments.json      - Array of all department chains
 * ├── classes.json          - Array of all class chains
 * ├── students.json         - Array of all student chains
 * └── config.json           - System configuration
 */

class StorageService {
  private storagePath: string;

  constructor() {
    // Get storage path from environment or use default
    this.storagePath =
      process.env.STORAGE_PATH || path.join(__dirname, "../storage");
    this.initializeStorage();
  }

  /**
   * initializeStorage() - Creates storage directory and initial files
   *
   * WHY: Ensure storage exists before reading/writing
   * - Creates directory if missing
   * - Creates empty JSON files if missing
   * - Prevents file not found errors
   *
   * WHAT IT DOES:
   * 1. Check if storage directory exists
   * 2. If not, create it
   * 3. Create initial empty JSON files
   *
   * HOW IT WORKS:
   * - fs.existsSync() checks if path exists
   * - fs.mkdirSync() creates directory
   * - recursive: true creates parent directories too
   */
  private initializeStorage(): void {
    try {
      // Create storage directory if it doesn't exist
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
        console.log("✅ Storage directory created");
      }

      // Initialize empty files if they don't exist
      const files = [
        "departments.json",
        "classes.json",
        "students.json",
        "config.json",
      ];

      files.forEach((file) => {
        const filePath = path.join(this.storagePath, file);
        if (!fs.existsSync(filePath)) {
          // Create empty array for chain files, empty object for config
          const initialData = file === "config.json" ? {} : [];
          fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
          console.log(`✅ Initialized ${file}`);
        }
      });

      console.log("✅ Storage initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize storage:", error);
      throw error;
    }
  }

  /**
   * readFile() - Reads data from a JSON file
   *
   * WHY: Load blockchain data from disk
   * - Server needs to load chains on startup
   * - Controllers need to read existing data
   *
   * WHAT IT DOES:
   * 1. Construct full file path
   * 2. Read file contents
   * 3. Parse JSON string to JavaScript object
   * 4. Return data
   *
   * HOW IT WORKS:
   * - fs.readFileSync() reads file as string
   * - JSON.parse() converts string to object/array
   * - Error handling catches invalid JSON or missing files
   *
   * @param filename - Name of JSON file (e.g., 'departments.json')
   * @returns Parsed JSON data
   */
  readFile(filename: string): any {
    try {
      const filePath = path.join(this.storagePath, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filename}, returning empty array`);
        return [];
      }

      // Read and parse file
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error reading ${filename}:`, error);
      return []; // Return empty array on error
    }
  }

  /**
   * writeFile() - Writes data to a JSON file
   *
   * WHY: Persist blockchain changes to disk
   * - Save after creating new chains
   * - Save after adding blocks
   * - Save after updates/deletes
   *
   * WHAT IT DOES:
   * 1. Convert JavaScript object to JSON string
   * 2. Write to file
   * 3. Format with 2-space indentation (readable)
   *
   * HOW IT WORKS:
   * - JSON.stringify(data, null, 2) creates formatted JSON
   * - null = no replacer function
   * - 2 = indent with 2 spaces (makes files readable)
   * - fs.writeFileSync() writes to disk synchronously
   *
   * SYNCHRONOUS VS ASYNCHRONOUS:
   * - We use sync methods for simplicity
   * - For production, async would be better (non-blocking)
   * - But for this assignment, sync is fine
   *
   * @param filename - Name of JSON file
   * @param data - Data to write
   */
  writeFile(filename: string, data: any): void {
    try {
      const filePath = path.join(this.storagePath, filename);

      // Convert to formatted JSON string
      const jsonData = JSON.stringify(data, null, 2);

      // Write to file
      fs.writeFileSync(filePath, jsonData, "utf-8");

      console.log(`✅ Saved ${filename}`);
    } catch (error) {
      console.error(`❌ Error writing ${filename}:`, error);
      throw error;
    }
  }

  /**
   * getDepartments() - Loads all department chains
   *
   * WHY: Controllers need to access department data
   * @returns Array of department chain data
   */
  getDepartments(): any[] {
    return this.readFile("departments.json");
  }

  /**
   * saveDepartments() - Saves all department chains
   *
   * WHY: Persist department changes
   * @param departments - Array of department chains
   */
  saveDepartments(departments: any[]): void {
    this.writeFile("departments.json", departments);
  }

  /**
   * getClasses() - Loads all class chains
   */
  getClasses(): any[] {
    return this.readFile("classes.json");
  }

  /**
   * saveClasses() - Saves all class chains
   */
  saveClasses(classes: any[]): void {
    this.writeFile("classes.json", classes);
  }

  /**
   * getStudents() - Loads all student chains
   */
  getStudents(): any[] {
    return this.readFile("students.json");
  }

  /**
   * saveStudents() - Saves all student chains
   */
  saveStudents(students: any[]): void {
    this.writeFile("students.json", students);
  }

  /**
   * getConfig() - Loads system configuration
   */
  getConfig(): any {
    return this.readFile("config.json");
  }

  /**
   * saveConfig() - Saves system configuration
   */
  saveConfig(config: any): void {
    this.writeFile("config.json", config);
  }

  /**
   * getStoragePath() - Returns the storage directory path
   *
   * WHY: Useful for debugging and testing
   */
  getStoragePath(): string {
    return this.storagePath;
  }

  /**
   * clearAllData() - Deletes all data (USE WITH CAUTION!)
   *
   * WHY: Useful for testing and resetting system
   * - NOT for production use
   * - Deletes all blockchains
   *
   * DANGER: This is irreversible!
   */
  clearAllData(): void {
    try {
      this.saveDepartments([]);
      this.saveClasses([]);
      this.saveStudents([]);
      this.saveConfig({});
      console.log("⚠️ All data cleared!");
    } catch (error) {
      console.error("❌ Error clearing data:", error);
      throw error;
    }
  }
}

// Export singleton instance
// WHY: We only need one storage service for entire app
// All controllers/services share the same storage instance
export default new StorageService();
