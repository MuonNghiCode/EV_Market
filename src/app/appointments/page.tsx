"use client";

import { useEffect, useState } from "react";
import { getMyAppointments } from "@/services";
import { Appointment } from "@/types/appointment";
import AppointmentList from "@/components/Appointment/AppointmentList";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Clock, CheckCircle, XCircle } from "lucide-react";

type TabType = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMyAppointments(1, 50);
      setAppointments(response.data.appointments);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const transactionStatus = apt.transaction?.status;

    if (activeTab === "PENDING") {
      return apt.status === "PENDING";
    }

    if (activeTab === "CONFIRMED") {
      // Chỉ hiển thị appointment đã confirm nhưng chưa hoàn tất giao dịch
      return (
        apt.status === "CONFIRMED" &&
        transactionStatus !== "COMPLETED" &&
        transactionStatus !== "CANCELLED" &&
        transactionStatus !== "REFUNDED"
      );
    }

    if (activeTab === "COMPLETED") {
      // Hiển thị appointment hoàn tất HOẶC transaction đã completed
      return apt.status === "COMPLETED" || transactionStatus === "COMPLETED";
    }

    if (activeTab === "CANCELLED") {
      return (
        apt.status === "CANCELLED" ||
        transactionStatus === "CANCELLED" ||
        transactionStatus === "REFUNDED"
      );
    }

    return false;
  });

  const tabs = [
    {
      key: "PENDING" as TabType,
      label: "Đang chờ",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      key: "CONFIRMED" as TabType,
      label: "Đã xác nhận",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      key: "COMPLETED" as TabType,
      label: "Hoàn thành",
      icon: CheckCircle,
      color: "text-blue-600",
    },
    {
      key: "CANCELLED" as TabType,
      label: "Đã hủy",
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  const getCount = (status: TabType) => {
    return appointments.filter((apt) => {
      const transactionStatus = apt.transaction?.status;

      if (status === "PENDING") {
        return apt.status === "PENDING";
      }

      if (status === "CONFIRMED") {
        return (
          apt.status === "CONFIRMED" &&
          transactionStatus !== "COMPLETED" &&
          transactionStatus !== "CANCELLED" &&
          transactionStatus !== "REFUNDED"
        );
      }

      if (status === "COMPLETED") {
        return apt.status === "COMPLETED" || transactionStatus === "COMPLETED";
      }

      if (status === "CANCELLED") {
        return (
          apt.status === "CANCELLED" ||
          transactionStatus === "CANCELLED" ||
          transactionStatus === "REFUNDED"
        );
      }

      return false;
    }).length;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 mt-25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lịch hẹn của tôi
            </h1>
            <p className="text-gray-600">
              Quản lý các buổi hẹn gặp để kiểm tra xe giữa người mua và người
              bán. Lịch hẹn được tự động tạo khi bạn thanh toán cọc thành công.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const count = getCount(tab.key);
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition ${
                      isActive
                        ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? tab.color : "text-gray-400"
                      }`}
                    />
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Appointments List */}
          <div>
            <AppointmentList
              appointments={filteredAppointments}
              loading={loading}
              emptyMessage={`Không có lịch hẹn ${tabs
                .find((t) => t.key === activeTab)
                ?.label.toLowerCase()}`}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
