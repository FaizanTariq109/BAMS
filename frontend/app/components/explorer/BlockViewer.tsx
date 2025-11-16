// frontend/app/components/explorer/BlockViewer.tsx
"use client";

import { Block } from "@/app/lib/types";
import { Hash, Clock, Database, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface BlockViewerProps {
  block: Block;
  title: string; // e.g., "Block #1" or "Genesis Block"
  chainColor?: string; // e.g., 'border-blue-500'
}

export default function BlockViewer({
  block,
  title,
  chainColor = "border-gray-300",
}: BlockViewerProps) {
  const [isDataOpen, setIsDataOpen] = useState(false);
  const isGenesis = block.index === 0;

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "ATTENDANCE":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-t-4 ${chainColor} overflow-hidden`}
    >
      {/* Block Header */}
      <div className="p-4 border-b">
        <h4 className="text-lg font-bold">{title}</h4>
      </div>

      {/* Block Info */}
      <div className="p-4 space-y-3 text-sm">
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-700">Hash</span>
        </div>
        <p className="font-mono text-xs text-green-700 break-all bg-gray-50 p-2 rounded">
          {block.hash}
        </p>

        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-700">Prev. Hash</span>
        </div>
        <p
          className={`font-mono text-xs break-all bg-gray-50 p-2 rounded ${
            isGenesis ? "text-gray-400" : "text-red-700"
          }`}
        >
          {block.prev_hash}
        </p>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-700">Timestamp</span>
              <p className="text-xs text-gray-600">
                {new Date(block.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Nonce</span>
            <p className="font-mono text-xs text-gray-600">{block.nonce}</p>
          </div>
        </div>
      </div>

      {/* Transactions / Data */}
      <div className="border-t">
        <button
          onClick={() => setIsDataOpen(!isDataOpen)}
          className="flex items-center justify-between w-full p-4 text-left font-semibold"
        >
          <span>Block Data ({block.transactions.length} Tx)</span>
          {isDataOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {isDataOpen && (
          <div className="p-4 bg-gray-50 border-t">
            {block.transactions.map((tx, index) => (
              <div key={index} className="mb-2 p-2 border rounded bg-white">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTransactionTypeColor(
                    tx.type
                  )}`}
                >
                  {tx.type}
                </span>
                <pre className="mt-2 text-xs text-gray-700 overflow-auto">
                  {JSON.stringify(tx.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
