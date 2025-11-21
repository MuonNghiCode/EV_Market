"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { useI18nContext } from "../../providers/I18nProvider";
import { getAuthToken } from "../../services/Auth";

interface ViewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  onDownload?: () => void;
}

export default function ViewContractModal({
  isOpen,
  onClose,
  transactionId,
  onDownload,
}: ViewContractModalProps) {
  const { t } = useI18nContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contractHtml, setContractHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchContract();
    }
    return () => {
      setContractHtml("");
      setIsLoading(true);
      setError("");
    };
  }, [isOpen, transactionId]);

  const fetchContract = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_ENDPOINT ||
        "https://evmarket-api-staging-backup.onrender.com/api/v1";

      const response = await fetch(
        `${API_BASE_URL}/contracts/${transactionId}/view`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load contract");
      }

      const html = await response.text();
      setContractHtml(html);
    } catch (err) {
      console.error("Error fetching contract:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load contract"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            isFullscreen
              ? "w-full h-full m-0 rounded-none"
              : "w-[95vw] h-[90vh] max-w-6xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-xl font-bold">
                {t("purchaseHistory.viewContract", "View Contract")}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Download Button */}
              {onDownload && !isLoading && !error && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDownload}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={t("purchaseHistory.downloadContract", "Download")}
                >
                  <Download className="w-5 h-5" />
                </motion.button>
              )}
              {/* Fullscreen Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </motion.button>
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={t("common.close", "Close")}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Contract Content */}
          <div className="flex-1 relative bg-gray-100 overflow-hidden">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {t(
                      "purchaseHistory.generatingContract",
                      "Loading contract..."
                    )}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <svg
                    className="w-16 h-16 text-red-500 mx-auto mb-4"
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
                  <p className="text-red-600 font-semibold mb-2">
                    {t("purchaseHistory.viewContractError", "Error loading contract")}
                  </p>
                  <p className="text-gray-500 text-sm">{error}</p>
                  <button
                    onClick={fetchContract}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !error && contractHtml && (
              <iframe
                srcDoc={contractHtml}
                className="w-full h-full border-0"
                title="Contract Document"
                sandbox="allow-same-origin"
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
