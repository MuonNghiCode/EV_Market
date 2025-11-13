"use client";
import React, { useState } from "react";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import colors from "../../Utils/Color";
import { useI18nContext } from "../../providers/I18nProvider";
import { forgotPassword } from "../../services";
import { useToast } from "../../providers/ToastProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import Link from "next/link";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useI18nContext();
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await forgotPassword({ email });

      if (response.success) {
        setIsSuccess(true);
        toast.success(
          t(
            "auth.forgotPassword.emailSent",
            "If an account with that email exists, a password reset link has been sent."
          )
        );
      } else {
        toast.error(
          response.message ||
            t("auth.forgotPassword.failed", "Failed to send reset email")
        );
      }
    } catch (error) {
      toast.error(
        t("auth.forgotPassword.unexpectedError", "An unexpected error occurred")
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
                  {t("auth.forgotPassword.title", "Forgot Password?")}
                </h2>
                <p className="text-slate-500 text-sm">
                  {t(
                    "auth.forgotPassword.subtitle",
                    "Enter your email address and we'll send you a link to reset your password"
                  )}
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <motion.div variants={fadeUp} custom={1}>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    {t("auth.forgotPassword.emailLabel", "Email Address")}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 pl-12 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 text-slate-700 shadow-sm"
                      style={{
                        borderColor: colors.Border,
                      }}
                      placeholder={t(
                        "auth.forgotPassword.emailPlaceholder",
                        "Enter your email"
                      )}
                      required
                    />
                    <Mail
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"
                    />
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  variants={fadeUp}
                  custom={2}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {t("common.sending", "Sending...")}
                    </div>
                  ) : (
                    t("auth.forgotPassword.sendButton", "Send Reset Link")
                  )}
                </motion.button>

                {/* Back to Login Link */}
                <motion.div
                  className="text-center mt-6"
                  variants={fadeUp}
                  custom={3}
                >
                  <p className="text-sm text-slate-500">
                    {t("auth.forgotPassword.rememberPassword", "Remember your password?")}{" "}
                    <Link
                      href="/login"
                      className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      {t("auth.forgotPassword.backToLogin", "Back to Login")}
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
                {t("auth.forgotPassword.successTitle", "Check Your Email")}
              </h2>
              <p className="text-slate-600 mb-6">
                {t(
                  "auth.forgotPassword.successMessage",
                  "If an account with that email exists, we've sent you a password reset link."
                )}
              </p>
              <p className="text-sm text-slate-500 mb-8">
                {t(
                  "auth.forgotPassword.checkSpam",
                  "Didn't receive the email? Check your spam folder or try again."
                )}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                <ArrowLeft size={18} />
                {t("auth.forgotPassword.backToLogin", "Back to Login")}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
