"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";

interface InspectionResultProps {
  transactionId: string;
  vehicleTitle: string;
  remainderAmount: number;
  onAccept?: () => void;
  onReject?: () => void;
  onClose?: () => void;
}

export default function InspectionResult({
  transactionId,
  vehicleTitle,
  remainderAmount,
  onAccept,
  onReject,
  onClose,
}: InspectionResultProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    const result = await Swal.fire({
      title: "Chấp nhận xe?",
      html: `
        <p class="text-gray-700 mb-4">Bạn xác nhận xe <strong>${vehicleTitle}</strong> đúng như mô tả?</p>
        <p class="text-sm text-gray-600">Bạn sẽ được chuyển đến trang thanh toán <strong>${remainderAmount.toLocaleString(
          "vi-VN"
        )} VNĐ</strong> (90% còn lại)</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Chấp nhận & Thanh toán",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#16a34a",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        // Navigate to remainder payment page
        router.push(`/checkout/remainder/${transactionId}`);
        onAccept?.();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: error.message || "Không thể tiếp tục thanh toán",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReject = async () => {
    const result = await Swal.fire({
      title: "Từ chối xe?",
      html: `
        <p class="text-gray-700 mb-4">Bạn không chấp nhận xe <strong>${vehicleTitle}</strong>?</p>
        <p class="text-sm text-yellow-700 mb-2">⚠️ <strong>Lưu ý:</strong></p>
        <ul class="text-sm text-gray-600 text-left list-disc pl-6">
          <li>Giao dịch sẽ được hủy</li>
          <li>Số tiền cọc 10% có thể không được hoàn lại</li>
          <li>Vui lòng liên hệ bộ phận hỗ trợ nếu có tranh chấp</li>
        </ul>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xác nhận từ chối",
      cancelButtonText: "Quay lại",
      confirmButtonColor: "#dc2626",
      input: "textarea",
      inputPlaceholder: "Lý do từ chối (tùy chọn)",
      inputAttributes: {
        "aria-label": "Lý do từ chối",
      },
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        // TODO: Call API to reject transaction and create dispute if needed
        const reason = result.value || "Không có lý do";

        Swal.fire({
          icon: "info",
          title: "Đã ghi nhận",
          text: "Yêu cầu từ chối đã được ghi nhận. Bộ phận hỗ trợ sẽ liên hệ trong 24h.",
          timer: 3000,
        });

        onReject?.();
        router.push("/purchase-history");
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: error.message || "Không thể từ chối giao dịch",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold mb-2">Kết quả kiểm tra xe</h2>
          <p className="text-blue-100">
            Vui lòng quyết định sau khi kiểm tra kỹ càng
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {vehicleTitle}
            </h3>
            <p className="text-gray-600">
              Bạn đã kiểm tra xe tại địa điểm hẹn. Vui lòng chọn một trong hai
              hành động:
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-6">
            {/* Accept */}
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-green-800 mb-1">
                    Chấp nhận xe
                  </h4>
                  <p className="text-sm text-green-700 mb-2">
                    Xe đúng như mô tả, không có vấn đề gì
                  </p>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>
                      ✓ Thanh toán 90% còn lại:{" "}
                      <strong>
                        {remainderAmount.toLocaleString("vi-VN")} VNĐ
                      </strong>
                    </li>
                    <li>✓ Nhận xe sau khi thanh toán thành công</li>
                    <li>✓ Hệ thống giải ngân cho người bán</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {loading ? "Đang xử lý..." : "Chấp nhận & Thanh toán 90%"}
              </button>
            </div>

            {/* Reject */}
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start gap-3 mb-3">
                <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-red-800 mb-1">Từ chối xe</h4>
                  <p className="text-sm text-red-700 mb-2">
                    Xe không đúng mô tả hoặc có vấn đề
                  </p>
                  <ul className="text-sm text-red-600 space-y-1">
                    <li>⚠ Giao dịch sẽ bị hủy</li>
                    <li>⚠ Tiền cọc 10% có thể không được hoàn</li>
                    <li>⚠ Yêu cầu hỗ trợ giải quyết tranh chấp</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleReject}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                {loading ? "Đang xử lý..." : "Từ chối & Hủy giao dịch"}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Lưu ý quan trọng:</p>
              <p>
                Quyết định của bạn là quan trọng. Hãy kiểm tra kỹ càng trước khi
                chọn. Nếu có tranh chấp, hệ thống sẽ giữ tiền cho đến khi giải
                quyết xong.
              </p>
            </div>
          </div>

          {/* Cancel */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full mt-4 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
