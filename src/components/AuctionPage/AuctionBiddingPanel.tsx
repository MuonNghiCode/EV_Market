"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  ShoppingCart,
  Gavel,
} from "lucide-react";
import { LiveAuction } from "@/types/auction";
import { formatAuctionPrice } from "@/services";
import { useI18nContext } from "@/providers/I18nProvider";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

interface AuctionBiddingPanelProps {
  auction: LiveAuction;
  timeLeft: TimeLeft;
  hasDeposit: boolean;
  currentBid: number;
  isPlacingBid: boolean;
  isPayingDeposit: boolean;
  isPayingAuction: boolean;
  isAutoBidEnabled: boolean;
  selectedPaymentMethod: "WALLET" | "MOMO";
  bidAmountInput: {
    displayValue: string;
    rawValue: string;
    handleChange: (value: string) => void;
    setValue: (value: string) => void;
  };
  currentUserId: string | null;
  isNewBidFlash: boolean;
  onPayDeposit: () => void;
  onPlaceBid: () => void;
  onPayAuction: (transactionId: string, paymentMethod: "WALLET" | "MOMO") => Promise<void>;
  onBuyNow: () => void;
  onToggleAutoBid: (enabled: boolean) => void;
  onPaymentMethodChange: (method: "WALLET" | "MOMO") => void;
  isAuctionStarted: () => boolean;
  formatDateTime: (dateString: string) => string;
}

