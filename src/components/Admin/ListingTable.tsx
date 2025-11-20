"use client";
import React, { useState, memo } from "react";
import { Listing } from "@/types/admin";
import {
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Tag,
  Eye,
  Car,
  Battery,
  MapPin,
  Gauge,
  X,
  Zap,
  Clock,
} from "lucide-react";
import Image from "next/image";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface ListingTableProps {
  listings: Listing[];
  onVerify: (
    type: "VEHICLE" | "BATTERY",
    listingId: string,
    isVerified: boolean
  ) => Promise<void>;
}

// Detail Modal Component
const ListingDetailModal = ({
  listing,
  isOpen,
  onClose,
  onVerify,
}: {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (listing: Listing, isVerified: boolean) => void;
}) => {
  if (!listing || !isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Chi tiết tin đăng
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image Gallery */}
          {listing.images && listing.images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {listing.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={img}
                      alt={`${listing.title} - ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title & Status */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {listing.title}
              </h3>
              <div className="flex flex-col gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    listing.type === "VEHICLE"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {listing.type === "VEHICLE" ? (
                    <>
                      <Car className="w-4 h-4" />
                      Xe điện
                    </>
                  ) : (
                    <>
                      <Battery className="w-4 h-4" />
                      Pin
                    </>
                  )}
                </span>
                {listing.isVerified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    Đã xác thực
                  </span>
                )}
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-4">
              {formatPrice(listing.price)}
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Thương hiệu</p>
              <p className="font-semibold text-gray-900">{listing.brand}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Mẫu xe</p>
              <p className="font-semibold text-gray-900">
                {listing.model || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Năm sản xuất</p>
              <p className="font-semibold text-gray-900">{listing.year}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Số km đã đi</p>
              <p className="font-semibold text-gray-900">
                {listing.mileage
                  ? `${listing.mileage.toLocaleString()} km`
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Mô tả
              </h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          {/* Specifications */}
          {listing.specifications && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Thông số kỹ thuật
              </h4>
              <div className="space-y-4">
                {listing.specifications.batteryAndCharging && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Pin & Sạc
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(
                        listing.specifications.batteryAndCharging
                      ).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm text-blue-700 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="font-medium text-blue-900">
                            {String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {listing.specifications.performance && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Hiệu suất
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(listing.specifications.performance).map(
                        ([key, value]) => (
                          <div key={key}>
                            <p className="text-sm text-purple-700 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                            <p className="font-medium text-purple-900">
                              {String(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
                {listing.specifications.dimensions && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">
                      Kích thước
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(listing.specifications.dimensions).map(
                        ([key, value]) => (
                          <div key={key}>
                            <p className="text-sm text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                            <p className="font-medium text-gray-900">
                              {String(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
                {listing.specifications.warranty && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h5 className="font-semibold text-green-900 mb-3">
                      Bảo hành
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(listing.specifications.warranty).map(
                        ([key, value]) => (
                          <div key={key}>
                            <p className="text-sm text-green-700 capitalize">
                              {key}
                            </p>
                            <p className="font-medium text-green-900">
                              {String(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seller Info */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Người bán
            </h4>
            <div className="flex items-center gap-4">
              {listing.seller.avatar ? (
                <Image
                  src={listing.seller.avatar}
                  alt={listing.seller.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
              )}
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {listing.seller.name}
                </p>
                <p className="text-gray-600">{listing.seller.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {listing.seller.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      <CheckCircle className="w-3 h-3" />
                      Đã xác minh
                    </span>
                  )}
                  {listing.seller.isLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      <XCircle className="w-3 h-3" />
                      Bị khóa
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-sm">Ngày đăng</p>
                <p className="font-medium text-gray-900">
                  {formatDate(listing.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm">Cập nhật</p>
                <p className="font-medium text-gray-900">
                  {formatDate(listing.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Đóng
            </button>
            {listing.isVerified ? (
              <button
                onClick={() => {
                  onVerify(listing, false);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <XCircle className="w-5 h-5" />
                Gỡ xác thực
              </button>
            ) : (
              <button
                onClick={() => {
                  onVerify(listing, true);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                Xác thực tin đăng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoized row component để tối ưu performance
const ListingRow = memo(
  ({
    listing,
    onViewDetails,
  }: {
    listing: Listing;
    onViewDetails: (listing: Listing) => void;
  }) => {
    const [imageError, setImageError] = useState(false);

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    return (
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Image & Title */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              {listing.images && listing.images.length > 0 && !imageError ? (
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="64px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {listing.type === "VEHICLE" ? (
                    <Car className="w-6 h-6" />
                  ) : (
                    <Battery className="w-6 h-6" />
                  )}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate max-w-xs">
                {listing.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    listing.type === "VEHICLE"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {listing.type === "VEHICLE" ? (
                    <>
                      <Car className="w-3 h-3" />
                      Xe điện
                    </>
                  ) : (
                    <>
                      <Battery className="w-3 h-3" />
                      Pin
                    </>
                  )}
                </span>
                {listing.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Đã xác thực
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Brand & Model */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900">{listing.brand}</p>
              {listing.model && (
                <p className="text-gray-500 text-xs">{listing.model}</p>
              )}
            </div>
          </div>
        </td>

        {/* Year */}
        <td className="px-6 py-4 whitespace-nowrap">
          <p className="text-sm text-gray-700 font-medium">{listing.year}</p>
        </td>

        {/* Price */}
        <td className="px-6 py-4 whitespace-nowrap">
          <p className="text-sm font-bold text-green-600">
            {formatPrice(listing.price)}
          </p>
        </td>

        {/* Seller */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {listing.seller.avatar ? (
              <Image
                src={listing.seller.avatar}
                alt={listing.seller.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {listing.seller.name}
              </p>
            </div>
          </div>
        </td>

        {/* Date */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {formatDate(listing.createdAt)}
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <button
            onClick={() => onViewDetails(listing)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-95 transition-all duration-200 font-medium text-sm cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Xem chi tiết
          </button>
        </td>
      </tr>
    );
  }
);

ListingRow.displayName = "ListingRow";

export default function ListingTable({
  listings,
  onVerify,
}: ListingTableProps) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<"verify" | "unverify">("verify");
  const [isLoading, setIsLoading] = useState(false);

  const handleViewDetails = (listing: Listing) => {
    setSelectedListing(listing);
    setShowDetailModal(true);
  };

  const handleVerifyFromModal = (listing: Listing, isVerified: boolean) => {
    setSelectedListing(listing);
    setActionType(isVerified ? "verify" : "unverify");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedListing) return;

    setIsLoading(true);
    try {
      await onVerify(
        selectedListing.type,
        selectedListing.id,
        actionType === "verify"
      );
      setShowConfirm(false);
      setShowDetailModal(false);
      setSelectedListing(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Không có tin đăng
        </h3>
        <p className="text-gray-600">
          Không tìm thấy tin đăng nào với bộ lọc hiện tại
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thương hiệu
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Năm
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Giá
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Người bán
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ngày đăng
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {listings.map((listing) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                onViewDetails={handleViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <ListingDetailModal
        listing={selectedListing}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedListing(null);
        }}
        onVerify={handleVerifyFromModal}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setSelectedListing(null);
        }}
        onConfirm={handleConfirm}
        title={
          actionType === "verify" ? "Xác thực tin đăng" : "Gỡ xác thực tin đăng"
        }
        message={
          actionType === "verify"
            ? `Bạn có chắc chắn muốn xác thực tin đăng "${selectedListing?.title}"? Tin đăng sẽ được gắn nhãn "Đã kiểm định" và hiển thị ưu tiên cho người mua.`
            : `Bạn có chắc chắn muốn gỡ xác thực tin đăng "${selectedListing?.title}"? Tin đăng sẽ mất nhãn "Đã kiểm định".`
        }
        confirmText={actionType === "verify" ? "Xác thực" : "Gỡ xác thực"}
        type={actionType === "verify" ? "info" : "warning"}
        isLoading={isLoading}
      />
    </div>
  );
}
