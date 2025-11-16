// frontend/app/explorer/class/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { classAPI, studentAPI } from "@/app/lib/api";
import { ClassChain, Student } from "@/app/lib/types";
import BlockViewer from "@/app/components/explorer/BlockViewer";
import { Users, GraduationCap, HardDrive, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ClassChainExplorer() {
  const params = useParams();
  const id = params.id as string;

  const [classChain, setClassChain] = useState<ClassChain | null>(null);
  const [childStudents, setChildStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch class chain and its child students in parallel
        const [classRes, studentRes] = await Promise.all([
          classAPI.getById(id),
          studentAPI.getByClass(id),
        ]);

        if (classRes.success) {
          setClassChain(classRes.data);
        } else {
          throw new Error("Failed to fetch class chain.");
        }

        setChildStudents(studentRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load class data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-20">
        Loading class chain...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-20">{error}</div>;
  }

  if (!classChain) {
    return (
      <div className="text-center text-gray-500 py-20">Class not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {classChain.name}
            </h1>
            <p className="text-gray-600 mt-1">Explorer (Level 2 Chain)</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t text-sm space-y-2">
          <h4 className="font-semibold">Chain Link Info:</h4>
          <p className="text-gray-600">
            Links to Department:{" "}
            <span className="font-mono text-xs bg-gray-100 p-1 rounded text-red-700">
              {classChain.parentDepartmentHash || "N/A"}
            </span>
          </p>
        </div>
      </div>

      {/* Child Chains (Students) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Level 3: Child Student Ledgers ({childStudents.length})
        </h2>
        <div className="space-y-3">
          {childStudents.length > 0 ? (
            childStudents.map((student) => (
              <Link
                href={`/explorer/student/${student.id}`}
                key={student.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:border-green-500 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-700">
                      {student.name}
                    </h4>
                    <p className="text-sm text-gray-500 font-mono">
                      {student.rollNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {student.chainLength || 0} Blocks
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No child students found for this class.
            </p>
          )}
        </div>
      </div>

      {/* Block Chain Visualization */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">
          {classChain.name} Chain ({classChain.chain.length} Blocks)
        </h2>

        {classChain.chain.map((block) => (
          <BlockViewer
            key={block.hash}
            block={block}
            title={
              block.index === 0 ? "Genesis Block" : `Block #${block.index}`
            }
            chainColor="border-purple-500" // Class color
          />
        ))}
      </div>
    </div>
  );
}
