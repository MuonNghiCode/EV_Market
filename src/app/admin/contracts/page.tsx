"use client";
import React, { useState, useEffect } from "react";
import RoleAuthWrapper from "@/components/common/RoleAuthWrapper";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminTopbar from "@/components/Admin/AdminTopbar";

import Pagination from "@/components/common/Pagination";
import { getContracts } from "@/services/Admin";
import { Contract } from "@/types/admin";
import { Loader2, FileText, Filter } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import ContractsTable from "@/components/Admin/ContractsTable";

function ContractsManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PAID" | "SHIPPED" | "COMPLETED" | "REFUNDED" | "CANCELLED"
  >("ALL");
  const { error } = useToast();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    loadContracts();
  }, [page, statusFilter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await getContracts(page, 20);

      if (response.success && response.data) {
        let filteredContracts = response.data.contracts;

        // Filter by transaction status
        if (statusFilter !== "ALL") {
          filteredContracts = filteredContracts.filter(
            (contract: Contract) => contract.transaction.status === statusFilter
          );
        }

        setContracts(filteredContracts);
        setTotalPages(response.data.totalPages);
        setTotalResults(response.data.totalResults);
      } else {
        error("Không thể tải danh sách hợp đồng");
      }
    } catch (err) {
      console.error("Error loading contracts:", err);
      error("Có lỗi xảy ra khi tải danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: contracts.length,
    paid: contracts.filter((c) => c.transaction.status === "PAID").length,
    shipped: contracts.filter((c) => c.transaction.status === "SHIPPED").length,
    completed: contracts.filter((c) => c.transaction.status === "COMPLETED")
      .length,
    refunded: contracts.filter((c) => c.transaction.status === "REFUNDED")
      .length,
    cancelled: contracts.filter((c) => c.transaction.status === "CANCELLED")
      .length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="lg:ml-64">
        <AdminTopbar toggleSidebar={toggleSidebar} />
        <main className="p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Quản lý hợp đồng
            </h2>
            <p className="text-gray-600">
              Xem và quản lý tất cả các hợp đồng mua bán giữa người mua và người
              bán
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Đã thanh toán</p>
              <p className="text-2xl font-bold text-green-700">{stats.paid}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Đang giao</p>
              <p className="text-2xl font-bold text-blue-700">
                {stats.shipped}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-600 mb-1">Hoàn thành</p>
              <p className="text-2xl font-bold text-purple-700">
                {stats.completed}
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-600 mb-1">Hoàn tiền</p>
              <p className="text-2xl font-bold text-orange-700">
                {stats.refunded}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 mb-1">Đã hủy</p>
              <p className="text-2xl font-bold text-red-700">
                {stats.cancelled}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Trạng thái:
            </span>
            {[
              { value: "ALL", label: "Tất cả" },
              { value: "PAID", label: "Đã thanh toán" },
              { value: "SHIPPED", label: "Đang giao" },
              { value: "COMPLETED", label: "Hoàn thành" },
              { value: "REFUNDED", label: "Hoàn tiền" },
              { value: "CANCELLED", label: "Đã hủy" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setStatusFilter(option.value as any);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === option.value
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có hợp đồng
              </h3>
              <p className="text-gray-600">
                Không tìm thấy hợp đồng nào với bộ lọc hiện tại
              </p>
            </div>
          ) : (
            <>
              <ContractsTable contracts={contracts} />

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    disabled={loading}
                  />
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Hiển thị {contracts.length} / {totalResults} kết quả
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  return (
    <RoleAuthWrapper allowedRoles={["ADMIN"]} roleRedirectMap={{ MEMBER: "/" }}>
      <ContractsManagementPage />
    </RoleAuthWrapper>
  );
}
