"use client";
import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useI18nContext } from "../../providers/I18nProvider";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
}

interface AuctionCountdownTimerProps {
  timeLeft: TimeLeft;
  auctionStartsAt: string;
  auctionEndsAt: string;
  isAuctionStarted: boolean;
}

// Helper function to format date without timezone conversion
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function AuctionCountdownTimer({
  timeLeft,
  auctionStartsAt,
  auctionEndsAt,
  isAuctionStarted,
}: AuctionCountdownTimerProps) {
  const { t } = useI18nContext();

  return (
    <motion.div
      className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl p-5 text-white shadow-xl"
      whileHover={{
        scale: 1.02,
        boxShadow: "0 16px 32px rgba(245, 158, 11, 0.25)",
      }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Clock className="w-4 h-4" />
        </motion.div>
        <span className="text-xs font-semibold">
          {!isAuctionStarted
            ? t("auctions.timeUntilStart", "Thời gian đến khi bắt đầu")
            : t("auctions.timeRemaining", "Thời gian còn lại")}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center mb-3">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hrs" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-2 shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <div className="text-xl font-bold">
              {String(item.value).padStart(2, "0")}
            </div>
            <div className="text-[10px] opacity-80 font-medium">
              {item.label}
            </div>
          </motion.div>
        ))}
      </div>
      {/* Auction Start Time */}
      <div className="pt-3 border-t border-white/30 text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="opacity-90 font-medium">
            {!isAuctionStarted
              ? t("auctions.willStart", "Sẽ bắt đầu")
              : t("auctions.started", "Đã bắt đầu")}
            :
          </span>
          <span className="font-bold">{formatDateTime(auctionStartsAt)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="opacity-90 font-medium">
            {!isAuctionStarted
              ? t("auctions.willEnd", "Sẽ kết thúc")
              : t("auctions.endTime", "Kết thúc")}
            :
          </span>
          <span className="font-bold">{formatDateTime(auctionEndsAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}
