"use client";
import React, { useState } from "react";
import { useI18nContext } from "../../providers/I18nProvider";
import { requestAuction } from "../../services";
import { X, DollarSign, TrendingUp, Shield } from "lucide-react";
import { useToast } from "../../providers/ToastProvider";

interface RequestAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingType: "VEHICLE" | "BATTERY";
  listingId: string;
  listingPrice: number;
  listingTitle: string;
  onSuccess: () => void;
}

export default function RequestAuctionModal({
  isOpen,
  onClose,
  listingType,
  listingId,
  listingPrice,
  listingTitle,
  onSuccess,
}: RequestAuctionModalProps) {
  const { t } = useI18nContext();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);

  // Tính toán tự động theo công thức
  const startingPrice = Math.floor(listingPrice * 0.5); // 50% giá bán
  const bidIncrement = Math.floor(startingPrice * 0.04); // 4% giá khởi điểm
  const depositAmount = Math.floor(listingPrice * 0.1); // 10% giá bán

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      // Gửi request không cần thời gian, admin sẽ set sau
      await requestAuction(listingType, listingId, {
        startingPrice,
        bidIncrement,
        depositAmount,
        auctionStartsAt: new Date().toISOString(), // Placeholder
        auctionEndsAt: new Date().toISOString(), // Placeholder
      });

      success(t("seller.auction.requestSuccess"));
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Request auction error:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("seller.auction.requestFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-3xl shadow-2xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-t-3xl">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-7 h-7" />
              {t("seller.auction.title")}
            </h3>
            <p className="text-green-100 text-sm mt-1">
              {t("seller.auction.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {/* Listing Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h4 className="font-bold text-lg text-gray-800 mb-2">
              {listingTitle}
            </h4>
            <p className="text-sm text-gray-600">
              Giá bán hiện tại:{" "}
              <span className="font-bold text-blue-700">
                {listingPrice.toLocaleString()} VNĐ
              </span>
            </p>
          </div>

          {/* Calculated Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Starting Price */}
            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <label className="text-sm font-semibold text-gray-700">
                  {t("seller.auction.startingPrice")}
                </label>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {startingPrice.toLocaleString()} 
              </p>
              <p className="text-xs text-gray-500 mt-1">
                50% giá bán
              </p>
            </div>

            {/* Bid Increment */}
            <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-semibold text-gray-700">
                  {t("seller.auction.bidIncrement")}
                </label>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {bidIncrement.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                VNĐ - 4% giá khởi điểm
              </p>
            </div>

            {/* Deposit Amount */}
            <div className="bg-purple-50 rounded-xl p-5 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <label className="text-sm font-semibold text-gray-700">
                  {t("seller.auction.depositAmount")}
                </label>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {depositAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                VNĐ - 10% giá bán
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Lưu ý:</strong> {t("seller.auction.note")}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-semibold"
              disabled={loading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? t("seller.auction.requesting") : t("seller.auction.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
