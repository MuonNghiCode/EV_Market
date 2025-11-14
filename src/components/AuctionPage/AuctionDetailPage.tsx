"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuctionCountdownTimer from "./AuctionCountdownTimer";
import AuctionImageGallery from "./AuctionImageGallery";
import AuctionBiddingPanel from "./AuctionBiddingPanel";
import {
  Clock,
  Zap,
  Battery,
  Car,
  ShieldCheck,
  User,
  Gavel,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Info,
  ShoppingCart,
} from "lucide-react";
import { LiveAuction } from "@/types/auction";
import {
  formatAuctionPrice,
  getTimeRemaining,
  placeBid,
  payDeposit,
  getAuctionDetail,
  buyNowAuction,
} from "@/services";
import {
  payAuctionTransaction,
  getPendingAuctionTransaction,
} from "@/services/Transaction";
import { useI18nContext } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/Auth";

interface AuctionDetailPageProps {
  auctionId: string;
}

// Helper function to format date in local timezone
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  // Browser automatically converts UTC to local timezone
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Helper function to map server errors to localized messages
const getLocalizedErrorMessage = (
  serverMessage: string,
  t: any,
  context: "deposit" | "bid"
): string => {
  const lowerMessage = serverMessage.toLowerCase();

  // Insufficient balance
  if (
    lowerMessage.includes("insufficient") ||
    lowerMessage.includes("not enough") ||
    lowerMessage.includes("balance")
  ) {
    return t(
      "auctions.errors.insufficientBalance",
      "Số dư không đủ để thực hiện giao dịch"
    );
  }

  // Deposit errors
  if (context === "deposit") {
    if (lowerMessage.includes("already") && lowerMessage.includes("deposit")) {
      return t(
        "auctions.errors.alreadyDeposited",
        "Bạn đã đặt cọc cho phiên đấu giá này"
      );
    }
    if (
      lowerMessage.includes("auction") &&
      (lowerMessage.includes("ended") || lowerMessage.includes("expired"))
    ) {
      return t(
        "auctions.errors.auctionAlreadyEnded",
        "Phiên đấu giá đã kết thúc"
      );
    }
    if (lowerMessage.includes("not") && lowerMessage.includes("start")) {
      return t(
        "auctions.errors.auctionNotStarted",
        "Phiên đấu giá chưa bắt đầu"
      );
    }
  }

  // Bid errors
  if (context === "bid") {
    if (
      lowerMessage.includes("must pay") ||
      (lowerMessage.includes("deposit") && lowerMessage.includes("before"))
    ) {
      return t(
        "auctions.errors.depositRequiredError",
        "Bạn phải đặt cọc trước khi đấu giá"
      );
    }
    if (lowerMessage.includes("cannot bid") && lowerMessage.includes("own")) {
      return t(
        "auctions.errors.ownAuctionError",
        "Bạn không thể đấu giá sản phẩm của chính mình"
      );
    }
    if (lowerMessage.includes("already") && lowerMessage.includes("highest")) {
      return t(
        "auctions.errors.alreadyHighestBidder",
        "Bạn đã là người đặt giá cao nhất"
      );
    }
    if (
      lowerMessage.includes("must be at least") ||
      lowerMessage.includes("minimum bid")
    ) {
      return t("auctions.errors.bidTooLow", "Giá đấu thấp hơn mức tối thiểu");
    }
  }

  // Network/Server errors
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch") ||
    lowerMessage.includes("timeout")
  ) {
    return t("auctions.errors.networkError", "Lỗi kết nối. Vui lòng thử lại");
  }

  if (
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("authentication")
  ) {
    return t(
      "auctions.errors.unauthorized",
      "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại"
    );
  }

  // Default error
  return t(
    context === "deposit"
      ? "auctions.errors.depositFailed"
      : "auctions.errors.bidFailed",
    context === "deposit" ? "Đặt cọc thất bại" : "Đấu giá thất bại"
  );
};

