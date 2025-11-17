"use client";

import { useEffect, useState } from "react";
import {
  Appointment,
  AppointmentVehicle,
  AppointmentBattery,
} from "@/types/appointment";
import {
  Calendar,
  Clock,
  User,
  Car,
  Battery,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatAppointmentDate, getCurrentUserId } from "@/services";
import Image from "next/image";
import Link from "next/link";

interface AppointmentListProps {
  appointments: Appointment[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function AppointmentList({
  appointments,
  loading = false,
  emptyMessage = "Không có lịch hẹn nào",
}: AppointmentListProps) {
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const loadUserId = async () => {
      const userId = await getCurrentUserId();
      if (userId) setCurrentUserId(userId);
    };
    loadUserId();
  }, []);

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: {
        text: "Đang chờ",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      CONFIRMED: {
        text: "Đã xác nhận",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      COMPLETED: {
        text: "Hoàn thành",
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
      },
      CANCELLED: {
        text: "Đã hủy",
        color: "bg-red-100 text-red-800",
        icon: AlertCircle,
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getUserRole = (appointment: Appointment) => {
    return appointment.buyerId === currentUserId ? "buyer" : "seller";
  };

  const getOtherParty = (appointment: Appointment) => {
    const isBuyer = appointment.buyerId === currentUserId;
    return isBuyer ? appointment.seller : appointment.buyer;
  };

  const getTransactionStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: "Chờ thanh toán",
      DEPOSIT_PAID: "Đã cọc 10%",
      APPOINTMENT_SCHEDULED: "Đã đặt lịch hẹn",
      PAID: "Đã thanh toán đầy đủ",
      COMPLETED: "Hoàn tất",
      CANCELLED: "Đã hủy",
      REFUNDED: "Đã hoàn tiền",
      SHIPPED: "Đang giao hàng",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center shadow">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {appointments.map((appointment) => {
        const otherParty = getOtherParty(appointment);
        const userRole = getUserRole(appointment);

        // Lấy item từ transaction.vehicle hoặc transaction.battery
        const item =
          appointment.transaction?.vehicle || appointment.transaction?.battery;
        const isVehicle = !!appointment.transaction?.vehicle;

        // Lấy title/name từ item
        const itemTitle = item
          ? (item as any).title || (item as any).name || "Sản phẩm"
          : "Sản phẩm";
        const mainImage = item?.images?.[0] || "/placeholder-vehicle.jpg";

        return (
          <Link
            key={appointment.id}
            href={`/appointments/${appointment.id}`}
            className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition block"
          >
            <div className="flex gap-4">
              {/* Image */}
              <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {mainImage && mainImage !== "/placeholder-vehicle.jpg" ? (
                  <Image
                    src={mainImage}
                    alt={itemTitle}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {isVehicle ? (
                      <Car className="w-12 h-12" />
                    ) : (
                      <Battery className="w-12 h-12" />
                    )}
                  </div>
                )}
                {isVehicle ? (
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-1 rounded">
                    <Car className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="absolute bottom-2 right-2 bg-green-600 text-white p-1 rounded">
                    <Battery className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {itemTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>
                        {userRole === "buyer" ? "Người bán" : "Người mua"}:
                      </span>
                      <span className="font-medium">
                        {otherParty?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                {/* Date Info */}
                {appointment.confirmedDate ? (
                  <div className="flex items-start gap-2 text-sm text-gray-700 mb-2 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">
                        Lịch đã xác nhận:
                      </p>
                      <p className="text-green-700">
                        {formatAppointmentDate(appointment.confirmedDate)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Chờ xác nhận lịch hẹn</p>
                      {userRole === "buyer" &&
                        appointment.buyerProposedDates.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Đã gửi {appointment.buyerProposedDates.length} đề
                            xuất
                          </p>
                        )}
                      {userRole === "seller" &&
                        appointment.sellerProposedDates.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Đã gửi {appointment.sellerProposedDates.length} đề
                            xuất
                          </p>
                        )}
                    </div>
                  </div>
                )}

                {/* Transaction Status */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    Giao dịch:{" "}
                    <span className="font-medium text-blue-600">
                      {getTransactionStatusText(appointment.transaction?.status || "")}
                    </span>
                  </span>
                </div>

                {/* Timestamps */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Tạo:{" "}
                    {new Date(appointment.createdAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                  <span>
                    Cập nhật:{" "}
                    {new Date(appointment.updatedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
