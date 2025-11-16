// frontend/app/explorer/student/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { studentAPI } from "@/app/lib/api";
import { StudentChain } from "@/app/lib/types";
import BlockViewer from "@/app/components/explorer/BlockViewer";
import { GraduationCap, BookUser, HardDrive } from "lucide-react";
import Link from "next/link";

export default function StudentChainExplorer() {
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<StudentChain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const studentRes = await studentAPI.getById(id);

        if (studentRes.success) {
          setStudent(studentRes.data);
        } else {
          throw new Error("Failed to fetch student chain.");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load student data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-20">
        Loading student ledger...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-20">{error}</div>;
  }

  if (!student) {
    return (
      <div className="text-center text-gray-500 py-20">Student not found.</div>
    );
  }

  // Get all attendance blocks
  const attendanceBlocks = student.chain.filter(
    (block) =>
      block.index > 0 && // Not genesis
      block.transactions.some((tx) => tx.type === "ATTENDANCE")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <GraduationCap className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="font-mono text-gray-600 mt-1">{student.rollNumber}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t text-sm space-y-2">
          <h4 className="font-semibold">Chain Link Info:</h4>
          <p className="text-gray-600">
            Links to Class:{" "}
            <span className="font-mono text-xs bg-gray-100 p-1 rounded text-red-700">
              {student.parentClassHash || "N/A"}
            </span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Attendance Ledger Stats
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Blocks</p>
            <p className="text-2xl font-bold text-gray-900">
              {student.chain.length}
            </p>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Attendance Records
            </p>
            <p className="text-2xl font-bold text-green-900">
              {attendanceBlocks.length}
            </p>
          </div>
          {/* Add more stats here if needed, e.g., Present, Absent, Leave counts */}
        </div>
      </div>

      {/* Block Chain Visualization */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">
          Personal Blockchain Ledger ({student.chain.length} Blocks)
        </h2>

        {student.chain.map((block) => (
          <BlockViewer
            key={block.hash}
            block={block}
            title={
              block.index === 0 ? "Genesis Block" : `Block #${block.index}`
            }
            chainColor="border-green-500" // Student color
          />
        ))}
      </div>
    </div>
  );
}
