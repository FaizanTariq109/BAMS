// frontend/app/explorer/page.tsx
"use client";

import { useEffect, useState } from "react";
import { departmentAPI } from "@/app/lib/api";
import { Department } from "@/app/lib/types";
import { Search, Building2, HardDrive, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ExplorerPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await departmentAPI.getAll();
        setDepartments(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load departments.");
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-gray-500 py-10">Loading chains...</div>
      );
    }

    if (error) {
      return <div className="text-center text-red-500 py-10">{error}</div>;
    }

    if (departments.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <HardDrive className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No Blockchains Found</h3>
          <p className="text-sm">
            Create a department to initialize its blockchain.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {departments.map((dept) => (
          <Link
            href={`/explorer/department/${dept.id}`}
            key={dept.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-500 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-700">{dept.name}</h4>
                <p className="text-sm text-gray-500">
                  {dept.chainLength || 0} Blocks
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <Search className="w-8 h-8 text-gray-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Blockchain Explorer
            </h1>
            <p className="text-gray-600 mt-1">
              Select a root chain to begin exploring the hierarchy.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Level 1: Department Chains
        </h2>
        {renderContent()}
      </div>
    </div>
  );
}
