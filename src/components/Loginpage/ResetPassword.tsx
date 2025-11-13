"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import colors from "../../Utils/Color";
import { useI18nContext } from "../../providers/I18nProvider";
import { resetPassword } from "../../services";
import { useToast } from "../../providers/ToastProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import Link from "next/link";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { t } = useI18nContext();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      toast.error(
        t("auth.resetPassword.invalidToken", "Invalid or missing reset token")
      );
      router.push("/forgot-password");
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, router, toast, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(
        t("auth.resetPassword.invalidToken", "Invalid or missing reset token")
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        t("auth.resetPassword.passwordMismatch", "Passwords do not match")
      );
      return;
    }

    if (newPassword.length < 6) {
      toast.error(
        t(
          "auth.resetPassword.passwordTooShort",
          "Password must be at least 6 characters"
        )
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        setIsSuccess(true);
        toast.success(
          t(
            "auth.resetPassword.success",
            "Your password has been reset successfully!"
          )
        );
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        toast.error(
          response.message ||
            t("auth.resetPassword.failed", "Failed to reset password")
        );
      }
    } catch (error) {
      toast.error(
        t("auth.resetPassword.unexpectedError", "An unexpected error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: easeOut, delay: i * 0.08 },
    }),
  };

  if (!token) {
    return null; // Will redirect to forgot-password
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-400/30 via-blue-300/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-40 left-40 w-60 h-60 bg-gradient-to-tr from-green-300/20 via-blue-200/10 to-transparent rounded-full blur-2xl" />
      </div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 pointer-events-none z-0">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tr from-indigo-400/30 via-blue-200/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-40 w-60 h-60 bg-gradient-to-br from-blue-300/20 via-green-200/10 to-transparent rounded-full blur-2xl" />
      </div>

      <motion.div
        className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-blue-100 relative z-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Back to Login Button */}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="absolute left-6 top-6 flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium shadow transition-colors duration-200"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">{t("common.back", "Back")}</span>
        </button>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: { transition: { staggerChildren: 0.09 } },
                hidden: {},
              }}
            >
              <motion.div
                className="mb-8 text-center mt-8"
                variants={fadeUp}
                custom={0}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent tracking-tight drop-shadow">
                    {t("brand", "EcoTrade EV")}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  {t("auth.resetPassword.title", "Reset Your Password")}
                </h2>
                <p className="text-slate-500 text-sm">
                  {t(
                    "auth.resetPassword.subtitle",
                    "Enter your new password below"
                  )}
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password Field */}
                <motion.div variants={fadeUp} custom={1}>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    {t("auth.resetPassword.newPasswordLabel", "New Password")}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 text-slate-700 shadow-sm"
                      style={{
                        borderColor: colors.Border,
                      }}
                      placeholder={t(
                        "auth.resetPassword.newPasswordPlaceholder",
                        "Enter new password"
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-blue-50 transition-colors duration-200 text-slate-400"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div variants={fadeUp} custom={2}>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    {t(
                      "auth.resetPassword.confirmPasswordLabel",
                      "Confirm Password"
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 text-slate-700 shadow-sm"
                      style={{
                        borderColor: colors.Border,
                      }}
                      placeholder={t(
                        "auth.resetPassword.confirmPasswordPlaceholder",
                        "Confirm new password"
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-blue-50 transition-colors duration-200 text-slate-400"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Password Requirements */}
                <motion.div
                  variants={fadeUp}
                  custom={3}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                  <p className="text-xs text-slate-600 mb-2 font-semibold">
                    {t(
                      "auth.resetPassword.requirements",
                      "Password Requirements:"
                    )}
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                      {t(
                        "auth.resetPassword.requirement1",
                        "At least 6 characters long"
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                      {t(
                        "auth.resetPassword.requirement2",
                        "Passwords must match"
                      )}
                    </li>
                  </ul>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  variants={fadeUp}
                  custom={4}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {t("common.processing", "Processing...")}
                    </div>
                  ) : (
                    t("auth.resetPassword.resetButton", "Reset Password")
                  )}
                </motion.button>

                {/* Back to Login Link */}
                <motion.div
                  className="text-center mt-6"
                  variants={fadeUp}
                  custom={5}
                >
                  <p className="text-sm text-slate-500">
                    {t("auth.resetPassword.rememberPassword", "Remember your password?")}{" "}
                    <Link
                      href="/login"
                      className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      {t("auth.resetPassword.backToLogin", "Back to Login")}
                    </Link>
                  </p>
                </motion.div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                {t("auth.resetPassword.successTitle", "Password Reset!")}
              </h2>
              <p className="text-slate-600 mb-6">
                {t(
                  "auth.resetPassword.successMessage",
                  "Your password has been reset successfully. You can now log in with your new password."
                )}
              </p>
              <p className="text-sm text-slate-500 mb-8">
                {t(
                  "auth.resetPassword.redirecting",
                  "Redirecting to login page..."
                )}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                {t("auth.resetPassword.loginNow", "Login Now")}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default ResetPassword;
