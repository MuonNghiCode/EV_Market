"use client";

import { useState } from "react";
import { Calendar, Clock, X, Plus, Trash2 } from "lucide-react";
import { proposeAppointmentDate } from "@/services";
import Swal from "sweetalert2";

interface AppointmentSchedulerProps {
  appointmentId: string;
  createdAt?: string; // Ngày tạo appointment (ngày ký hợp đồng)
  onProposed?: () => void;
  onClose?: () => void;
}

export default function AppointmentScheduler({
  appointmentId,
  createdAt,
  onProposed,
  onClose,
}: AppointmentSchedulerProps) {
  const [proposedDates, setProposedDates] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (index: number, value: string) => {
    const updated = [...proposedDates];
    updated[index] = value;
    setProposedDates(updated);
  };

  const addDate = () => {
    setProposedDates([...proposedDates, ""]);
  };

  const removeDate = (index: number) => {
    if (proposedDates.length > 1) {
      setProposedDates(proposedDates.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least 1 date and all dates are filled
    if (proposedDates.length === 0 || proposedDates.some((date) => !date)) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng chọn ít nhất 1 ngày hẹn",
      });
      return;
    }

    // Remove duplicates
    const uniqueDates = [...new Set(proposedDates)];
    if (uniqueDates.length !== proposedDates.length) {
      Swal.fire({
        icon: "warning",
        title: "Ngày trùng lặp",
        text: "Vui lòng chọn các ngày khác nhau",
      });
      return;
    }

    // Convert to ISO format with timezone (set time to 00:00 by default)
    const isoDate = proposedDates.map((date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0); // Set default time to 00:00 (midnight)
      return d.toISOString();
    });

    try {
      setLoading(true);
      await proposeAppointmentDate(appointmentId, isoDate);

      Swal.fire({
        icon: "success",
        title: "Đã gửi đề xuất",
        text: `Đã gửi ${proposedDates.length} ngày hẹn. Chờ phía bên kia xác nhận.`,
        timer: 2000,
      });

      onProposed?.();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Không thể gửi đề xuất lịch hẹn",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  };

  // Get maximum date (created date + 7 days)
  const getMaxDate = () => {
    if (!createdAt) {
      // Nếu không có createdAt, giới hạn 7 ngày từ bây giờ
      const max = new Date();
      max.setDate(max.getDate() + 7);
      return max.toISOString().slice(0, 10);
    }

    const contractDate = new Date(createdAt);
    const maxDate = new Date(contractDate);
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().slice(0, 10);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Đề xuất lịch hẹn</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-gray-600 mb-6">
        Chọn các ngày phù hợp để gặp gỡ và kiểm tra xe trong vòng{" "}
        <strong>7 ngày kể từ ngày ký hợp đồng</strong>. Bên kia sẽ chọn 1 trong
        các ngày bạn đề xuất.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {proposedDates.map((date, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1 border border-gray-200 rounded-lg p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Ngày hẹn {index + 1}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(index, e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {proposedDates.length > 1 && (
              <button
                type="button"
                onClick={() => removeDate(index)}
                className="mt-9 p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Xóa ngày này"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addDate}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Thêm ngày hẹn
        </button>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5" />
            {loading
              ? "Đang gửi..."
              : `Gửi ${proposedDates.length} ngày đề xuất`}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Bạn chỉ có thể chọn lịch hẹn trong vòng 7 ngày
          kể từ ngày ký hợp đồng. Sau khi bên kia xác nhận 1 ngày, lịch hẹn sẽ
          được cố định. Hãy đảm bảo bạn có thể có mặt vào các ngày đã chọn.
        </p>
      </div>
    </div>
  );
}
