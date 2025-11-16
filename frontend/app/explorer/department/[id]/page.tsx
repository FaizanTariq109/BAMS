// frontend/app/explorer/department/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { departmentAPI, classAPI } from "@/app/lib/api";
import { DepartmentChain, Class } from "@/app/lib/types";
import BlockViewer from "@/app/components/explorer/BlockViewer";
import { Building2, Users, HardDrive, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DepartmentChainExplorer() {
  const params = useParams();
  const id = params.id as string;

  const [department, setDepartment] = useState<DepartmentChain | null>(null);
  const [childClasses, setChildClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch department chain and its child classes in parallel
        const [deptRes, classRes] = await Promise.all([
          departmentAPI.getById(id),
          classAPI.getByDepartment(id),
        ]);

        if (deptRes.success) {
          setDepartment(deptRes.data);
        } else {
          throw new Error("Failed to fetch department chain.");
        }

        setChildClasses(classRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load department data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-20">
        Loading department chain...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-20">{error}</div>;
  }

  if (!department) {
    return (
      <div className="text-center text-gray-500 py-20">
        Department not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {department.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Explorer (Level 1 Chain)
            </p>
          </div>
        </div>
      </div>

      {/* Child Chains (Classes) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Level 2: Child Class Chains ({childClasses.length})
        </h2>
        <div className="space-y-3">
          {childClasses.length > 0 ? (
            childClasses.map((cls) => (
              <Link
                href={`/explorer/class/${cls.id}`}
                key={cls.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:border-purple-500 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-700">{cls.name}</h4>
                    <p className="text-sm text-gray-500">
                      {cls.chainLength || 0} Blocks
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No child classes found for this department.
            </p>
          )}
        </div>
      </div>

      {/* Block Chain Visualization */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">
          {department.name} Chain ({department.chain.length} Blocks)
        </h2>
        
        

        {department.chain.map((block) => (
          <BlockViewer
            key={block.hash}
            block={block}
            title={block.index === 0 ? "Genesis Block" : `Block #${block.index}`}
            chainColor="border-blue-500" // Department color
          />
        ))}
      </div>
    </div>
  );
}