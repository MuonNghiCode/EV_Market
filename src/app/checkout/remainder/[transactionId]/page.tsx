"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { payRemainder } from "@/services";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CreditCard,
  Wallet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

type PaymentMethodType = "MOMO" | "WALLET";

export default function RemainderPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.transactionId as string;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("MOMO");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Mock data - In production, fetch from API
  const [transactionData] = useState({
    vehicleTitle: "2024 Tesla Model 3",
    vehicleImage:
      "https://tesla-cdn.thron.com/delivery/public/image/tesla/c82315a6-ac99-464a-a753-c26bc0fb647d/bvlatuR/std/1200x628/lhd-model-3-social",
    totalPrice: 1800000000,
    depositPaid: 180000000,
    remainderAmount: 1620000000,
  });

  const handlePayment = async () => {
    if (!agreed) {
      Swal.fire({
        icon: "warning",
        title: "Chưa đồng ý điều khoản",
        text: "Vui lòng đồng ý với điều khoản thanh toán",
      });
      return;
    }

    try {
      setLoading(true);

      const redirectUrl = `${window.location.origin}/checkout/result?transaction=${transactionId}&type=remainder`;

      const response = await payRemainder(
        transactionId,
        paymentMethod,
        redirectUrl
      );

      if (response.data.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi thanh toán",
        text: error.message || "Không thể thực hiện thanh toán",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Vehicle Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      Thanh toán phần còn lại
                    </h1>
                    <p className="text-gray-600">90% giá trị xe</p>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={transactionData.vehicleImage}
                    alt={transactionData.vehicleTitle}
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      {transactionData.vehicleTitle}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        Tổng giá:{" "}
                        <span className="font-medium text-gray-800">
                          {transactionData.totalPrice.toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </span>
                      </p>
                      <p className="text-green-600">
                        ✓ Đã cọc:{" "}
                        {transactionData.depositPaid.toLocaleString("vi-VN")}{" "}
                        VNĐ (10%)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  {/* MoMo */}
                  <button
                    onClick={() => setPaymentMethod("MOMO")}
                    className={`w-full p-4 border-2 rounded-lg flex items-center gap-4 transition ${
                      paymentMethod === "MOMO"
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-800">MoMo</p>
                      <p className="text-sm text-gray-600">Ví điện tử MoMo</p>
                    </div>
                    {paymentMethod === "MOMO" && (
                      <CheckCircle className="w-6 h-6 text-pink-600" />
                    )}
                  </button>

                  {/* Wallet */}
                  <button
                    onClick={() => setPaymentMethod("WALLET")}
                    className={`w-full p-4 border-2 rounded-lg flex items-center gap-4 transition ${
                      paymentMethod === "WALLET"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-800">Ví EV Market</p>
                      <p className="text-sm text-gray-600">
                        Ví nội bộ hệ thống
                      </p>
                    </div>
                    {paymentMethod === "WALLET" && (
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Điều khoản thanh toán
                </h2>

                <div className="space-y-3 text-sm text-gray-700 mb-4">
                  <p>
                    ✓ Sau khi thanh toán thành công, bạn chính thức sở hữu xe
                  </p>
                  <p>
                    ✓ Người bán sẽ nhận được tiền sau khi giao dịch hoàn tất
                  </p>
                  <p>✓ Bạn có 7 ngày để khiếu nại nếu phát hiện vấn đề</p>
                  <p>✓ Hợp đồng điện tử sẽ được gửi qua email sau thanh toán</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    Tôi đã đọc và đồng ý với{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      điều khoản thanh toán
                    </a>
                  </span>
                </label>
              </div>
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Tổng quan thanh toán
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Tổng giá trị:</span>
                    <span className="font-medium">
                      {transactionData.totalPrice.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Đã cọc (10%):</span>
                    <span className="font-medium">
                      -{transactionData.depositPaid.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Cần thanh toán:</span>
                    <span className="text-blue-600">
                      {transactionData.remainderAmount.toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading || !agreed}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Thanh toán ngay
                    </>
                  )}
                </button>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Bạn sẽ được chuyển đến cổng thanh toán an toàn. Không chia
                    sẻ thông tin thanh toán với bất kỳ ai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
