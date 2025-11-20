"use client";
import React, { useState, memo } from "react";
import { Appointment } from "@/types/admin";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Eye,
  Car,
  Battery,
  MapPin,
  Mail,
  X,
} from "lucide-react";
import Image from "next/image";

interface AppointmentsTableProps {
  appointments: Appointment[];
}

// Detail Modal Component
const AppointmentDetailModal = ({
  appointment,
  isOpen,
  onClose,
}: {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!appointment || !isOpen) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ xác nhận";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";
      case "DEPOSIT_PAID":
        return "bg-blue-100 text-blue-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTransactionStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Đã thanh toán";
      case "DEPOSIT_PAID":
        return "Đã đặt cọc";
      case "PENDING":
        return "Chờ xử lý";
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
            Chi tiết lịch hẹn
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
          {/* Status */}
          <div className="mb-6">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                appointment.status
              )}`}
            >
              {appointment.status === "CONFIRMED" ? (
                <CheckCircle className="w-5 h-5" />
              ) : appointment.status === "CANCELLED" ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
              {getStatusLabel(appointment.status)}
            </span>
          </div>

          {/* Transaction Info */}
          {appointment.transaction && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Thông tin giao dịch
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-mono text-sm text-gray-900">
                    {appointment.transactionId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Trạng thái giao dịch:</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTransactionStatusColor(
                      appointment.transaction.status
                    )}`}
                  >
                    {getTransactionStatusLabel(appointment.transaction.status)}
                  </span>
                </div>
                {appointment.transaction.vehicle && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <Car className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">
                      {appointment.transaction.vehicle.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Images */}
          {appointment.transaction?.vehicle?.images &&
            appointment.transaction.vehicle.images.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Hình ảnh xe
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {appointment.transaction.vehicle.images.map(
                    (image: string, idx: number) => (
                      <div
                        key={idx}
                        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
                      >
                        <img
                          src={image}
                          alt={`Vehicle ${idx + 1}`}
                          className="w-full h-full object-cover transition group-hover:scale-110"
                          onClick={() => window.open(image, "_blank")}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                            Xem lớn
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Buyer & Seller Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Buyer */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Người mua
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-700">Tên:</span>
                  <span className="font-medium text-blue-900">
                    {appointment.buyer.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    {appointment.buyer.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Seller */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Người bán
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700">Tên:</span>
                  <span className="font-medium text-green-900">
                    {appointment.seller.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-900">
                    {appointment.seller.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Proposed Dates */}
          {appointment.buyerProposedDates &&
            appointment.buyerProposedDates.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Ngày đề xuất từ người mua
                </h4>
                <div className="space-y-2">
                  {appointment.buyerProposedDates.map((date, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        appointment.confirmedDate === date
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">
                        {formatDateTime(date)}
                      </span>
                      {appointment.confirmedDate === date && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {appointment.sellerProposedDates &&
            appointment.sellerProposedDates.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Ngày đề xuất từ người bán
                </h4>
                <div className="space-y-2">
                  {appointment.sellerProposedDates.map((date, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        appointment.confirmedDate === date
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">
                        {formatDateTime(date)}
                      </span>
                      {appointment.confirmedDate === date && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Confirmed Date */}
          {appointment.confirmedDate && (
            <div className="mb-6 bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Ngày hẹn đã xác nhận
              </h4>
              <p className="text-2xl font-bold text-green-700">
                {formatDateTime(appointment.confirmedDate)}
              </p>
            </div>
          )}

          {/* Location */}
          {appointment.location && (
            <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Địa điểm gặp mặt
              </h4>
              <p className="text-lg font-medium text-blue-900">
                {appointment.location}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-sm">Ngày tạo</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(appointment.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm">Cập nhật</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(appointment.updatedAt)}
                </p>
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
const AppointmentRow = memo(
  ({
    appointment,
    onViewDetails,
  }: {
    appointment: Appointment;
    onViewDetails: (appointment: Appointment) => void;
  }) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "PENDING":
          return "bg-yellow-100 text-yellow-700";
        case "CONFIRMED":
          return "bg-blue-100 text-blue-700";
        case "COMPLETED":
          return "bg-green-100 text-green-700";
        case "CANCELLED":
          return "bg-red-100 text-red-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case "PENDING":
          return "Chờ xác nhận";
        case "CONFIRMED":
          return "Đã xác nhận";
        case "COMPLETED":
          return "Hoàn thành";
        case "CANCELLED":
          return "Đã hủy";
        default:
          return status;
      }
    };

    return (
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Transaction ID */}
        <td className="px-6 py-4">
          <p className="font-mono text-sm text-gray-900">
            {appointment.transactionId.substring(0, 8)}...
          </p>
        </td>

        {/* Vehicle/Battery */}
        <td className="px-6 py-4">
          {appointment.transaction?.vehicle ? (
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">
                {appointment.transaction.vehicle.title}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </td>

        {/* Buyer */}
        <td className="px-6 py-4">
          <div>
            <p className="font-medium text-gray-900">
              {appointment.buyer.name}
            </p>
            <p className="text-sm text-gray-500">{appointment.buyer.email}</p>
          </div>
        </td>

        {/* Seller */}
        <td className="px-6 py-4">
          <div>
            <p className="font-medium text-gray-900">
              {appointment.seller.name}
            </p>
            <p className="text-sm text-gray-500">{appointment.seller.email}</p>
          </div>
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              appointment.status
            )}`}
          >
            {getStatusLabel(appointment.status)}
          </span>
        </td>

        {/* Date */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {formatDate(appointment.createdAt)}
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <button
            onClick={() => onViewDetails(appointment)}
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

AppointmentRow.displayName = "AppointmentRow";

export default function AppointmentsTable({
  appointments,
}: AppointmentsTableProps) {
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Không có lịch hẹn
        </h3>
        <p className="text-gray-600">
          Không tìm thấy lịch hẹn nào với bộ lọc hiện tại
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
                Mã GD
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
            {appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                onViewDetails={handleViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAppointment(null);
        }}
      />
    </div>
  );
}
