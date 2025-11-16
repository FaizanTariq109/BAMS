"use client";

import { useEffect, useState } from "react";
import { departmentAPI, classAPI, studentAPI, attendanceAPI } from "./lib/api";
import {
  Building2,
  Users,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

/**
 * Dashboard Component
 *
 * WHY: Overview of the entire system
 * - Quick statistics
 * - Today's attendance summary
 * - Links to main sections
 * - System health indicators
 */

export default function Dashboard() {
  const [stats, setStats] = useState({
    departments: 0,
    classes: 0,
    students: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLeave: 0,
    todayMarked: 0,
    todayTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all data
      const [deptRes, classRes, studentRes, todayRes] = await Promise.all([
        departmentAPI.getAll(),
        classAPI.getAll(),
        studentAPI.getAll(),
        attendanceAPI.getToday(),
      ]);

      setStats({
        departments: deptRes.data?.length || 0,
        classes: classRes.data?.length || 0,
        students: studentRes.data?.length || 0,
        todayPresent: todayRes.data?.summary?.present || 0,
        todayAbsent: todayRes.data?.summary?.absent || 0,
        todayLeave: todayRes.data?.summary?.leave || 0,
        todayMarked: todayRes.data?.summary?.marked || 0,
        todayTotal: todayRes.data?.summary?.total || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, href }: any) => (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : value}
            </p>
          </div>
          <div
            className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </Link>
  );

  const attendancePercentage =
    stats.todayTotal > 0
      ? Math.round((stats.todayPresent / stats.todayTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Blockchain Attendance Management System
        </h1>
        <p className="text-gray-600 mt-2">
          Multi-layered blockchain with cryptographic immutability
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Building2}
          label="Departments"
          value={stats.departments}
          color="bg-blue-500"
          href="/departments"
        />
        <StatCard
          icon={Users}
          label="Classes"
          value={stats.classes}
          color="bg-purple-500"
          href="/classes"
        />
        <StatCard
          icon={GraduationCap}
          label="Students"
          value={stats.students}
          color="bg-green-500"
          href="/students"
        />
      </div>

      {/* Today's Attendance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Today's Attendance Overview
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Marked: {stats.todayMarked} / {stats.todayTotal}
                </span>
                <span>{attendancePercentage}% Present</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-green-500 h-4 transition-all duration-500"
                  style={{
                    width: `${
                      (stats.todayMarked / stats.todayTotal) * 100 || 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Attendance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.todayPresent}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-700">
                    {stats.todayAbsent}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Leave</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {stats.todayLeave}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Users className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Unmarked</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {stats.todayTotal - stats.todayMarked}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 text-center">
              <Link
                href="/attendance"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Mark Attendance
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/explorer">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold mb-2">Blockchain Explorer</h3>
            <p className="text-blue-100 text-sm">
              View complete blockchain hierarchy and blocks
            </p>
          </div>
        </Link>

        <Link href="/validation">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold mb-2">Validate System</h3>
            <p className="text-purple-100 text-sm">
              Verify blockchain integrity and detect tampering
            </p>
          </div>
        </Link>

        <Link href="/students">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold mb-2">Student Ledgers</h3>
            <p className="text-green-100 text-sm">
              View individual student attendance blockchains
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
