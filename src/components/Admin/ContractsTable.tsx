"use client";
import React, { useState, memo } from "react";
import { Contract } from "@/types/admin";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  User,
  Eye,
  Car,
  Battery,
  Mail,
  X,
  ExternalLink,
} from "lucide-react";

interface ContractsTableProps {
  contracts: Contract[];
}

// Detail Modal Component
const ContractDetailModal = ({
  contract,
  isOpen,
  onClose,
}: {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!contract || !isOpen) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";
      case "SHIPPED":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-purple-100 text-purple-700";
      case "REFUNDED":
        return "bg-orange-100 text-orange-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Đã thanh toán";
      case "SHIPPED":
        return "Đang giao hàng";
      case "COMPLETED":
        return "Hoàn thành";
      case "REFUNDED":
        return "Đã hoàn tiền";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Chi tiết hợp đồng
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Contract Info */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Thông tin hợp đồng
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Mã hợp đồng:</span>
                <span className="font-mono text-sm text-blue-900">
                  {contract.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Mã giao dịch:</span>
                <span className="font-mono text-sm text-blue-900">
                  {contract.transactionId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Ngày tạo:</span>
                <span className="font-medium text-blue-900">
                  {formatDateTime(contract.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Thông tin giao dịch
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Giá trị:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(contract.transaction.finalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                    contract.transaction.status
                  )}`}
                >
                  {getStatusLabel(contract.transaction.status)}
                </span>
              </div>
              {contract.transaction.vehicle && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Car className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    {contract.transaction.vehicle.title}
                  </span>
                </div>
              )}
              {contract.transaction.battery && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Battery className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">
                    {contract.transaction.battery.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Buyer & Seller Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Buyer */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Người mua
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Tên:</span>
                  <span className="font-medium text-green-900">
                    {contract.buyer.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-900">
                    {contract.buyer.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Seller */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Người bán
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-orange-700">Tên:</span>
                  <span className="font-medium text-orange-900">
                    {contract.seller.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-900">
                    {contract.seller.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Document */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Tài liệu hợp đồng
            </h4>
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Hợp đồng mua bán
                  </p>
                  <p className="text-sm text-gray-500">PDF Document</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={contract.contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Xem
                </a>
                <a
                  href={contract.contractUrl}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Tải xuống
                </a>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoized row component
const ContractRow = memo(
  ({
    contract,
    onViewDetails,
  }: {
    contract: Contract;
    onViewDetails: (contract: Contract) => void;
  }) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "PAID":
          return "bg-green-100 text-green-700";
        case "SHIPPED":
          return "bg-blue-100 text-blue-700";
        case "COMPLETED":
          return "bg-purple-100 text-purple-700";
        case "REFUNDED":
          return "bg-orange-100 text-orange-700";
        case "CANCELLED":
          return "bg-red-100 text-red-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case "PAID":
          return "Đã thanh toán";
        case "SHIPPED":
          return "Đang giao";
        case "COMPLETED":
          return "Hoàn thành";
        case "REFUNDED":
          return "Hoàn tiền";
        case "CANCELLED":
          return "Đã hủy";
        default:
          return status;
      }
    };

    return (
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Contract ID */}
        <td className="px-6 py-4">
          <p className="font-mono text-sm text-gray-900">
            {contract.id.substring(0, 12)}...
          </p>
        </td>

        {/* Product */}
        <td className="px-6 py-4">
          {contract.transaction.vehicle ? (
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">
                {contract.transaction.vehicle.title}
              </span>
            </div>
          ) : contract.transaction.battery ? (
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-gray-900">
                {contract.transaction.battery.title}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </td>

        {/* Buyer */}
        <td className="px-6 py-4">
          <div>
            <p className="font-medium text-gray-900">{contract.buyer.name}</p>
            <p className="text-sm text-gray-500">{contract.buyer.email}</p>
          </div>
        </td>

        {/* Seller */}
        <td className="px-6 py-4">
          <div>
            <p className="font-medium text-gray-900">{contract.seller.name}</p>
            <p className="text-sm text-gray-500">{contract.seller.email}</p>
          </div>
        </td>

        {/* Price */}
        <td className="px-6 py-4 whitespace-nowrap">
          <p className="font-bold text-green-600">
            {formatPrice(contract.transaction.finalPrice)}
          </p>
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              contract.transaction.status
            )}`}
          >
            {getStatusLabel(contract.transaction.status)}
          </span>
        </td>

        {/* Date */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {formatDate(contract.createdAt)}
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <button
            onClick={() => onViewDetails(contract)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all duration-200 font-medium text-sm cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Xem chi tiết
          </button>
        </td>
      </tr>
    );
  }
);

ContractRow.displayName = "ContractRow";

export default function ContractsTable({ contracts }: ContractsTableProps) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Không có hợp đồng
        </h3>
        <p className="text-gray-600">
          Không tìm thấy hợp đồng nào với bộ lọc hiện tại
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mã hợp đồng
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Người mua
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Người bán
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Giá trị
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contracts.map((contract) => (
              <ContractRow
                key={contract.id}
                contract={contract}
                onViewDetails={handleViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <ContractDetailModal
        contract={selectedContract}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedContract(null);
        }}
      />
    </div>
  );
}
