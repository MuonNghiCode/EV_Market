"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShoppingCart, Trash2, ArrowRight, Package } from "lucide-react";
import { getCart, removeFromCart, checkoutCart } from "@/services";
import { getWalletBalance } from "@/services/Wallet";
import type { CartItem } from "@/types/cart";
import Image from "next/image";
import Swal from "sweetalert2";
import { Wallet, CreditCard } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"MOMO" | "WALLET">("MOMO");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    loadCart();
    loadWalletBalance();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCartItems(response.data.items);
    } catch (error: any) {
      console.error("Failed to load cart:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Không thể tải giỏ hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      setLoadingBalance(true);
      const response = await getWalletBalance();
      setWalletBalance(response.data?.availableBalance ?? null);
    } catch (error) {
      console.error("Failed to load wallet balance:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    const result = await Swal.fire({
      title: "Xóa khỏi giỏ hàng?",
      text: "Bạn có chắc chắn muốn xóa sản phẩm này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        setRemoving(itemId);
        await removeFromCart(itemId);
        await loadCart();
        Swal.fire({
          icon: "success",
          title: "Đã xóa",
          text: "Sản phẩm đã được xóa khỏi giỏ hàng",
          timer: 1500,
        });
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: error.message || "Không thể xóa sản phẩm",
        });
      } finally {
        setRemoving(null);
      }
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Giỏ hàng trống",
        text: "Vui lòng thêm sản phẩm vào giỏ hàng",
      });
      return;
    }

    // Check wallet balance if using WALLET
    if (
      paymentMethod === "WALLET" &&
      walletBalance !== null &&
      walletBalance < totalPrice
    ) {
      Swal.fire({
        icon: "error",
        title: "Số dư không đủ",
        text: "Vui lòng nạp thêm tiền vào ví hoặc chọn phương thức khác",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận thanh toán",
      text: `Thanh toán ${totalPrice.toLocaleString()} VNĐ bằng ${
        paymentMethod === "MOMO" ? "MoMo" : "Ví EV Market"
      }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });

    if (result.dismiss) return;

    try {
      setCheckingOut(true);
      // Only MOMO needs redirectUrl
      const redirectUrl =
        paymentMethod === "MOMO"
          ? `${window.location.origin}/checkout/result?type=battery`
          : undefined;
      const response = await checkoutCart(paymentMethod, redirectUrl);

      console.log("Cart checkout response:", response);
      console.log("Payment method:", paymentMethod);

      if (paymentMethod === "MOMO") {
        // MOMO payment - redirect to payment URL
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          throw new Error("Không tìm thấy URL thanh toán MoMo");
        }
      } else {
        // WALLET payment - checkout already completes payment
        const transactionId =
          (response.data as any).id || response.data.transaction?.id;

        console.log("Response data:", response.data);
        console.log("Extracted transactionId:", transactionId);

        if (!transactionId) {
          throw new Error("Không tìm thấy transaction ID");
        }

        // Success - redirect to result page
        Swal.fire({
          icon: "success",
          title: "Thanh toán thành công",
          text: "Đơn hàng của bạn đã được thanh toán bằng ví",
          timer: 2000,
        });

        setTimeout(() => {
          window.location.href = `${window.location.origin}/checkout/result?type=battery&resultCode=0&message=Thanh toán thành công&orderId=${transactionId}`;
        }, 1500);
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi thanh toán",
        text: error.message || "Không thể thực hiện thanh toán",
      });
      setCheckingOut(false);
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.battery.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
            <span className="text-gray-500">({cartItems.length} sản phẩm)</span>
          </div>

          {cartItems.length === 0 ? (
            /* Empty Cart */
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Giỏ hàng trống
              </h2>
              <p className="text-gray-600 mb-6">
                Hãy thêm pin vào giỏ hàng để tiếp tục mua sắm
              </p>
              <button
                onClick={() => router.push("/batteries")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Xem danh sách pin
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-lg p-6 flex gap-6"
                  >
                    {/* Image */}
                    <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={item.battery.images[0] || "/Homepage/Pin.png"}
                        alt={item.battery.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {item.battery.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>{item.battery.capacity} kWh</span>
                        <span>•</span>
                        <span>{item.battery.health}% Health</span>
                        <span>•</span>
                        <span>{item.battery.year}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-600">
                          {item.battery.price.toLocaleString()} VNĐ
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={removing === item.id}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {removing === item.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Tóm tắt đơn hàng
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Tạm tính</span>
                      <span>{totalPrice.toLocaleString()} VNĐ</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Phí vận chuyển</span>
                      <span className="text-green-600">Miễn phí</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        Tổng cộng
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {totalPrice.toLocaleString()} VNĐ
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Phương thức thanh toán
                    </h3>
                    <div className="space-y-3">
                      {/* MoMo */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("MOMO")}
                        className={`w-full p-4 border-2 rounded-lg transition-all ${
                          paymentMethod === "MOMO"
                            ? "border-pink-500 bg-pink-50"
                            : "border-gray-200 hover:border-pink-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            M
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">MoMo</p>
                            <p className="text-xs text-gray-600">
                              Thanh toán qua ví MoMo
                            </p>
                          </div>
                          {paymentMethod === "MOMO" && (
                            <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Wallet */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("WALLET")}
                        className={`w-full p-4 border-2 rounded-lg transition-all ${
                          paymentMethod === "WALLET"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Wallet className="w-12 h-12 text-blue-600" />
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">
                              Ví EV Market
                            </p>
                            <p className="text-xs text-gray-600">
                              {loadingBalance ? (
                                "Đang tải..."
                              ) : walletBalance !== null ? (
                                <>
                                  Số dư: {walletBalance.toLocaleString()} VNĐ
                                  {walletBalance < totalPrice && (
                                    <span className="text-red-600 font-semibold ml-1">
                                      (Không đủ)
                                    </span>
                                  )}
                                </>
                              ) : (
                                "Thanh toán từ số dư ví"
                              )}
                            </p>
                          </div>
                          {paymentMethod === "WALLET" && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut || cartItems.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-lg transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {checkingOut ? (
                      "Đang xử lý..."
                    ) : (
                      <>
                        Thanh toán
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Thanh toán 100% để hệ thống ship pin đến bạn
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
