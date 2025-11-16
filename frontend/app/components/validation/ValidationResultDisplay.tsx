// frontend/app/components/validation/ValidationResultDisplay.tsx
"use client";

import { SystemValidationResult, ValidationResult } from "@/app/lib/types";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";

interface ValidationResultDisplayProps {
  result: SystemValidationResult;
}

export default function ValidationResultDisplay({
  result,
}: ValidationResultDisplayProps) {
  const { isValid, summary, invalidEntities, details } = result;

  const StatCard = ({
    title,
    value,
    isValid,
  }: {
    title: string;
    value: string | number;
    isValid: boolean;
  }) => (
    <div
      className={`p-4 rounded-lg ${isValid ? "bg-green-100" : "bg-red-100"}`}
    >
      <p
        className={`text-sm font-medium ${
          isValid ? "text-green-800" : "text-red-800"
        }`}
      >
        {title}
      </p>
      <p
        className={`text-3xl font-bold ${
          isValid ? "text-green-900" : "text-red-900"
        }`}
      >
        {value}
      </p>
    </div>
  );

  const renderErrorDetails = (errors: string[]) => {
    return (
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error, i) => (
          <li key={i} className="text-sm text-red-700">
            {error}
          </li>
        ))}
      </ul>
    );
  };

  const getEntityName = (detail: ValidationResult) => {
    return detail.entityName
      ? `${detail.entityName} (${detail.entityId})`
      : detail.entityId;
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div
        className={`flex items-center space-x-4 p-6 rounded-lg shadow-md ${
          isValid ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}
      >
        {isValid ? (
          <ShieldCheck className="w-16 h-16" />
        ) : (
          <ShieldOff className="w-16 h-16" />
        )}
        <div>
          <h2 className="text-3xl font-bold">
            {isValid ? "System Validation Passed" : "System Validation Failed"}
          </h2>
          <p className="text-lg opacity-90">
            {isValid
              ? "All blockchain chains and cryptographic links are valid."
              : "Tampering detected! See details below."}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Departments"
          value={`${summary.validDepartments} / ${summary.totalDepartments}`}
          isValid={summary.validDepartments === summary.totalDepartments}
        />
        <StatCard
          title="Classes"
          value={`${summary.validClasses} / ${summary.totalClasses}`}
          isValid={summary.validClasses === summary.totalClasses}
        />
        <StatCard
          title="Students"
          value={`${summary.validStudents} / ${summary.totalStudents}`}
          isValid={summary.validStudents === summary.totalStudents}
        />
      </div>

      {/* Error Details */}
      {!isValid && (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-xl font-bold text-red-800 mb-4">
            Invalid Entities Detected
          </h3>
          <div className="space-y-4">
            {/* Department Errors */}
            {details.filter((d) => d.entityType === "department" && !d.isValid)
              .length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900">Departments:</h4>
                {details
                  .filter((d) => d.entityType === "department" && !d.isValid)
                  .map((d) => (
                    <div
                      key={d.entityId}
                      className="p-3 bg-red-50 rounded-md mt-2"
                    >
                      <p className="font-semibold text-red-900">
                        {getEntityName(d)}
                      </p>
                      {renderErrorDetails(d.errors)}
                    </div>
                  ))}
              </div>
            )}

            {/* Class Errors */}
            {details.filter((d) => d.entityType === "class" && !d.isValid)
              .length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900">Classes:</h4>
                {details
                  .filter((d) => d.entityType === "class" && !d.isValid)
                  .map((d) => (
                    <div
                      key={d.entityId}
                      className="p-3 bg-red-50 rounded-md mt-2"
                    >
                      <p className="font-semibold text-red-900">
                        {getEntityName(d)}
                      </p>
                      {renderErrorDetails(d.errors)}
                    </div>
                  ))}
              </div>
            )}

            {/* Student Errors */}
            {details.filter((d) => d.entityType === "student" && !d.isValid)
              .length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900">Students:</h4>
                {details
                  .filter((d) => d.entityType === "student" && !d.isValid)
                  .map((d) => (
                    <div
                      key={d.entityId}
                      className="p-3 bg-red-50 rounded-md mt-2"
                    >
                      <p className="font-semibold text-red-900">
                        {getEntityName(d)}
                      </p>
                      {renderErrorDetails(d.errors)}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