const AuctionBiddingPanel: React.FC<AuctionBiddingPanelProps> = ({
  auction,
  timeLeft,
  hasDeposit,
  currentBid,
  isPlacingBid,
  isPayingDeposit,
  isPayingAuction,
  isAutoBidEnabled,
  selectedPaymentMethod,
  bidAmountInput,
  currentUserId,
  isNewBidFlash,
  onPayDeposit,
  onPlaceBid,
  onPayAuction,
  onBuyNow,
  onToggleAutoBid,
  onPaymentMethodChange,
  isAuctionStarted,
  formatDateTime,
}) => {
  const { t } = useI18nContext();

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl p-6 shadow-2xl border-2 border-blue-200"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Gavel className="w-7 h-7 text-blue-600" />
        {t("auctions.biddingPanel", "Đấu giá")}
      </h2>

      {/* Current Bid Display */}
      <motion.div
        className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-blue-300 shadow-lg"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <p className="text-sm text-slate-600 font-medium mb-1">
          {t("auctions.currentBid")}
        </p>
        <motion.p
          className={`text-2xl font-bold transition-all duration-500 ${
            isNewBidFlash ? "text-green-600" : "text-slate-900"
          }`}
          animate={isNewBidFlash ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {formatAuctionPrice(currentBid)}
        </motion.p>
        {isNewBidFlash && (
          <motion.p
            className="text-xs text-green-600 mt-2 font-semibold flex items-center gap-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-sm">🔥</span>{" "}
            {t("auctions.newBid", "New bid placed!")}
          </motion.p>
        )}
      </motion.div>

      {timeLeft.isExpired ? (
        /* 
          Auction Ended - Show result based on userAuctionResult
          
          FLOW LOGIC:
          ===========
          Backend API trả về trường "userAuctionResult" với các giá trị:
          
          1. "WON" - Người dùng THẮNG đấu giá:
             - Là người đặt giá cao nhất khi auction kết thúc
             - Action: Phải thanh toán số tiền bid cuối cùng
             - UI: Hiển thị nút "Thanh toán ngay"
             - Payment flow: 
               * Click button → Tìm pending transaction
               * Gọi API /transactions/{id}/pay với paymentMethod: WALLET
               * Nếu thành công → Hoàn tất mua hàng
               * Nếu thiếu tiền → Link đến wallet để nạp tiền
          
          2. "LOST" - Người dùng THUA đấu giá:
             - Đã đặt bid nhưng không phải người cao nhất
             - Action: KHÔNG CẦN làm gì, backend tự động hoàn tiền cọc
             - UI: Hiển thị thông báo "Tiền cọc sẽ được hoàn trả"
          
          3. "NO_BIDS" - Đã đặt cọc nhưng KHÔNG ĐẶT GIÁ:
             - User đã pay deposit nhưng không bid lần nào
             - Action: KHÔNG CẦN làm gì, backend tự động hoàn tiền cọc
             - UI: Hiển thị thông báo "Tiền cọc sẽ được hoàn trả"
          
          4. null - CHƯA THAM GIA:
             - User chưa đặt cọc cho auction này
             - Action: Không có action nào
             - UI: Chỉ hiển thị "Đấu giá đã kết thúc"
          
          Backend tự động xử lý:
          - Xác định winner dựa trên highest bid
          - Tạo transaction cho winner (status: PENDING)
          - Hoàn tiền deposit cho losers (status: REFUNDED)
          - Update vehicle/battery status
        */
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {auction.userAuctionResult === "WON" ? (
            /* Winner - Show payment option */
            <>
              <motion.div
                className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl shadow-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-base font-bold text-green-900 mb-1">
                      🎉{" "}
                      {t(
                        "auctions.congratulations",
                        "Chúc mừng! Bạn đã thắng đấu giá!"
                      )}
                    </p>
                    <p className="text-sm text-green-700">
                      {t(
                        "auctions.winnerMessage",
                        "Vui lòng thanh toán để hoàn tất giao dịch"
                      )}
                    </p>
                    <p className="text-lg font-bold text-green-900 mt-2">
                      {t("auctions.finalPrice", "Giá cuối")}:{" "}
                      {formatAuctionPrice(
                        currentBid || auction.startingPrice
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Payment method selector */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  {t("auctions.selectPaymentMethod", "Chọn phương thức thanh toán")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => onPaymentMethodChange("WALLET")}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === "WALLET"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Wallet className={`w-6 h-6 mx-auto mb-1 ${
                      selectedPaymentMethod === "WALLET" ? "text-blue-600" : "text-slate-400"
                    }`} />
                    <p className={`text-xs font-bold ${
                      selectedPaymentMethod === "WALLET" ? "text-blue-900" : "text-slate-600"
                    }`}>
                      {t("checkout.wallet", "Ví")}
                    </p>
                  </motion.button>
                  <motion.button
                    onClick={() => onPaymentMethodChange("MOMO")}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === "MOMO"
                        ? "border-pink-500 bg-pink-50"
                        : "border-slate-200 bg-white hover:border-pink-300"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center font-bold text-sm ${
                      selectedPaymentMethod === "MOMO" ? "bg-pink-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      M
                    </div>
                    <p className={`text-xs font-bold ${
                      selectedPaymentMethod === "MOMO" ? "text-pink-900" : "text-slate-600"
                    }`}>
                      MoMo
                    </p>
                  </motion.button>
                </div>
              </div>

              <motion.button
                onClick={async () => {
                  try {
                    // This will be handled by parent component's logic
                    // The parent should import getPendingAuctionTransaction and call onPayAuction with transaction.id
                  } catch (error) {
                    console.error("Payment error:", error);
                  }
                }}
                disabled={isPayingAuction}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPayingAuction ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("wallet.processing", "Đang xử lý...")}
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    {t("auctions.payNow", "Thanh toán ngay")} - {selectedPaymentMethod === "WALLET" ? t("checkout.wallet", "Ví") : "MoMo"}
                  </>
                )}
              </motion.button>
            </>
          ) : auction.userAuctionResult === "LOST" ? (
            /* Lost - Show refund message */
            <motion.div
              className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    {t(
                      "auctions.auctionLost",
                      "Rất tiếc! Bạn đã không thắng đấu giá"
                    )}
                  </p>
                  <p className="text-xs text-yellow-700">
                    {t(
                      "auctions.depositRefunded",
                      "Tiền cọc sẽ được hoàn trả vào ví của bạn"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : auction.userAuctionResult === "NO_BIDS" ? (
            /* No bids - Show refund message */
            <motion.div
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    {t(
                      "auctions.noBidsPlaced",
                      "Bạn chưa đặt giá nào"
                    )}
                  </p>
                  <p className="text-xs text-blue-700">
                    {t(
                      "auctions.depositRefunded",
                      "Tiền cọc sẽ được hoàn trả vào ví của bạn"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Default - Just auction ended */
            <motion.div
              className="p-4 bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200 rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {t("auctions.auctionEnded")}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t("auctions.auctionEndedDesc")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : !hasDeposit ? (
        <>
          {!isAuctionStarted() ? (
            <motion.div
              className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    {t("auctions.auctionNotStarted")}
                  </p>
                  <p className="text-xs text-yellow-700">
                    {t("auctions.auctionNotStartedDesc")}{" "}
                    {formatDateTime(auction.auctionStartsAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    {t("auctions.depositRequired")}
                  </p>
                  <p className="text-xs text-blue-700">
                    {t(
                      "auctions.depositMessagePart1",
                      "Pay a deposit of"
                    )}{" "}
                    {formatAuctionPrice(auction.depositAmount)}{" "}
                    {t(
                      "auctions.depositMessagePart2",
                      "to start bidding"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            onClick={onPayDeposit}
            disabled={isPayingDeposit || !isAuctionStarted()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isPayingDeposit ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("wallet.processing")}
              </>
            ) : !isAuctionStarted() ? (
              <>
                <Clock className="w-5 h-5" />
                {t("auctions.notStartedYet")}
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                {t("auctions.payDeposit")} -{" "}
                {formatAuctionPrice(auction.depositAmount)}
              </>
            )}
          </motion.button>
        </>
      ) : (
        <>
          <motion.div
            className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {t("auctions.depositPaid")}
              </span>
            </div>
          </motion.div>

          {/* Auto-bid checkbox */}
          <motion.div
            className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <input
              type="checkbox"
              id="auto-bid"
              checked={isAutoBidEnabled}
              onChange={(e) => onToggleAutoBid(e.target.checked)}
              className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="auto-bid" className="text-sm font-semibold text-purple-900 cursor-pointer flex-1">
               {t("auctions.autoBid", "Tự động đấu giá")}
            </label>
            {isAutoBidEnabled && (
              <motion.span
                className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                ON
              </motion.span>
            )}
          </motion.div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t("auctions.bidAmount")}
            </label>
            
            {/* Quick multiply buttons */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[2, 3, 5, 10].map((multiplier) => (
                <motion.button
                  key={multiplier}
                  onClick={() => {
                    const currentInputAmount = Number(bidAmountInput.rawValue) || currentBid;
                    const newAmount = currentInputAmount + (auction.bidIncrement * multiplier);
                    bidAmountInput.setValue(String(newAmount));
                  }}
                  className="py-2 px-3 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 font-bold text-sm rounded-xl border border-indigo-200 transition-all shadow-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ×{multiplier}
                </motion.button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                value={bidAmountInput.displayValue}
                onChange={(e) =>
                  bidAmountInput.handleChange(e.target.value)
                }
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold bg-white/50 backdrop-blur-sm transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                VND
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {t("auctions.minimumBid")}:{" "}
              {formatAuctionPrice(currentBid + auction.bidIncrement)}
            </p>
          </div>

          <motion.button
            onClick={onPlaceBid}
            disabled={
              isPlacingBid ||
              Number(bidAmountInput.rawValue) <
                currentBid + auction.bidIncrement ||
              timeLeft.isExpired
            }
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isPlacingBid ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("wallet.processing")}
              </>
            ) : (
              <>
                <Gavel className="w-5 h-5" />
                {t("auctions.placeBid")}
              </>
            )}
          </motion.button>

          {/* Buy Now button */}
          {!timeLeft.isExpired && auction.price && (
            <motion.button
              onClick={onBuyNow}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ShoppingCart className="w-5 h-5" />
              {t("auctions.buyNow", "Mua đứt")} - {formatAuctionPrice(auction.price)}
            </motion.button>
          )}
        </>
      )}

      {/* Auction Info */}
      <div className="pt-4 border-t border-blue-200 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600 font-medium">
            {t("auctions.startingPrice")}
          </span>
          <span className="font-bold text-slate-900">
            {formatAuctionPrice(auction.startingPrice)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 font-medium">
            {t("auctions.bidIncrement")}
          </span>
          <span className="font-bold text-slate-900">
            {formatAuctionPrice(auction.bidIncrement)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default AuctionBiddingPanel;
