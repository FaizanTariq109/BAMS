// frontend/app/validation/page.tsx
"use client";

import { useState } from "react";
import { validationAPI } from "@/app/lib/api";
import { SystemValidationResult } from "@/app/lib/types";
import { Shield, Activity, AlertTriangle } from "lucide-react";
import ValidationResultDisplay from "../components/validation/ValidationResultDisplay";

export default function ValidationPage() {
  const [result, setResult] = useState<SystemValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidation = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await validationAPI.validateSystem();
      if (res.success) {
        setResult(res.data);
      } else {
        throw new Error(res.error || "Validation API returned an error.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to run validation."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-gray-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              System Validation
            </h1>
            <p className="text-gray-600 mt-1">
              Check the integrity of all blockchains and cryptographic links.
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={handleValidation}
          disabled={isLoading}
          className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <Activity className="w-6 h-6 mr-3 animate-spin" />
          ) : (
            <Shield className="w-6 h-6 mr-3" />
          )}
          {isLoading ? "Validating System..." : "Run Full System Validation"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-100 text-red-800 rounded-lg">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h4 className="font-semibold">Validation Failed to Run</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && <ValidationResultDisplay result={result} />}
    </div>
  );
}
