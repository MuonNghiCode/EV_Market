"use client";

import { useState } from "react";
import { CheckCircle, Calendar, Clock } from "lucide-react";
import { confirmAppointment, formatAppointmentDate } from "@/services";
import Swal from "sweetalert2";

interface AppointmentConfirmationProps {
  appointmentId: string;
  proposedDates: string[];
  proposerName: string;
  onConfirmed?: () => void;
}

export default function AppointmentConfirmation({
  appointmentId,
  proposedDates,
  proposerName,
  onConfirmed,
}: AppointmentConfirmationProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedDate) {
      Swal.fire({
        icon: "warning",
        title: "Chưa chọn khung giờ",
        text: "Vui lòng chọn 1 trong 3 khung giờ để xác nhận",
      });
      return;
    }

    try {
      setLoading(true);
      await confirmAppointment(appointmentId, selectedDate);

      Swal.fire({
        icon: "success",
        title: "Đã xác nhận",
        text: "Lịch hẹn đã được xác nhận. Hãy có mặt đúng giờ!",
        timer: 2000,
      });

      onConfirmed?.();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Không thể xác nhận lịch hẹn",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-800">Xác nhận lịch hẹn</h3>
      </div>

      <p className="text-gray-600 mb-4">
        <strong>{proposerName}</strong> đã đề xuất 3 khung giờ. Vui lòng chọn 1
        khung giờ phù hợp với bạn:
      </p>

      <div className="space-y-3 mb-6">
        {proposedDates.map((date, index) => {
          const dateObj = new Date(date);
          const isPast = dateObj < new Date();

          return (
            <button
              key={index}
              onClick={() => !isPast && setSelectedDate(date)}
              disabled={isPast}
              className={`w-full p-4 border-2 rounded-lg text-left transition flex items-center justify-between ${
                selectedDate === date
                  ? "border-blue-600 bg-blue-50"
                  : isPast
                  ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-800">
                    Lựa chọn {index + 1}
                  </span>
                  {isPast && (
                    <span className="text-xs text-red-500">(Đã qua)</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {formatAppointmentDate(date)}
                </p>
              </div>

              {selectedDate === date && (
                <CheckCircle className="w-6 h-6 text-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={loading || !selectedDate}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-5 h-5" />
        {loading ? "Đang xác nhận..." : "Xác nhận lịch hẹn"}
      </button>

      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>Lưu ý:</strong> Sau khi xác nhận, lịch hẹn sẽ được cố định.
          Hãy đảm bảo bạn có thể có mặt đúng giờ để kiểm tra xe.
        </p>
      </div>
    </div>
  );
}
