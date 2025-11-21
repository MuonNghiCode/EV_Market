"use client";
import React, { useEffect, useState } from "react";
import { getMyContracts, viewContract, downloadContract, isAuthenticated } from "@/services";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  User,
  Car,
  Battery,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserContract {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  contractUrl: string;
  createdAt: string;
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
  transaction: {
    id: string;
    finalPrice: number;
    status: string;
    vehicle: {
      title: string;
    } | null;
    battery: {
      title: string;
    } | null;
  };
}

export default function UserContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<UserContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingContract, setViewingContract] = useState<string | null>(null);
  const [contractHTML, setContractHTML] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Check authentication
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      loadContracts();
    }
  }, [mounted, router]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyContracts();

      console.log("Full response:", response);
      console.log("Response type:", typeof response);
      console.log("Response data:", response?.data);

      if (response && response.data && response.data.contracts) {
        console.log("Contracts found:", response.data.contracts);
        setContracts(response.data.contracts);
      } else if (response && Array.isArray(response)) {
        // Handle case where response is directly an array
        console.log("Response is array:", response);
        setContracts(response);
      } else if (response && response.contracts) {
        // Handle case where contracts are at top level
        console.log("Contracts at top level:", response.contracts);
        setContracts(response.contracts);
      } else {
        console.log("No contracts found in response structure");
        setContracts([]);
      }
    } catch (err) {
      console.error("Failed to load contracts:", err);
      console.error("Error details:", err instanceof Error ? err.message : err);
      setError("Không thể tải hợp đồng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = async (contractId: string) => {
    try {
      setViewingContract(contractId);
      const html = await viewContract(contractId);
      setContractHTML(html);
    } catch (err) {
      console.error("Failed to view contract:", err);
      alert("Không thể xem hợp đồng");
      setViewingContract(null);
    }
  };

  const handleDownloadContract = async (contractId: string) => {
    try {
      await downloadContract(contractId);
    } catch (err) {
      console.error("Failed to download contract:", err);
      alert("Không thể tải xuống hợp đồng");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700 border-green-200";
      case "SHIPPED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "COMPLETED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "REFUNDED":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Đã thanh toán";
      case "SHIPPED":
        return "Đang giao hàng";
      case "COMPLETED":
        return "Hoàn thành";
      case "REFUNDED":
        return "Đã hoàn tiền";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  // Don't render until mounted on client
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 pt-30">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FileText className="w-10 h-10 text-blue-600" />
              Hợp đồng của tôi
            </h1>
            <p className="text-gray-600">
              Quản lý và xem tất cả hợp đồng mua bán của bạn
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Lỗi</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Contracts List */}
          {contracts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Chưa có hợp đồng
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn chưa có hợp đồng mua bán nào. Hãy bắt đầu mua hoặc bán xe
                điện!
              </p>
              <button
                onClick={() => router.push("/browse")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Khám phá xe điện
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {contract.transaction.vehicle ? (
                          <div className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-blue-600" />
                            <h3 className="text-xl font-bold text-gray-900">
                              {contract.transaction.vehicle.title}
                            </h3>
                          </div>
                        ) : contract.transaction.battery ? (
                          <div className="flex items-center gap-2">
                            <Battery className="w-5 h-5 text-purple-600" />
                            <h3 className="text-xl font-bold text-gray-900">
                              {contract.transaction.battery.title}
                            </h3>
                          </div>
                        ) : (
                          <h3 className="text-xl font-bold text-gray-900">
                            Sản phẩm
                          </h3>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-mono">
                        Mã hợp đồng: {contract.id}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                        contract.transaction.status
                      )}`}
                    >
                      {getStatusLabel(contract.transaction.status)}
                    </span>
                  </div>

                  {/* Contract Details Grid */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Price */}
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <DollarSign className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-700 font-medium">
                          Giá trị hợp đồng
                        </p>
                        <p className="text-xl font-bold text-green-900">
                          {formatPrice(contract.transaction.finalPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Calendar className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-700 font-medium">
                          Ngày tạo
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatDate(contract.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Buyer */}
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <User className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-purple-700 font-medium">
                          Người mua
                        </p>
                        <p className="font-semibold text-purple-900">
                          {contract.buyer.name}
                        </p>
                        <p className="text-xs text-purple-600">
                          {contract.buyer.email}
                        </p>
                      </div>
                    </div>

                    {/* Seller */}
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <User className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-orange-700 font-medium">
                          Người bán
                        </p>
                        <p className="font-semibold text-orange-900">
                          {contract.seller.name}
                        </p>
                        <p className="text-xs text-orange-600">
                          {contract.seller.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewContract(contract.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Xem hợp đồng
                    </button>
                    <button
                      onClick={() => handleDownloadContract(contract.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Tải xuống PDF
                    </button>
                    {contract.contractUrl && (
                      <a
                        href={contract.contractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Mở trong tab mới
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract Viewer Modal */}
        {viewingContract && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setViewingContract(null);
              setContractHTML("");
            }}
          >
            <div
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  Nội dung hợp đồng
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadContract(viewingContract)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Tải xuống
                  </button>
                  <button
                    onClick={() => {
                      setViewingContract(null);
                      setContractHTML("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
              <div
                className="p-6"
                dangerouslySetInnerHTML={{ __html: contractHTML }}
              />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
