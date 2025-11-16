Blockchain-Based Attendance Management System (BAMS)
A multi-layered blockchain system for managing student attendance with cryptographic immutability.

🏗️ Architecture
Frontend: Next.js 14 (TypeScript) + Tailwind CSS
Backend: Express.js (TypeScript)
Storage: JSON-based blockchain files
Blockchain: Custom 3-layer hierarchical structure
📋 Features
✅ Department → Class → Student blockchain hierarchy
✅ SHA-256 hashing with Proof of Work
✅ Immutable attendance records
✅ Full CRUD operations with blockchain validation
✅ Real-time blockchain explorer
✅ Multi-level chain validation
🚀 Quick Start
Backend Setup
bash
cd backend
npm install
npm run dev
Server runs on http://localhost:5000

Frontend Setup
bash
cd frontend
npm install
npm run dev
App runs on http://localhost:3000

📁 Project Structure
bams-project/
├── backend/ # Express.js API
│ ├── src/
│ │ ├── controllers/ # Request handlers
│ │ ├── services/ # Business logic
│ │ ├── models/ # Blockchain classes
│ │ ├── routes/ # API routes
│ │ ├── storage/ # JSON data files
│ │ └── server.ts # Entry point
│ └── package.json
│
├── frontend/ # Next.js app
│ ├── src/
│ │ ├── app/ # Pages (App Router)
│ │ ├── components/ # React components
│ │ └── lib/ # Utilities
│ └── package.json
│
└── README.md
🔗 Blockchain Structure
Layer 1: Department Chain

Independent genesis block
Each department has its own chain
Layer 2: Class Chain

Genesis block links to parent department's latest hash
Cryptographically bound to department
Layer 3: Student Chain

Genesis block links to parent class's latest hash
Personal attendance ledger
📝 API Endpoints
Departments
POST /api/departments - Create department
GET /api/departments - List all departments
GET /api/departments/:id - Get specific department
PUT /api/departments/:id - Update department (adds block)
DELETE /api/departments/:id - Delete department (adds block)
Classes
POST /api/classes - Create class
GET /api/classes - List all classes
GET /api/classes/department/:deptId - Filter by department
More endpoints...
Students
POST /api/students - Create student
GET /api/students - List all students
More endpoints...
Attendance
POST /api/attendance/mark - Mark attendance
GET /api/attendance/student/:id - Student ledger
More endpoints...
🔧 Development
Backend dev mode: npm run dev (auto-reload)
Frontend dev mode: npm run dev (hot reload)
Build backend: npm run build
Build frontend: npm run build
📦 Deployment
Frontend: Vercel
Backend: Render/Railway
👨‍💻 Author
[Your Name]

📄 License
MIT

Built as part of Blockchain Systems course assignment
