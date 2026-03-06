import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { investorApi, paymentsApi } from "../services/api-service";

type Status = "verifying" | "creating" | "success" | "failed";

export default function PaymentCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);

      // Detect provider and reference from URL params
      // Paystack: ?reference=xxx&trxref=xxx
      // Flutterwave: ?tx_ref=xxx&transaction_id=xxx&status=xxx
      const paystackRef = params.get("reference") || params.get("trxref");
      const flutterwaveRef = params.get("tx_ref");
      const reference = paystackRef || flutterwaveRef || null;

      if (!reference) {
        setStatus("failed");
        setMessage("Payment reference not found. Please contact support.");
        return;
      }

      // Load the pending payment context stored before redirect
      const contextKey = `buyops_payment_${reference}`;
      const storedStr = sessionStorage.getItem(contextKey);
      const stored = storedStr ? JSON.parse(storedStr) : null;
      const provider: string =
        stored?.provider ?? (flutterwaveRef ? "flutterwave" : "paystack");

      try {
        setMessage("Verifying payment with provider…");
        const verifyRes = await paymentsApi.verify(
          reference,
          provider as "paystack" | "flutterwave",
        );
        const verifyData = verifyRes.data;

        const providerStatus: string =
          verifyData?.status ?? verifyData?.raw?.data?.status ?? "";

        // Paystack: status === 'success', Flutterwave: status === 'successful'
        const isSuccess =
          providerStatus === "success" || providerStatus === "successful";

        if (!isSuccess) {
          setStatus("failed");
          setMessage(
            `Payment was not successful (status: ${providerStatus || "unknown"}). No charge was made.`,
          );
          return;
        }

        // Record the investment in the backend
        setStatus("creating");
        setMessage("Recording your investment…");

        const amount = stored?.amount ?? verifyData?.amount ?? 0;
        const assetId = stored?.assetId;

        if (!assetId) {
          // Payment succeeded but we lost the context — investment can't be
          // auto-recorded. Show a partial-success message.
          setStatus("success");
          setMessage(
            "Payment confirmed! Please contact support to complete your investment registration.",
          );
          sessionStorage.removeItem(contextKey);
          setTimeout(() => navigate("/portfolio"), 4000);
          return;
        }

        await investorApi.investments.create({ amount, assetId });

        sessionStorage.removeItem(contextKey);
        setStatus("success");
        setMessage("Investment recorded successfully! Redirecting…");
        setTimeout(() => navigate("/portfolio"), 2500);
      } catch (err: any) {
        setStatus("failed");
        setMessage(
          err?.response?.data?.message ??
            err?.message ??
            "Something went wrong. Please contact support with your payment reference.",
        );
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon = {
    verifying: <Loader2 className="w-12 h-12 text-primary animate-spin" />,
    creating: <Loader2 className="w-12 h-12 text-primary animate-spin" />,
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    failed: <XCircle className="w-12 h-12 text-red-500" />,
  }[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-10 max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">{icon}</div>
        <h2 className="text-xl font-bold text-slate-900">
          {status === "success"
            ? "Payment Successful"
            : status === "failed"
              ? "Payment Failed"
              : "Processing Payment"}
        </h2>
        <p className="text-slate-500 text-sm">{message}</p>

        {status === "failed" && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-400">
              Reference:{" "}
              <span className="font-mono">
                {new URLSearchParams(window.location.search).get("reference") ||
                  new URLSearchParams(window.location.search).get("tx_ref") ||
                  "—"}
              </span>
            </p>
            <button
              onClick={() => navigate("/marketplace")}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Back to Marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
