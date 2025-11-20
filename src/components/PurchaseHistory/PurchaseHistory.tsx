"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18nContext } from "../../providers/I18nProvider";
import { getMyTransactions, Transaction } from "../../services/Transaction";
import TransactionCard from "./TransactionCard";
import TransactionSkeleton from "./TransactionSkeleton";
import EmptyState from "./EmptyState";

export default function PurchaseHistory() {
  const { t } = useI18nContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "ongoing" | "completed" | "cancelled"
  >("ongoing");
  const [productFilter, setProductFilter] = useState<
    "all" | "vehicle" | "battery"
  >("all");

  const fetchTransactions = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getMyTransactions(page, 10);
      // Filter out PENDING transactions
      const filteredTransactions = response.data.transactions.filter(
        (transaction: Transaction) => transaction.status !== "PENDING"
      );
      setTransactions(filteredTransactions);
      setTotalPages(response.data.totalPages);
      setTotalResults(response.data.totalResults);
      setCurrentPage(response.data.page);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError(
        t("purchaseHistory.loadError", "Failed to load purchase history")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, []);

  // Filter transactions based on active tab and product filter
  const filteredTransactions = transactions.filter((transaction) => {
    // Status filter
    let statusMatch = false;
    if (activeTab === "ongoing") {
      // Đang diễn ra: PAID, DEPOSIT_PAID, SHIPPED
      statusMatch = ["PAID", "DEPOSIT_PAID", "SHIPPED"].includes(
        transaction.status
      );
    } else if (activeTab === "completed") {
      // Đã hoàn thành: COMPLETED
      statusMatch = transaction.status === "COMPLETED";
    } else if (activeTab === "cancelled") {
      // Đã hủy: CANCELLED, REFUNDED, DISPUTED
      statusMatch = ["CANCELLED", "REFUNDED", "DISPUTED"].includes(
        transaction.status
      );
    }

    // Product type filter
    let productMatch = true;
    if (productFilter === "vehicle") {
      productMatch = !!transaction.vehicle;
    } else if (productFilter === "battery") {
      productMatch = !!transaction.battery || !!transaction.batteries;
    }

    return statusMatch && productMatch;
  });

  const handlePageChange = (page: number) => {
    fetchTransactions(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 md:py-8 md:pt-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-6 md:mb-8">
            <div className="h-8 md:h-10 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
            <div className="h-4 md:h-5 bg-gray-200 rounded-lg w-96 max-w-full animate-pulse"></div>
          </div>
          {/* Cards Skeleton */}
          <div className="space-y-4 md:space-y-6">
            {[1, 2, 3].map((i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 md:py-8 md:pt-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 md:w-12 md:h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {t("purchaseHistory.errorTitle", "Error")}
            </h3>
            <p className="text-base md:text-lg text-gray-600 mb-6">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fetchTransactions(currentPage)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg text-base md:text-lg font-semibold"
            >
              {t("purchaseHistory.tryAgain", "Try Again")}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 md:py-8 md:pt-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-900 to-indigo-900 drop-shadow-lg mb-3">
            {t("purchaseHistory.title", "Purchase History")}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 font-medium">
            {t(
              "purchaseHistory.subtitle",
              "View and manage your purchase history"
            )}
          </p>
        </motion.div>

        {/* Tabs and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          {/* Status Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("ongoing")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all relative ${
                  activeTab === "ongoing"
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Đang diễn ra</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === "ongoing"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {
                      transactions.filter((t) =>
                        ["PAID", "DEPOSIT_PAID", "SHIPPED"].includes(t.status)
                      ).length
                    }
                  </span>
                </div>
                {activeTab === "ongoing" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all relative ${
                  activeTab === "completed"
                    ? "text-green-600 bg-green-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Đã hoàn thành</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === "completed"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {
                      transactions.filter((t) => t.status === "COMPLETED")
                        .length
                    }
                  </span>
                </div>
                {activeTab === "completed" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("cancelled")}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all relative ${
                  activeTab === "cancelled"
                    ? "text-red-600 bg-red-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Đã hủy</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === "cancelled"
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {
                      transactions.filter((t) =>
                        ["CANCELLED", "REFUNDED", "DISPUTED"].includes(t.status)
                      ).length
                    }
                  </span>
                </div>
                {activeTab === "cancelled" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                )}
              </button>
            </div>
          </div>

          {/* Product Filter */}
          <div className="p-4 bg-gray-50 flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">
              Loại sản phẩm:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setProductFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  productFilter === "all"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                Tất cả
              </button>
              <button
                onClick={() => setProductFilter("vehicle")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  productFilter === "vehicle"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Xe
              </button>
              <button
                onClick={() => setProductFilter("battery")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  productFilter === "battery"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
                Pin
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-10 flex items-center justify-between flex-wrap gap-6"
        >
          <div>
            <p className="text-sm text-gray-500 mb-1">Kết quả hiển thị</p>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-700">
              {filteredTransactions.length}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-blue-50 px-5 py-3 rounded-xl">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-base font-semibold text-blue-700">
              Tổng: {totalResults} đơn hàng
            </span>
          </div>
        </motion.div>

        {/* Transactions List */}
        <AnimatePresence mode="wait">
          {filteredTransactions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.5 }}
            >
              <EmptyState />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-6">
                {filteredTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onTransactionUpdate={() => fetchTransactions(currentPage)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-10 flex items-center justify-center gap-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {t("purchaseHistory.previous", "Previous")}
                  </motion.button>
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <motion.button
                            key={page}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                              currentPage === page
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </motion.button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {t("purchaseHistory.next", "Next")}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
