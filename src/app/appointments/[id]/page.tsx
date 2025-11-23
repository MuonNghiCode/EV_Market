"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getMyAppointments,
  getCurrentUserId,
  canProposeDate,
  canConfirmAppointment,
  cancelAppointmentWithRefund,
  payRemainder,
  rejectTransaction,
} from "@/services";
import {
  Appointment,
  AppointmentVehicle,
  AppointmentBattery,
} from "@/types/appointment";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AppointmentScheduler from "@/components/Appointment/AppointmentScheduler";
import AppointmentConfirmation from "@/components/Appointment/AppointmentConfirmation";
import {
  Calendar,
  User,
  Car,
  Battery,
  MapPin,
  Clock,
  CheckCircle,
  ArrowLeft,
  XCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const userId = await getCurrentUserId();
      if (userId) setCurrentUserId(userId);
      await loadAppointment();
    };
    loadData();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      // Backend không có route get by ID, phải lọc từ list
      const response = await getMyAppointments(1, 100);
      const found = response.data.appointments.find(
        (apt) => apt.id === appointmentId
      );

      if (!found) {
        setError("Không tìm thấy lịch hẹn");
      } else {
        setAppointment(found);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const handleProposed = () => {
    setShowScheduler(false);
    loadAppointment();
  };

  const handleConfirmed = () => {
    loadAppointment();
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Hủy lịch hẹn?",
      html: `
        <p>Bạn có chắc chắn muốn hủy lịch hẹn này?</p>
        <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
          <p class="font-medium text-green-800 mb-2">Hoàn tiền cọc:</p>
          <p class="text-sm text-green-700">
            Khoản cọc 10% của bạn sẽ được hoàn lại vào ví trong vòng 24-48 giờ.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận hủy",
      cancelButtonText: "Không, giữ lại",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const transactionId = appointment?.transactionId;
        if (!transactionId) {
          throw new Error("Transaction ID not found");
        }

        const cancelResult = await cancelAppointmentWithRefund(
          appointmentId,
          transactionId
        );

        if (cancelResult.refundError) {
          await Swal.fire({
            title: "Đã hủy lịch hẹn",
            html: `
              <p class="text-green-600 mb-4">Lịch hẹn đã được hủy thành công</p>
              <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <p class="font-medium text-yellow-800 mb-2">Lưu ý về hoàn tiền:</p>
                <p class="text-sm text-yellow-700">${cancelResult.refundError}</p>
                <p class="text-sm text-yellow-700 mt-2">Vui lòng liên hệ bộ phận hỗ trợ để được hỗ trợ.</p>
              </div>
            `,
            icon: "warning",
          });
        } else {
          await Swal.fire({
            title: "Thành công!",
            html: `
              <p class="text-green-600 mb-4">Lịch hẹn đã được hủy</p>
              <p class="text-green-600">Yêu cầu hoàn tiền đã được gửi</p>
              <p class="text-sm text-gray-600 mt-2">Tiền cọc sẽ được hoàn lại trong 24-48 giờ</p>
            `,
            icon: "success",
          });
        }

        router.push("/appointments");
      } catch (err: any) {
        await Swal.fire({
          title: "Lỗi!",
          text: err.message || "Không thể hủy lịch hẹn",
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAcceptInspection = async () => {
    const isAuction = appointment?.transaction?.type === "AUCTION";
    const result = await Swal.fire({
      title: isAuction ? "Xác nhận xe đã nhận đủ?" : "Xác nhận xe đạt yêu cầu?",
      html: isAuction
        ? `<p class="mb-4">Sau khi xác nhận, giao dịch sẽ hoàn tất và bạn sẽ nhận xe.</p>`
        : `<p class="mb-4">Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán 90% còn lại.</p>
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <p class="font-medium text-blue-800 mb-2">Thanh toán:</p>
            <p class="text-sm text-blue-700">
              Bạn đã cọc 10%. Cần thanh toán thêm 90% để hoàn tất giao dịch.
            </p>
          </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: isAuction
        ? "Xác nhận đã nhận xe"
        : "Đồng ý, thanh toán ngay",
      cancelButtonText: "Để tôi kiểm tra lại",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const transactionId = appointment?.transactionId;
        if (!transactionId) {
          throw new Error("Transaction ID not found");
        }

        if (isAuction) {
          // Gọi API xác nhận đã nhận xe cho AUCTION
          const { confirmReceipt } = await import("@/services/Transaction");
          await confirmReceipt(transactionId);
          await Swal.fire({
            icon: "success",
            title: "Đã xác nhận xe AUCTION",
            text: "Bạn đã xác nhận nhận xe thành công. Giao dịch hoàn tất!",
            timer: 2000,
          });
          loadAppointment();
        } else {
          // SALE: logic cũ thanh toán 90%
          const paymentMethodResult = await Swal.fire({
            title: "Chọn phương thức thanh toán",
            html: `
              <div class="space-y-3">
                <button id="momo-btn" class="w-full p-4 border-2 border-pink-500 rounded-lg hover:bg-pink-50 transition">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold">M</div>
                    <div class="text-left">
                      <p class="font-semibold">MoMo</p>
                      <p class="text-sm text-gray-600">Thanh toán qua ví MoMo</p>
                    </div>
                  </div>
                </button>
                <button id="wallet-btn" class="w-full p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">W</div>
                    <div class="text-left">
                      <p class="font-semibold">Ví EV Market</p>
                      <p class="text-sm text-gray-600">Thanh toán từ số dư ví</p>
                    </div>
                  </div>
                </button>
              </div>
            `,
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: "Hủy",
            didOpen: () => {
              const momoBtn = document.getElementById("momo-btn");
              const walletBtn = document.getElementById("wallet-btn");

              momoBtn?.addEventListener("click", () => {
                Swal.clickConfirm();
                (Swal as any).paymentMethod = "MOMO";
              });

              walletBtn?.addEventListener("click", () => {
                Swal.clickConfirm();
                (Swal as any).paymentMethod = "WALLET";
              });
            },
          });

          if (paymentMethodResult.dismiss) {
            setLoading(false);
            return;
          }

          const paymentMethod = (Swal as any).paymentMethod || "MOMO";
          const redirectUrl = `${window.location.origin}/checkout/result?appointmentId=${appointmentId}`;

          const paymentResponse = await payRemainder(
            transactionId,
            paymentMethod,
            redirectUrl
          );

          console.log("PayRemainder response:", paymentResponse);

          // Redirect to payment URL
          if (paymentResponse.data.paymentUrl) {
            window.location.href = paymentResponse.data.paymentUrl;
          } else {
            throw new Error("Payment URL not found");
          }
        }
      } catch (err: any) {
        await Swal.fire({
          title: "Lỗi!",
          text: err.message || "Không thể thực hiện xác nhận/ thanh toán",
          icon: "error",
        });
        setLoading(false);
      }
    }
  };

  const handleRejectInspection = async () => {
    const result = await Swal.fire({
      title: "Từ chối giao dịch?",
      html: `
        <p class="mb-4">Xe không đúng như mô tả hoặc không đạt yêu cầu?</p>
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-left">
          <p class="font-medium text-red-800 mb-2">Lưu ý:</p>
          <p class="text-sm text-red-700">
            Giao dịch sẽ bị từ chối và khoản cọc 10% sẽ được hoàn lại trong 24-48 giờ.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận từ chối",
      cancelButtonText: "Quay lại",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const transactionId = appointment?.transactionId;
        if (!transactionId) {
          throw new Error("Transaction ID not found");
        }

        // Call reject transaction API
        await rejectTransaction(transactionId);

        await Swal.fire({
          title: "Thành công!",
          html: `
            <p class="text-green-600 mb-4">Giao dịch đã được từ chối</p>
            <p class="text-sm text-gray-600 mt-2">Khoản cọc 10% sẽ được hoàn lại trong 24-48 giờ</p>
          `,
          icon: "success",
        });

        router.push("/appointments");
      } catch (err: any) {
        await Swal.fire({
          title: "Lỗi!",
          text: err.message || "Không thể từ chối giao dịch",
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg p-8 shadow animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !appointment) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
              {error || "Không tìm thấy lịch hẹn"}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const userRole = appointment.buyerId === currentUserId ? "buyer" : "seller";
  const otherParty =
    userRole === "buyer" ? appointment.seller : appointment.buyer;

  // Check từ transaction.vehicle/battery trước vì đáng tin cậy hơn vehicleId/batteryId
  const hasVehicle = !!appointment.transaction?.vehicle;
  const hasBattery = !!appointment.transaction?.battery;
  const isVehicle =
    hasVehicle || (!hasBattery && appointment.vehicleId !== null);

  // Appointment đã có sẵn transaction.vehicle/battery với images
  const item =
    appointment.transaction?.vehicle || appointment.transaction?.battery;
  const transaction = appointment.transaction;

  // Debug confirmation button visibility
  console.log("Confirmation button debug:", {
    hasConfirmedDate: !!appointment.confirmedDate,
    confirmedDate: appointment.confirmedDate,
    isPastConfirmedDate: appointment.confirmedDate
      ? new Date(appointment.confirmedDate) <= new Date()
      : false,
    currentTime: new Date(),
    userRole,
    appointmentStatus: appointment.status,
    transactionStatus: transaction?.status,
    shouldShowButton: !!(
      appointment.confirmedDate &&
      userRole === "buyer" &&
      appointment.status === "CONFIRMED" &&
      new Date(appointment.confirmedDate) <= new Date() &&
      (transaction?.status === "DEPOSIT_PAID" ||
        transaction?.status === "APPOINTMENT_SCHEDULED")
    ),
  });

  // Debug
  console.log("Appointment data:", {
    vehicleId: appointment.vehicleId,
    batteryId: appointment.batteryId,
    hasVehicle,
    hasBattery,
    isVehicle,
    transaction: appointment.transaction,
    item,
    itemTitle: item ? (item as any).title || (item as any).name : "NO ITEM",
    images: item?.images,
  });

  const canPropose = canProposeDate(appointment, currentUserId);
  const canConfirm = canConfirmAppointment(appointment, currentUserId);
  const proposedDates =
    userRole === "buyer"
      ? appointment.sellerProposedDates
      : appointment.buyerProposedDates;

  const getItemTitle = () => {
    if (!item) {
      console.log("No item found");
      return "Không có thông tin sản phẩm";
    }
    // Vehicle có title, Battery có name
    const title = (item as any).title || (item as any).name || "Không có tên";
    return title;
  };

  const getStatusBadge = () => {
    const badges = {
      PENDING: {
        text: "Đang chờ",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      CONFIRMED: {
        text: "Đã xác nhận",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      COMPLETED: {
        text: "Hoàn thành",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      CANCELLED: {
        text: "Đã hủy",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    };
    const badge =
      badges[appointment.status as keyof typeof badges] || badges.PENDING;
    return (
      <span
        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${badge.color}`}
      >
        {badge.text}
      </span>
    );
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 mt-25">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>

          {/* Appointment Info */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Chi tiết lịch hẹn</h1>
              </div>
              <p className="text-blue-100">ID: {appointment.id}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Vehicle/Battery Info */}
              <div className="flex gap-6 mb-6 pb-6 border-b">
                <div className="relative w-48 h-36 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {item?.images?.[0] ? (
                    <Image
                      src={item.images[0]}
                      alt={getItemTitle()}
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
                    <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      <Car className="w-4 h-4 inline mr-1" />
                      Xe điện
                    </div>
                  ) : (
                    <div className="absolute bottom-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                      <Battery className="w-4 h-4 inline mr-1" />
                      Pin xe
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {getItemTitle()}
                  </h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>
                        {userRole === "buyer" ? "Người bán" : "Người mua"}:
                      </span>
                      <span className="font-medium text-gray-800">
                        {otherParty?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Giao dịch:</span>
                      <span className="font-medium text-blue-600">
                        {getTransactionStatusText(
                          appointment.transaction?.status || ""
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Info Card */}
              {transaction && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    Thông tin giao dịch
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Mã giao dịch</p>
                      <p className="font-mono font-semibold text-gray-900 text-xs">
                        {transaction.id.slice(0, 12)}...
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">
                        Trạng thái thanh toán
                      </p>
                      <p className="font-semibold text-green-600 text-sm">
                        {getTransactionStatusText(transaction.status)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmed Date */}
              {appointment.confirmedDate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-green-800 mb-1">
                        Lịch hẹn đã xác nhận
                      </h3>
                      <p className="text-green-700 text-lg">
                        {new Date(appointment.confirmedDate).toLocaleString(
                          "vi-VN",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Hãy có mặt đúng giờ để kiểm tra xe tại bãi
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meeting Location */}
              {appointment.location && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-800 mb-1">
                        Địa điểm gặp mặt
                      </h3>
                      <p className="text-blue-700 text-base">
                        {appointment.location}
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        Hãy đến đúng địa chỉ này để kiểm tra và giao dịch
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Confirmation After Meeting - Show from the meeting time onwards */}
              {appointment.confirmedDate &&
                userRole === "buyer" &&
                appointment.status === "CONFIRMED" &&
                new Date(appointment.confirmedDate) <= new Date() &&
                (transaction?.status === "DEPOSIT_PAID" ||
                  transaction?.status === "APPOINTMENT_SCHEDULED") && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-yellow-600" />
                        Xác nhận sau khi kiểm tra xe
                      </h3>
                      <p className="text-gray-700">
                        Bạn đã kiểm tra xe và gặp người bán chưa? Hãy xác nhận
                        để tiếp tục thanh toán 90% còn lại.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleAcceptInspection}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-sm">Xe đạt yêu cầu</div>
                          <div className="text-xs opacity-90">
                            Thanh toán 90%
                          </div>
                        </div>
                      </button>
                      {/* Nếu là SALE thì hiện nút từ chối, nếu AUCTION thì không hiện */}
                      {transaction?.type === "SALE" && (
                        <button
                          onClick={handleRejectInspection}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                          <ThumbsDown className="w-5 h-5" />
                          <div className="text-left">
                            <div className="text-sm">Không đúng mô tả</div>
                            <div className="text-xs opacity-90">
                              Hủy và hoàn tiền
                            </div>
                          </div>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mt-4 text-center">
                      Vui lòng xác nhận trong vòng 24 giờ sau thời gian hẹn
                    </p>
                  </div>
                )}

              {/* Actions */}
              {!appointment.confirmedDate && (
                <div className="space-y-6">
                  {canPropose && !showScheduler && (
                    <button
                      onClick={() => setShowScheduler(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      Đề xuất lịch hẹn
                    </button>
                  )}

                  {showScheduler && (
                    <AppointmentScheduler
                      appointmentId={appointment.id}
                      createdAt={appointment.createdAt}
                      onProposed={handleProposed}
                      onClose={() => setShowScheduler(false)}
                    />
                  )}

                  {canConfirm && proposedDates.length > 0 && (
                    <AppointmentConfirmation
                      appointmentId={appointment.id}
                      proposedDates={proposedDates}
                      proposerName={otherParty?.name || "Unknown"}
                      onConfirmed={handleConfirmed}
                    />
                  )}

                  {!canPropose && !canConfirm && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800">
                            Chờ phía bên kia đề xuất
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Bạn sẽ nhận được thông báo khi có lịch hẹn mới
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cancel Button - Show only if appointment is PENDING or CONFIRMED and not past confirmed date */}
              {(appointment.status === "PENDING" ||
                (appointment.status === "CONFIRMED" &&
                  appointment.confirmedDate &&
                  new Date(appointment.confirmedDate) > new Date())) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-medium hover:bg-red-100 transition flex items-center justify-center gap-2 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    Hủy lịch hẹn và hoàn tiền cọc
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Khoản cọc 10% sẽ được hoàn lại vào ví của bạn trong 24-48
                    giờ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
