"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import colors from "@/Utils/Color";

export default function CheckoutResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);

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
    } else {
      setStatus("failed");
    }

    setLoading(false);
  }, [searchParams]);

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
                Thanh toán thành công!
              </h1>
              <p className="text-center text-gray-600 mb-8">
                Đơn hàng của bạn đã được xác nhận và đang được xử lý.
              </p>

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
