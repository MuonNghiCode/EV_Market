"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import colors from "@/Utils/Color";
import { getMyAppointments } from "@/services";
import Swal from "sweetalert2";

export default function CheckoutResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [checkingAppointment, setCheckingAppointment] = useState(false);

  useEffect(() => {
    // Parse MoMo callback params
    const resultCode = searchParams.get("resultCode");
    const message = searchParams.get("message");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const transId = searchParams.get("transId");

    // Log for debugging
    console.log("MoMo Callback:", {
      resultCode,
      message,
      orderId,
      amount,
      transId,
    });

    // resultCode = 0 means success
    if (resultCode === "0") {
      setStatus("success");
      // Check if appointment was auto-created by backend
      checkForAppointment();
    } else {
      setStatus("failed");
    }

    setLoading(false);
  }, [searchParams]);

  const checkForAppointment = async () => {
    try {
      setCheckingAppointment(true);
      const orderId = searchParams.get("orderId");
      if (!orderId) return;

      // Backend tự tạo appointment khi thanh toán thành công
      // Chờ một chút để backend tạo xong
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await getMyAppointments(1, 20);
      const appointment = response.data.appointments.find(
        (apt) => apt.transactionId === orderId
      );

      if (appointment) {
        setAppointmentId(appointment.id);
      }
    } catch (err) {
      console.error("Failed to check for appointment:", err);
    } finally {
      setCheckingAppointment(false);
    }
  };

  const handleCreateAppointment = () => {
    // Backend đã tự tạo appointment, người dùng chỉ cần vào trang appointments để propose/confirm dates
    router.push("/appointments");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Đang xử lý kết quả thanh toán...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {status === "success" ? (
            <>
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
                Thanh toán cọc thành công!
              </h1>
              <p className="text-center text-gray-600 mb-2">
                Bạn đã thanh toán 10% tiền cọc thành công.
              </p>
              <p className="text-center text-sm text-gray-500 mb-8">
                Tiếp theo, vui lòng đặt lịch hẹn với người bán để kiểm tra xe.
              </p>

              {/* Appointment Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">
                      Bước tiếp theo: Đặt lịch hẹn
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Để hoàn tất giao dịch, bạn cần:
                    </p>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Đặt lịch hẹn gặp người bán tại bãi xe</li>
                      <li>Kiểm tra và xác nhận tình trạng xe</li>
                      <li>Thanh toán 90% còn lại nếu chấp nhận</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-semibold text-gray-900">
                    {searchParams.get("transId")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold text-gray-900">
                    {searchParams.get("orderId")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-semibold text-green-600">
                    {Number(searchParams.get("amount") || 0).toLocaleString()}{" "}
                    VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="font-semibold text-green-600">
                    {searchParams.get("message")}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                {/* Primary action: Create appointment */}
                <button
                  onClick={handleCreateAppointment}
                  disabled={checkingAppointment}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Calendar className="w-5 h-5" />
                  Đi đến trang lịch hẹn
                </button>

                {/* Secondary actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => router.push("/purchase-history")}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Xem lịch sử mua hàng
                  </button>
                  <button
                    onClick={() => router.push("/browse")}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Failed Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>

              {/* Failed Message */}
              <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
                Thanh toán thất bại
              </h1>
              <p className="text-center text-gray-600 mb-8">
                {searchParams.get("message") ||
                  "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại."}
              </p>

              {/* Error Details */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Mã lỗi:</span>
                  <span className="font-semibold text-red-600">
                    {searchParams.get("resultCode")}
                  </span>
                </div>
                {searchParams.get("orderId") && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-semibold text-gray-900">
                      {searchParams.get("orderId")}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => router.push("/browse")}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300"
                >
                  Quay về trang chủ
                </button>
              </div>
            </>
          )}

          {/* Back to Home Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