export default function AuctionDetailPage({
  auctionId,
}: AuctionDetailPageProps) {
  const { t } = useI18nContext();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();

  const [auction, setAuction] = useState<LiveAuction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isExpired: false,
  });

  // Bidding state with currency formatting
  const bidAmountInput = useCurrencyInput("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isPayingDeposit, setIsPayingDeposit] = useState(false);
  const [isPayingAuction, setIsPayingAuction] = useState(false);
  const [hasDeposit, setHasDeposit] = useState(false);
  const [currentBid, setCurrentBid] = useState(0);
  const [isNewBidFlash, setIsNewBidFlash] = useState(false);
  const [isAutoBidEnabled, setIsAutoBidEnabled] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"WALLET" | "MOMO">("WALLET");

  const [activeTab, setActiveTab] = useState<"details" | "specs" | "bids">(
    "details"
  );

  // Check if auction has started
  const isAuctionStarted = () => {
    if (!auction?.auctionStartsAt) return true; // Default to true if no start time
    // Parse as UTC time (keep 'Z') to match backend validation
    return new Date() >= new Date(auction.auctionStartsAt);
  };

  // Fetch current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchAuctionDetail = async () => {
      try {
        setLoading(true);
        // Try VEHICLE first, then BATTERY if fails
        let data;
        let listingType: "VEHICLE" | "BATTERY" = "VEHICLE";
        try {
          data = await getAuctionDetail("VEHICLE", auctionId);
          listingType = "VEHICLE";
        } catch (error) {
          data = await getAuctionDetail("BATTERY", auctionId);
          listingType = "BATTERY";
        }

        if (data && data.data) {
          const auctionData = data.data;

          // Add listingType to auction data
          auctionData.listingType = listingType;

          // Calculate current bid from bids array
          const highestBid =
            auctionData.bids && auctionData.bids.length > 0
              ? Math.max(...auctionData.bids.map((bid: any) => bid.amount))
              : auctionData.startingPrice;

          auctionData.currentBid = highestBid;

          // Check if user has already paid deposit from API response
          const hasDeposit =
            auctionData.hasUserDeposit === true ||
            auctionData.userDeposit?.status === "PAID";

          setAuction(auctionData);
          setCurrentBid(highestBid);
          bidAmountInput.setValue(
            String(highestBid + auctionData.bidIncrement)
          );
          setHasDeposit(hasDeposit);

     
        }
      } catch (error) {
        showError(
          error instanceof Error
            ? error.message
            : "Failed to load auction details"
        );
        console.error("Failed to fetch auction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetail();
  }, [auctionId, showError]);

  useEffect(() => {
    if (!auction) return;

    const timer = setInterval(() => {
      // Parse auction times as UTC (keep 'Z' to match backend)
      const startTime = new Date(auction.auctionStartsAt);
      const endTime = new Date(auction.auctionEndsAt);
      const now = new Date();

      // If auction hasn't started yet, countdown to start time
      if (now < startTime) {
        const remaining = getTimeRemaining(auction.auctionStartsAt);
        setTimeLeft(remaining);
      } else {
        // If auction has started, countdown to end time
        const remaining = getTimeRemaining(auction.auctionEndsAt);
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  // Realtime bidding subscription
  useEffect(() => {
   

    if (!auction) {
      return;
    }

 

    // Save listing type for client-side filtering
    const listingType = auction.listingType;


    // Create a channel with server-side filtering
    const channel = supabase
      .channel(`auction-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Bid",
        },
        (payload) => {

          const newBid = payload.new as any;

          // Update current bid with the new bid amount
          if (newBid && typeof newBid.amount === "number") {
            const newBidAmount = newBid.amount;


            setCurrentBid(newBidAmount);

            // Trigger flash animation
            setIsNewBidFlash(true);
            setTimeout(() => setIsNewBidFlash(false), 2000);

            // Auto-bid logic: if enabled and not our own bid, automatically place next bid
            if (isAutoBidEnabled && hasDeposit && newBid.bidderId !== currentUserId && auction && auction.listingType) {
              const nextBidAmount = newBidAmount + auction.bidIncrement;
              
              // Place bid automatically after a short delay
              setTimeout(async () => {
                try {
                  await placeBid(auction.listingType!, auction.id, { amount: nextBidAmount });
                } catch (error) {
                  console.error("❌ Auto-bid failed:", error);
                  // Silently fail - user can still manually bid
                }
              }, 500);
            }

            // Update the bid input to next increment using the current auction data
            setAuction((prev) => {
              if (!prev) return prev;

              // Update bid input
              const nextBidAmount = newBidAmount + (prev.bidIncrement || 0);
              bidAmountInput.setValue(String(nextBidAmount));

              // Create a properly typed Bid object
              const bidEntry: any = {
                id: newBid.id || "",
                amount: newBid.amount,
                createdAt: newBid.createdAt || new Date().toISOString(),
                bidderId: newBid.bidderId || "",
                vehicleId: newBid.vehicleId || null,
                batteryId: newBid.batteryId || null,
                bidder: newBid.bidder,
              };

              return {
                ...prev,
                currentBid: newBidAmount,
                bids: [...(prev.bids || []), bidEntry],
              };
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
        
        } else if (status === "CHANNEL_ERROR") {
       
        } else if (status === "TIMED_OUT") {
        } else if (status === "CLOSED") {
        }
      });

    // Cleanup: unsubscribe when component unmounts or auction changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, auction?.listingType, isAutoBidEnabled, hasDeposit, currentUserId]); // Depend on auctionId, listingType, and auto-bid state

  const handlePayDeposit = async () => {
    if (!auction || !auction.listingType) return;

    try {
      setIsPayingDeposit(true);
      const result = await payDeposit(auction.listingType, auction.id, {
        amount: auction.depositAmount,
      });

      // If no error thrown, deposit was successful
      setHasDeposit(true);
      showSuccess(t("auctions.depositSuccess", "Đặt cọc thành công!"));
    } catch (error) {
      console.error("❌ Deposit Error Details:", {
        error,
        message: error instanceof Error ? error.message : "Unknown",
        type: typeof error,
        errorObject: error,
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : t("auctions.errors.depositFailed", "Đặt cọc thất bại");

      const localizedError = getLocalizedErrorMessage(
        errorMessage,
        t,
        "deposit"
      );

      // Check for insufficient balance to show wallet link
      if (
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("not enough") ||
        errorMessage.toLowerCase().includes("balance")
      ) {
        showError(
          localizedError,
          6000,
          t("auctions.errors.goToWallet", "Nạp tiền"),
          () => router.push("/wallet")
        );
      } else {
        showError(localizedError);
      }
    } finally {
      setIsPayingDeposit(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!hasDeposit) {
      showError(
        t(
          "auctions.errors.depositRequiredError",
          "Bạn phải đặt cọc trước khi đấu giá"
        )
      );
      return;
    }

    if (!auction || !auction.listingType) return;

    const bidValue = Number(bidAmountInput.rawValue);
    if (bidValue < currentBid + auction.bidIncrement) {
      showError(
        t(
          "auctions.errors.bidTooLow",
          "Giá đấu thấp hơn mức tối thiểu"
        ).replace(
          "{amount}",
          formatAuctionPrice(currentBid + auction.bidIncrement)
        )
      );
      return;
    }

    try {
      setIsPlacingBid(true);
      await placeBid(auction.listingType, auction.id, { amount: bidValue });

      // If no error thrown, bid was successful
      setCurrentBid(bidValue);
      bidAmountInput.setValue(String(bidValue + auction.bidIncrement));
      showSuccess(t("auctions.bidPlaced", "Đặt giá thành công!"));
    } catch (error) {
      console.error("❌ Bid Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("auctions.errors.bidFailed", "Đấu giá thất bại");
      const localizedError = getLocalizedErrorMessage(errorMessage, t, "bid");

      // Check for insufficient balance to show wallet link
      if (
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("not enough") ||
        errorMessage.toLowerCase().includes("balance")
      ) {
        showError(
          localizedError,
          6000,
          t("auctions.errors.goToWallet", "Nạp tiền"),
          () => router.push("/wallet")
        );
      } else {
        showError(localizedError);
      }
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handlePayAuction = async (transactionId: string, paymentMethod: "WALLET" | "MOMO") => {
    try {
      setIsPayingAuction(true);

   

      const response = await payAuctionTransaction(transactionId, {
        paymentMethod,
      });


      if (response.data.paymentGateway === "WALLET") {
        showSuccess(t("auctions.paymentSuccess", "Thanh toán thành công!"));
        // Refresh auction details
        const listingType = auction?.listingType;
        if (listingType) {
          const { data } = await getAuctionDetail(listingType, auctionId);
          setAuction(data);
        }
      } else if (response.data.paymentDetail?.payUrl) {
      
        // Redirect to payment gateway (for MOMO)
        window.location.href = response.data.paymentDetail.payUrl;
      }
    } catch (error) {
      console.error("❌ Payment Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("auctions.errors.paymentFailed", "Thanh toán thất bại");

      // Check for insufficient balance
      if (
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("not enough") ||
        errorMessage.toLowerCase().includes("balance")
      ) {
        showError(
          t(
            "auctions.errors.insufficientBalance",
            "Số dư không đủ để thanh toán"
          ),
          6000,
          t("auctions.errors.goToWallet", "Nạp tiền"),
          () => router.push("/wallet")
        );
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsPayingAuction(false);
    }
  };

  const handleBuyNow = async () => {
    if (!auction || !auction.listingType) return;

    try {
      const response = await buyNowAuction(auction.listingType, auction.id);

      if (response.data?.transaction) {
        showSuccess(
          response.message || t(
            "auctions.buyNowSuccess",
            "Mua đứt thành công! Giao dịch đã được hoàn tất."
          )
        );
        
        // Refresh auction details to show updated status
        const { data } = await getAuctionDetail(auction.listingType, auctionId);
        setAuction(data);
      }
    } catch (error) {
      console.error("❌ Buy Now Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("auctions.errors.buyNowFailed", "Mua đứt thất bại");

      // Check for insufficient balance
      if (
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("not enough") ||
        errorMessage.toLowerCase().includes("balance")
      ) {
        showError(
          t(
            "auctions.errors.insufficientBalance",
            "Số dư không đủ để mua đứt"
          ),
          6000,
          t("auctions.errors.goToWallet", "Nạp tiền"),
          () => router.push("/wallet")
        );
      } else {
        showError(errorMessage);
      }
    }
  };

  if (loading || !auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const isVehicle = auction.listingType === "VEHICLE";
  const Icon = isVehicle ? Car : Battery;

  return (
    <div className="min-h-screen pt-25 w-full bg-transparent">
      {/* Compact Header */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-6 pb-4">
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors group"
          whileHover={{ x: -4 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:text-blue-600" />
          <span className="font-semibold">Back to Auctions</span>
        </motion.button>

        <div className="flex items-center gap-3">
          <motion.div
            className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            LIVE
          </motion.div>
          {auction.isVerified && (
            <motion.div
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image Gallery */}
            <AuctionImageGallery
              images={auction.images}
              title={auction.title}
              isVehicle={isVehicle}
            />

            {/* Title and Info Card */}
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full">
                    {auction.brand}
                  </span>
                  {auction.year && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                      {auction.year}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {isVehicle ? "Vehicle" : "Battery"}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  {auction.title}
                </h1>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {auction.mileage && (
                  <motion.div
                    className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm"
                    whileHover={{ scale: 1.03, y: -2 }}
                  >
                    <p className="text-xs text-blue-600 font-semibold mb-1">
                      Mileage
                    </p>
                    <p className="text-base font-bold text-slate-900">
                      {auction.mileage.toLocaleString()} km
                    </p>
                  </motion.div>
                )}
                {auction.capacity && (
                  <motion.div
                    className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm"
                    whileHover={{ scale: 1.03, y: -2 }}
                  >
                    <p className="text-xs text-green-600 font-semibold mb-1">
                      Battery
                    </p>
                    <p className="text-base font-bold text-slate-900">
                      {auction.capacity} kWh
                    </p>
                  </motion.div>
                )}
                {auction.health && (
                  <motion.div
                    className="p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100 shadow-sm"
                    whileHover={{ scale: 1.03, y: -2 }}
                  >
                    <p className="text-xs text-green-600 font-semibold mb-1">
                      Health
                    </p>
                    <p className="text-base font-bold text-green-600">
                      {auction.health}%
                    </p>
                  </motion.div>
                )}
                <motion.div
                  className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 shadow-sm"
                  whileHover={{ scale: 1.03, y: -2 }}
                >
                  <p className="text-xs text-purple-600 font-semibold mb-1">
                    Type
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {isVehicle ? "Vehicle" : "Battery"}
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                <div className="flex">
                  {[
                    {
                      key: "details" as const,
                      label: t("auctions.auctionDetails", "Details"),
                    },
                    {
                      key: "specs" as const,
                      label: t("auctions.specifications", "Specifications"),
                    },
                    {
                      key: "bids" as const,
                      label: t("auctions.biddingHistory", "Bidding History"),
                    },
                  ].map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === tab.key
                          ? "border-blue-600 text-blue-600 bg-white/70"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {tab.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.div
                className="p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "details" && (
                  <motion.div
                    className="prose max-w-none"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {auction.description}
                    </p>
                  </motion.div>
                )}

                {activeTab === "specs" && auction.specifications && (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {Object.entries(auction.specifications).map(
                      ([key, value], index) => {
                        // Handle nested objects (like warranty, dimensions, etc.)
                        const displayValue =
                          typeof value === "object" && value !== null
                            ? Object.entries(value)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(", ")
                            : String(value);

                        return (
                          <motion.div
                            key={key}
                            className="flex items-start justify-between p-3 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 shadow-sm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            whileHover={{
                              scale: 1.01,
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                            }}
                          >
                            <span className="text-sm text-blue-700 capitalize font-semibold">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span className="text-sm text-slate-900 text-right max-w-[60%] font-medium">
                              {displayValue}
                            </span>
                          </motion.div>
                        );
                      }
                    )}
                  </motion.div>
                )}

                {activeTab === "bids" && (
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {auction.bids && auction.bids.length > 0 ? (
                      <>
                        <p className="text-sm text-slate-500 mb-3">
                          {auction.bids.length}{" "}
                          {t(
                            auction.bids.length === 1
                              ? "auctions.bidPlacedSingular"
                              : "auctions.bidsPlaced",
                            auction.bids.length === 1
                              ? "bid placed"
                              : "bids placed"
                          )}
                        </p>
                        {auction.bids
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                          )
                          .map((bid, idx) => (
                            <motion.div
                              key={bid.id}
                              className={`flex items-center justify-between p-3 rounded-xl border shadow-sm ${
                                idx === 0
                                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                                  : "bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200"
                              }`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              whileHover={{
                                scale: 1.01,
                                boxShadow:
                                  idx === 0
                                    ? "0 6px 16px rgba(34, 197, 94, 0.15)"
                                    : "0 4px 12px rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <motion.div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                    idx === 0 ? "bg-green-100" : "bg-blue-100"
                                  }`}
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                >
                                  {idx === 0 ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <User className="w-4 h-4 text-blue-600" />
                                  )}
                                </motion.div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {bid.bidder?.name ||
                                      `${t(
                                        "auctions.bidder",
                                        "Bidder"
                                      )} ${bid.bidderId.slice(0, 8)}...`}
                                    {idx === 0 && (
                                      <span className="ml-2 text-green-600 font-bold text-xs">
                                        •{" "}
                                        {t(
                                          "auctions.highestBid",
                                          "Highest Bid"
                                        )}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatDateTime(bid.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <p
                                className={`text-base font-bold ${
                                  idx === 0 ? "text-green-600" : "text-blue-600"
                                }`}
                              >
                                {formatAuctionPrice(bid.amount)}
                              </p>
                            </motion.div>
                          ))}
                      </>
                    ) : (
                      <motion.div
                        className="text-center py-8"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Gavel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">
                          {t(
                            "auctions.noBidsYet",
                            "No bids placed yet. Be the first to bid!"
                          )}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Seller Info */}
            {auction.seller && (
              <motion.div
                className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 p-5 shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  {t("vehicleDetail.sellerInfo")}
                </h3>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 shadow-md"
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {auction.seller.avatar ? (
                      <Image
                        src={auction.seller.avatar}
                        alt={auction.seller.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-600 text-lg font-bold">
                        {auction.seller.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-slate-900">
                      {auction.seller.name}
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                      {t("vehicleDetail.sellerInfo", "Verified Seller")}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="lg:col-span-1">
            <motion.div
              className="sticky top-24 space-y-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Countdown Timer */}
              <AuctionCountdownTimer
                timeLeft={timeLeft}
                auctionStartsAt={auction.auctionStartsAt}
                auctionEndsAt={auction.auctionEndsAt}
                isAuctionStarted={isAuctionStarted()}
              />

              {/* Bidding Panel */}
              <AuctionBiddingPanel
                auction={auction}
                timeLeft={timeLeft}
                hasDeposit={hasDeposit}
                currentBid={currentBid}
                isPlacingBid={isPlacingBid}
                isPayingDeposit={isPayingDeposit}
                isPayingAuction={isPayingAuction}
                isAutoBidEnabled={isAutoBidEnabled}
                selectedPaymentMethod={selectedPaymentMethod}
                bidAmountInput={bidAmountInput}
                currentUserId={currentUserId}
                isNewBidFlash={isNewBidFlash}
                onPayDeposit={handlePayDeposit}
                onPlaceBid={handlePlaceBid}
                onPayAuction={async (transactionId, paymentMethod) => {
                  try {
                    setIsPayingAuction(true);
                    const itemType = auction.listingType === "VEHICLE" ? "vehicle" : "battery";
                    const transaction = await getPendingAuctionTransaction(auction.id, itemType);
                    if (!transaction) {
                      showError(t("auctions.errors.transactionNotFound", "Không tìm thấy giao dịch"));
                      return;
                    }
                    await handlePayAuction(transaction.id, paymentMethod);
                  } finally {
                    setIsPayingAuction(false);
                  }
                }}
                onBuyNow={handleBuyNow}
                onToggleAutoBid={setIsAutoBidEnabled}
                onPaymentMethodChange={setSelectedPaymentMethod}
                isAuctionStarted={isAuctionStarted}
                formatDateTime={formatDateTime}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

