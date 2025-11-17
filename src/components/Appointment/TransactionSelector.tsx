"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Transaction } from "@/services/Transaction";
import { Calendar, CheckCircle } from "lucide-react";

interface TransactionSelectorProps {
  transactions: Transaction[];
  onSelect: (transactionId: string) => void;
  onCancel: () => void;
}

export default function TransactionSelector({
  transactions,
  onSelect,
  onCancel,
}: TransactionSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getItemTitle = (transaction: Transaction) => {
    const item: any = transaction.vehicle || transaction.battery;
    return item?.title || item?.name || "Unknown";
  };

  const getItemImage = (transaction: Transaction) => {
    const item: any = transaction.vehicle || transaction.battery;
    return item?.images?.[0] || "/placeholder-vehicle.jpg";
  };

  const getItemType = (transaction: Transaction) => {
    return transaction.vehicle ? "Xe điện" : "Pin";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <h2 className="text-2xl font-bold">
              Chọn giao dịch để tạo lịch hẹn
            </h2>
          </div>
          <p className="text-blue-100 mt-2">
            Chọn xe hoặc pin mà bạn muốn đặt lịch hẹn kiểm tra
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => setSelectedId(transaction.id)}
                className={`relative cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 ${
                  selectedId === transaction.id
                    ? "border-blue-600 bg-blue-50 shadow-lg"
                    : "border-gray-200 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                {/* Selected Indicator */}
                {selectedId === transaction.id && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-6 h-6 text-blue-600 fill-blue-100" />
                  </div>
                )}

                {/* Image */}
                <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={getItemImage(transaction)}
                    alt={getItemTitle(transaction)}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {getItemType(transaction)}
                  </div>
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {getItemTitle(transaction)}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã GD:</span>
                      <span className="font-mono text-xs text-gray-800">
                        {transaction.id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá trị:</span>
                      <span className="font-semibold text-green-600">
                        {transaction.finalPrice.toLocaleString()} VNĐ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Đã cọc 10%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span className="text-gray-800">
                        {new Date(transaction.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Không có giao dịch nào để tạo lịch hẹn
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold transition-all duration-300"
          >
            Hủy
          </button>
          <button
            onClick={() => selectedId && onSelect(selectedId)}
            disabled={!selectedId}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
