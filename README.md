# 📘 Blockchain-Based Attendance Management System (BAMS)

A secure and tamper-proof attendance system built using a custom blockchain.  
Includes:

- **Next.js (Frontend)** – Vercel
- **Express + TypeScript (Backend)** – Render
- **TailwindCSS UI**
- **JSON-file Blockchain Storage**

---

## 🚀 Live Demo

| Component                | URL                                                          |
| ------------------------ | ------------------------------------------------------------ |
| **Frontend (Vercel)**    | https://bams3714-r7a7ocms3-f223714-2459s-projects.vercel.app |
| **Backend (Render API)** | https://bams-wxoc.onrender.com/api                           |

---

## 📂 Project Structure

BAMS/
├── backend/
│ ├── src/
│ │ ├── controllers/
│ │ ├── services/
│ │ ├── models/
│ │ │ └── blockchain/
│ │ ├── routes/
│ │ ├── storage/
│ │ └── utils/
│ ├── .env
│ ├── package.json
│ └── tsconfig.json
│
├── frontend/
│ ├── app/
│ ├── components/
│ ├── lib/
│ ├── .env.local
│ ├── package.json
│ └── tailwind.config.js
│
└── README.md

---

## 🛠️ Technologies Used

### Backend

- Node.js + Express.js
- TypeScript
- Custom Blockchain
- Render Hosting

### Frontend

- Next.js (App Router)
- TailwindCSS
- Vercel Hosting

---

## 🔐 Blockchain Overview

Each attendance record becomes a block:

```json
{
  "index": 1,
  "timestamp": 1710000000,
  "data": {
    "studentId": "ST-001",
    "classId": "CSE-01",
    "status": "present"
  },
  "previousHash": "...",
  "hash": "...",
  "nonce": 28492
}

Features:

- Tamper-proof
- Hash-linked chain
- Mining + difficulty
- Full audit history

⚙️ Backend Setup (Local)
cd backend
npm install

Create .env:
PORT=5000
DIFFICULTY=4
NODE_ENV=development


Run backend:
npm run dev

Backend runs at:
http://localhost:5000

🎨 Frontend Setup (Local)
cd frontend
npm install


Create .env.local:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

Run frontend:
npm run dev

Frontend runs at:
http://localhost:3000

🌍 Environment Variables
Backend — backend/.env
PORT=5000
DIFFICULTY=4
NODE_ENV=production

Frontend — frontend/.env.local
NEXT_PUBLIC_API_URL=https://bams-wxoc.onrender.com/api

🧠 Backend API Documentation
Base URL
https://bams-wxoc.onrender.com/api

📌 Departments
Get all departments
GET /departments

Create department
POST /departments
{
  "name": "Computer Science"
}

📌 Classes
Get all classes
GET /classes

Create class
POST /classes
{
  "departmentId": "dep-123",
  "name": "CS-101"
}

📌 Students
GET /students
POST /students
PUT /students/:id
DELETE /students/:id

📌 Attendance (Blockchain Blocks)
Mark attendance
POST /attendance
{
  "studentId": "st-01",
  "classId": "cs-01",
  "status": "present"
}

📌 Validate Blockchain
GET /validate


Example response:

{
  "valid": true,
  "chainLength": 18
}

🌐 Deployment Guide
🚀 Deploy Backend on Render

Push backend folder to GitHub

On Render → New Web Service

Choose repo

Settings:

Runtime: Node
Build Command: npm install
Start Command: npm start


Add environment variables:

PORT=10000
DIFFICULTY=4
NODE_ENV=production


Deploy

Backend URL becomes:
https://bams-wxoc.onrender.com

🚀 Deploy Frontend on Vercel

Go to Vercel → New Project

Select frontend folder

Add env:
NEXT_PUBLIC_API_URL=https://bams-wxoc.onrender.com/api

🧪 Testing
Backend
curl https://bams-wxoc.onrender.com/api/departments

Frontend
Open:
http://localhost:3000

🤝 Contributing
Fork
Create feature branch
Commit
Open Pull Request

📜 License

MIT License

🎉 Credits

Developed by Faizan Tariq — FAST NUCES (Software Engineering)
Project: Blockchain-Based Attendance Management System (BAMS)
```
