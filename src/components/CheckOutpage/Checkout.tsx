"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18nContext } from "../../providers/I18nProvider";
import colors from "../../Utils/Color";
import Image from "next/image";
import {
  ChevronDown,
  Shield,
  RotateCcw,
  Headphones,
  Wallet as WalletIcon,
  QrCode,
} from "lucide-react";
import {
  getWalletBalance,
  formatCurrency,
  openPaymentUrl,
} from "@/services/Wallet";
import { ensureValidToken, getUserInfo } from "@/services/Auth";
import { checkout, payWithWallet } from "@/services/Checkout";
import { useSearchParams, useRouter } from "next/navigation";
import { getVehicleById, type Vehicle } from "@/services/Vehicle";
import { getBatteryById, type Battery } from "@/services/Battery";
import { useToast } from "../../providers/ToastProvider";
import { getMyTransactions } from "@/services/Transaction";

export default function Checkout() {
  const { t } = useI18nContext();
  const toast = useToast();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "wallet" | "qr"
  >("wallet");
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    billingAddress: "",
    // Card fields removed; not used anymore
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const listingId = searchParams.get("listingId") || "";
  const rawListingType = (searchParams.get("listingType") || "").toUpperCase();
  const listingType: "VEHICLE" | "BATTERY" | "" =
    rawListingType === "VEHICLE" || rawListingType === "BATTERY"
      ? (rawListingType as any)
      : "";

  // Product state
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [battery, setBattery] = useState<Battery | null>(null);

  const [qrOpen, setQrOpen] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<{
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Pricing derived from product price
  const [orderPricing, setOrderPricing] = useState({
    productPrice: 0,
    serviceFee: 0,
    vat: 0,
    discount: 0,
  });

  // Calculate deposit amount (10% of total)
  const fullAmount = useMemo(() => {
    return (
      orderPricing.productPrice +
      orderPricing.serviceFee +
      orderPricing.vat -
      orderPricing.discount
    );
  }, [orderPricing]);

  const depositAmount = useMemo(() => {
    return Math.round(fullAmount * 0.1); // 10% deposit
  }, [fullAmount]);

  const remainderAmount = useMemo(() => {
    return fullAmount - depositAmount; // 90% remaining
  }, [fullAmount, depositAmount]);

  const totalAmount = depositAmount; // User pays deposit first

  const orderData = {
    product: {
      name:
        listingType === "VEHICLE"
          ? vehicle?.title || "--"
          : listingType === "BATTERY"
          ? battery?.title || "--"
          : "--",
      brand:
        listingType === "VEHICLE"
          ? vehicle?.brand || "--"
          : listingType === "BATTERY"
          ? battery?.brand || "--"
          : "--",
      year:
        listingType === "VEHICLE"
          ? vehicle?.year || "--"
          : listingType === "BATTERY"
          ? battery?.year || "--"
          : "--",
      batteryCapacity:
        listingType === "VEHICLE"
          ? vehicle?.specifications?.batteryAndCharging?.batteryCapacity || "--"
          : listingType === "BATTERY"
          ? `${battery?.capacity ?? "--"} kWh`
          : "--",
      mileage:
        listingType === "VEHICLE"
          ? `${vehicle?.mileage?.toLocaleString() ?? "--"} km`
          : "--",
      condition:
        listingType === "VEHICLE"
          ? vehicle?.status ?? "--"
          : listingType === "BATTERY"
          ? battery?.status ?? "--"
          : "--",
      price: formatCurrency(orderPricing.productPrice),
    },
    breakdown: {
      productPrice: formatCurrency(orderPricing.productPrice),
      serviceFee: formatCurrency(orderPricing.serviceFee),
      vat: formatCurrency(orderPricing.vat),
      discount:
        orderPricing.discount > 0
          ? `-${formatCurrency(orderPricing.discount)}`
          : formatCurrency(0),
      fullAmount: formatCurrency(fullAmount),
      depositAmount: formatCurrency(depositAmount),
      remainderAmount: formatCurrency(remainderAmount),
      total: formatCurrency(totalAmount),
    },
  };

  // Load product by listingId and listingType
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!listingId || !listingType) return;
      try {
        setProductLoading(true);
        setProductError(null);

        // Check if user already purchased this product
        try {
          const transactionsRes = await getMyTransactions(1, 100); // Get enough to check
          const alreadyPurchased = transactionsRes.data.transactions.some(
            (t) =>
              (t.vehicleId === listingId || t.batteryId === listingId) &&
              t.status === "COMPLETED"
          );

          if (alreadyPurchased) {
            toast.error(
              "Bạn đã mua sản phẩm này rồi. Đang chuyển đến lịch sử mua hàng..."
            );
            setTimeout(() => router.push("/purchase-history"), 1500);
            return;
          }
        } catch (err) {
          // Continue anyway - don't block checkout if purchase history check fails
        }

        if (listingType === "VEHICLE") {
          const res = await getVehicleById(listingId);
          if (!mounted) return;
          const v =
            res.data && (res.data as any).vehicle
              ? (res.data as any).vehicle
              : (res.data as any);

          // Check if vehicle is already sold
          if (v?.status === "SOLD") {
            toast.error(
              "Sản phẩm này đã được bán. Vui lòng chọn sản phẩm khác."
            );
            setTimeout(() => router.push("/browse"), 1500);
            return;
          }

          setVehicle(v as Vehicle);
          const price = (v?.price as number) || 0;
          // No additional fees - user pays exact listing price
          setOrderPricing({
            productPrice: price,
            serviceFee: 0, // Changed from 1%
            vat: 0, // Changed from 10%
            discount: 0,
          });
        } else if (listingType === "BATTERY") {
          const res = await getBatteryById(listingId);
          if (!mounted) return;
          const b =
            res.data && (res.data as any).battery
              ? (res.data as any).battery
              : (res.data as any);

          // Check if battery is already sold
          if (b?.status === "SOLD") {
            toast.error(
              "Sản phẩm này đã được bán. Vui lòng chọn sản phẩm khác."
            );
            setTimeout(() => router.push("/browse"), 1500);
            return;
          }

          setBattery(b as Battery);
          const price = (b?.price as number) || 0;
          // No additional fees - user pays exact listing price
          setOrderPricing({
            productPrice: price,
            serviceFee: 0, // Changed from 1%
            vat: 0, // Changed from 10%
            discount: 0,
          });
        }
      } catch (err: any) {
        if (!mounted) return;
        setProductError(err?.message || "Failed to load product");
      } finally {
        if (mounted) setProductLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [listingId, listingType, toast, router]);

  // Load wallet balance on mount
  useEffect(() => {
    let mounted = true;

    // Check if this is a MoMo callback (has resultCode param)
    const resultCode = searchParams.get("resultCode");
    const orderId = searchParams.get("orderId");

    if (resultCode !== null) {
      // This is a MoMo payment callback
      if (resultCode === "0") {
        // Success
        toast.success(
          "Thanh toán MoMo thành công! Đơn hàng của bạn đã được xác nhận."
        );
        setTimeout(() => router.push("/purchase-history"), 1500);
      } else {
        // Failed
        toast.error(`Thanh toán MoMo thất bại. Mã lỗi: ${resultCode}`);
        setTimeout(() => router.push("/browse"), 2000);
      }
      return; // Don't proceed with normal auth check
    }

    // Normal flow: Client-side auth guard
    (async () => {
      try {
        const token = await ensureValidToken();
        if (!token) {
          const redirectUrl =
            typeof window !== "undefined"
              ? `${window.location.pathname}${window.location.search}`
              : "/checkout";
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
          return;
        }
      } catch {
        const redirectUrl =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/checkout";
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }
    })();

    const loadBalance = async () => {
      try {
        setBalanceLoading(true);
        setBalanceError(null);
        const res = await getWalletBalance();
        if (!mounted) return;
        setWalletBalance(res.data?.availableBalance ?? null);
      } catch (err: any) {
        if (!mounted) return;
        setBalanceError(err?.message || "Failed to load wallet balance");
      } finally {
        if (mounted) setBalanceLoading(false);
      }
    };
    loadBalance();
    return () => {
      mounted = false;
    };
  }, [searchParams, router]);

  const sufficientBalance = useMemo(() => {
    if (walletBalance == null) return false;
    return walletBalance >= totalAmount;
  }, [walletBalance, totalAmount]);

  const handlePay = async () => {
    if (!termsAccepted) return;
    if (processing) return; // Prevent double-click
    if (!listingId || !listingType) {
      toast.error(
        "Thiếu thông tin sản phẩm. Vui lòng quay lại trang chi tiết và thử lại."
      );
      return;
    }

    // Proceed with payment directly without contract
    setProcessing(true);
    try {
      console.log("Checkout request:", {
        listingId,
        listingType,
        paymentMethod: selectedPaymentMethod === "qr" ? "MOMO" : "WALLET",
        redirectUrl: `${window.location.origin}/checkout/result`,
      });

      // WALLET doesn't need redirectUrl, only MOMO does
      const checkoutPayload: any = {
        listingId,
        listingType: listingType as "VEHICLE" | "BATTERY",
        paymentMethod: selectedPaymentMethod === "qr" ? "MOMO" : "WALLET",
      };

      // Only add redirectUrl for MOMO
      if (selectedPaymentMethod === "qr") {
        checkoutPayload.redirectUrl = `${window.location.origin}/checkout/result`;
      }

      const res = await checkout(checkoutPayload);

      console.log("Checkout response:", res);
      console.log("Response data:", JSON.stringify(res?.data, null, 2));
      console.log("Payment method:", selectedPaymentMethod);

      if (selectedPaymentMethod === "qr") {
        // MOMO payment
        const source =
          res?.data && (res.data as any).paymentInfo
            ? (res.data as any).paymentInfo
            : (res?.data as any);
        const payUrl = source?.payUrl || source?.paymentUrl; // Support both payUrl and paymentUrl
        const deeplink = source?.deeplink;
        const qrCodeUrl = source?.qrCodeUrl;
        if (payUrl) {
          openPaymentUrl(payUrl, "_blank");
        } else if (deeplink || qrCodeUrl) {
          setPaymentLinks({ payUrl, deeplink, qrCodeUrl });
          setQrOpen(true);
        } else {
          toast.error("Không tìm thấy liên kết thanh toán MoMo.");
        }
      } else {
        // WALLET flow: checkout already completes payment
        const transactionId =
          (res as any)?.data?.id || (res as any)?.data?.transactionId;

        console.log("WALLET checkout response:", res);
        console.log("Extracted transactionId:", transactionId);
        console.log("Transaction status:", (res as any)?.data?.status);

        if (!transactionId) {
          toast.error("Không tìm thấy transaction ID.");
          return;
        }

        // Update wallet balance
        try {
          const bal = await getWalletBalance();
          setWalletBalance(bal.data?.availableBalance ?? null);
        } catch {}

        // Show success message
        toast.success("Thanh toán cọc bằng ví thành công!");

        // Redirect to checkout result page with success status
        setTimeout(
          () =>
            router.push(
              "/checkout/result?resultCode=0&message=Thanh toán cọc thành công&orderId=" +
                transactionId
            ),
          1500
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Thanh toán thất bại");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/40 to-purple-50/30 md:pt-25"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-16 py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring" }}
          className="space-y-12"
        >
          {/* Checkout Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 drop-shadow-lg tracking-tight">
              {t("checkout.title")}
            </h1>
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    <strong>Thanh toán cọc 10%:</strong> Bạn chỉ cần thanh toán
                    10% giá trị đơn hàng để đặt cọc. Sau khi gặp và kiểm tra xe,
                    bạn sẽ thanh toán 90% còn lại nếu chấp nhận mua.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Order Summary Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, type: "spring", delay: 0.1 }}
            className="bg-white/90 backdrop-blur-lg rounded-3xl border border-blue-200 shadow-xl p-8"
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsOrderSummaryExpanded(!isOrderSummaryExpanded)}
            >
              <h2 className="text-2xl font-bold text-blue-900">
                {t("checkout.orderSummary")}
              </h2>
              <ChevronDown
                className={`w-6 h-6 transition-transform duration-200 text-blue-600 ${
                  isOrderSummaryExpanded ? "rotate-180" : ""
                }`}
              />
            </div>

            {isOrderSummaryExpanded && (
              <div className="mt-6 space-y-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-md">
                    <Image
                      src={
                        listingType === "VEHICLE"
                          ? vehicle?.images?.[0] || "/Homepage/TopCar.png"
                          : listingType === "BATTERY"
                          ? battery?.images?.[0] || "/Homepage/Pin.png"
                          : "/Homepage/TopCar.png"
                      }
                      alt={orderData.product.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-2xl"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-full shadow-md">
                        {orderData.product.brand}
                      </span>
                      <h3 className="font-bold text-lg text-blue-900">
                        {orderData.product.name}
                      </h3>
                    </div>
                    <div className="space-y-2 text-base text-slate-600">
                      <p className="font-medium">
                        {t("checkout.productDetails.year")}:{" "}
                        <span className="text-slate-800">
                          {orderData.product.year}
                        </span>
                      </p>
                      <p className="font-medium">
                        {t("checkout.productDetails.batteryCapacity")}:{" "}
                        <span className="text-slate-800">
                          {orderData.product.batteryCapacity}
                        </span>
                      </p>
                      {listingType === "VEHICLE" && (
                        <p className="font-medium">
                          {t("checkout.productDetails.mileage")}:{" "}
                          <span className="text-slate-800">
                            {orderData.product.mileage}
                          </span>
                        </p>
                      )}
                      <p className="font-medium">
                        {t("checkout.productDetails.condition")}:{" "}
                        <span className="text-slate-800">
                          {orderData.product.condition}
                        </span>
                      </p>
                    </div>
                    {productError && (
                      <p className="text-sm text-red-600 mt-2 font-medium">
                        {productError}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">
                      {orderData.product.price}
                    </p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-6 pt-6 border-t border-blue-200 space-y-3">
                  <div className="flex justify-between text-base text-slate-700">
                    <span>Tổng giá trị:</span>
                    <span className="font-semibold">
                      {orderData.breakdown.fullAmount}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-600 bg-green-50 p-3 rounded-lg">
                    <span>Cọc 10% (thanh toán ngay):</span>
                    <span>{orderData.breakdown.depositAmount}</span>
                  </div>
                  <div className="flex justify-between text-base text-slate-600">
                    <span>Còn lại 90% (thanh toán sau):</span>
                    <span className="font-semibold">
                      {orderData.breakdown.remainderAmount}
                    </span>
                  </div>
                </div>

                {productLoading && (
                  <div className="text-base text-blue-600 font-medium">
                    Đang tải sản phẩm...
                  </div>
                )}
              </div>
            )}
          </motion.div>
          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, type: "spring", delay: 0.2 }}
            className="bg-white/90 backdrop-blur-lg rounded-3xl border border-blue-200 shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-8 text-blue-900">
              {t("checkout.paymentMethod")}
            </h2>

            <div className="space-y-6">
              {/* Wallet Method */}
              <div
                className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                  selectedPaymentMethod === "wallet"
                    ? "border-indigo-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg"
                    : "border-blue-200 hover:border-blue-300 bg-white"
                }`}
                onClick={() => setSelectedPaymentMethod("wallet")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <WalletIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-blue-900">
                      Thanh toán bằng số dư ví
                    </span>
                  </div>
                  <div className="text-right">
                    {balanceLoading ? (
                      <span className="text-sm text-blue-600 font-medium">
                        Đang tải số dư...
                      </span>
                    ) : balanceError ? (
                      <span className="text-sm text-red-600 font-medium">
                        {balanceError}
                      </span>
                    ) : (
                      <span
                        className={`text-base font-bold ${
                          sufficientBalance
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        Số dư:{" "}
                        {walletBalance != null
                          ? formatCurrency(walletBalance)
                          : "--"}
                      </span>
                    )}
                  </div>
                </div>
                {walletBalance != null && (
                  <p
                    className={`mt-3 text-base font-medium ${
                      sufficientBalance ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {sufficientBalance
                      ? "Số dư đủ để thanh toán đơn này."
                      : "Số dư chưa đủ cho đơn này."}
                  </p>
                )}
              </div>

              {/* QR Method */}
              <div
                className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                  selectedPaymentMethod === "qr"
                    ? "border-indigo-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg"
                    : "border-blue-200 hover:border-blue-300 bg-white"
                }`}
                onClick={() => setSelectedPaymentMethod("qr")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg text-blue-900">
                    Quét mã QR để thanh toán
                  </span>
                </div>
                <p className="mt-3 text-base text-slate-600">
                  Chúng tôi sẽ mở trang thanh toán của đối tác (VD: MoMo) với số
                  tiền tương ứng.
                </p>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 text-indigo-600 border-blue-300 rounded focus:ring-indigo-500"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span className="text-base text-slate-700">
                  Tôi đã hiểu và đồng ý với{" "}
                  <strong>quy trình thanh toán cọc 10%</strong>. Sau khi thanh
                  toán cọc, tôi sẽ đặt lịch hẹn với người bán để kiểm tra xe.
                  Nếu xe đúng mô tả, tôi sẽ thanh toán 90% còn lại.
                  <br />
                  <br />
                  Tôi cũng đồng ý với{" "}
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-700 underline font-medium"
                  >
                    Điều khoản và Điều kiện
                  </a>{" "}
                  cũng như{" "}
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-700 underline font-medium"
                  >
                    Chính sách Bảo mật
                  </a>{" "}
                  của EV Market.
                </span>
              </label>
            </div>

            {/* Complete Payment Button */}
            <button
              disabled={!termsAccepted || processing}
              onClick={handlePay}
              className={`w-full mt-8 py-4 px-8 text-white text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg ${
                !termsAccepted || processing
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105"
              }`}
            >
              {processing
                ? "Đang xử lý..."
                : `Thanh toán cọc ${orderData.breakdown.depositAmount}`}
            </button>

            <p className="mt-4 text-center text-sm text-slate-600">
              Sau khi thanh toán cọc thành công, bạn sẽ được chuyển đến trang
              đặt lịch hẹn
            </p>
          </motion.div>
          {/* Security Information */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, type: "spring", delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Secure Payment */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-green-800 mb-2">
                    {t("checkout.security.securePayment")}
                  </h3>
                  <p className="text-sm text-green-700">
                    {t("checkout.security.secureDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Refund Policy */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-start gap-4">
                <RotateCcw className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-blue-800 mb-2">
                    {t("checkout.security.refundPolicy")}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {t("checkout.security.refundDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* 24/7 Support */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-start gap-4">
                <Headphones className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-purple-800 mb-2">
                    {t("checkout.security.support24")}
                  </h3>
                  <p className="text-sm text-purple-700">
                    {t("checkout.security.supportDesc")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        {/* QR Modal */}
        {qrOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <div className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold mb-6 text-blue-900">
                Quét mã QR để thanh toán
              </h3>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-blue-200 shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
                      paymentLinks?.qrCodeUrl ||
                        paymentLinks?.deeplink ||
                        paymentLinks?.payUrl ||
                        ""
                    )}`}
                    alt="MoMo QR"
                    className="w-64 h-64"
                  />
                </div>
                <div className="mt-6 w-full space-y-3">
                  <button
                    onClick={() =>
                      openPaymentUrl(
                        paymentLinks?.deeplink || paymentLinks?.payUrl || "",
                        "_blank"
                      )
                    }
                    className="w-full py-3 rounded-2xl text-white font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg transition-all"
                  >
                    Mở MoMo
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          paymentLinks?.deeplink || paymentLinks?.payUrl || ""
                        );
                        toast.success("Đã sao chép liên kết thanh toán");
                      } catch {
                        toast.error("Không thể sao chép liên kết");
                      }
                    }}
                    className="w-full py-3 rounded-2xl font-bold border-2 border-blue-200 hover:bg-blue-50 transition-all text-blue-900"
                  >
                    Sao chép liên kết
                  </button>
                  <button
                    onClick={() => setQrOpen(false)}
                    className="w-full py-3 rounded-2xl font-bold border-2 border-slate-200 hover:bg-slate-50 transition-all text-slate-700"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
