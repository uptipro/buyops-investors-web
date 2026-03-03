import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Home,
  Layers,
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { investorApi, resolveMediaUrl } from "../services/api-service";
import { useAuth } from "../contexts/AuthContext";

/* ──────────────────────────────────────────── types ────────────────────── */
type Asset = {
  id: string;
  name: string;
  price: number;
  fractionPrice?: number;
  maxFractions?: number;
  location?: string;
  images?: (string | { url: string })[];
};

type Step = "type" | "fractions" | "plan" | "schedule" | "payment" | "confirm";
type PurchaseType = "full" | "fractional";
type PaymentPlan = "outright" | "installments";
type ScheduleMonths = 3 | 6 | 12 | 24;
type Provider = "paystack" | "flutterwave";

/* ─────────────────────────────────────────── helpers ───────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const generateRef = () =>
  `BUYOPS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

/* ─────────────────────────────────────────── component ─────────────────── */
export default function PurchaseFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(true);
  const [assetError, setAssetError] = useState<string | null>(null);

  // wizard state
  const [step, setStep] = useState<Step>("type");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("full");
  const [fractions, setFractions] = useState(1);
  const [plan, setPlan] = useState<PaymentPlan>("outright");
  const [schedule, setSchedule] = useState<ScheduleMonths>(6);
  const [provider, setProvider] = useState<Provider>("paystack");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    investorApi.assets
      .getById(id)
      .then((r) => setAsset(r.data))
      .catch(() => setAssetError("Failed to load property details."))
      .finally(() => setLoadingAsset(false));
  }, [id]);

  /* ── computed ── */
  const totalAmount = asset
    ? purchaseType === "full"
      ? asset.price
      : (asset.fractionPrice ?? asset.price / (asset.maxFractions ?? 10)) *
        fractions
    : 0;

  const installmentAmount =
    plan === "installments" ? totalAmount / schedule : totalAmount;

  /* ── step list ── */
  const steps: Step[] = [
    "type",
    ...(purchaseType === "fractional" ? (["fractions"] as Step[]) : []),
    "plan",
    ...(plan === "installments" ? (["schedule"] as Step[]) : []),
    "payment",
    "confirm",
  ];

  const stepIndex = steps.indexOf(step);
  const isFirst = stepIndex === 0;
  const isLast = step === "confirm";

  const goNext = () => {
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    if (isFirst) return navigate(`/marketplace/${id}`);
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  };

  /* ── submit ── */
  const handlePurchase = async () => {
    if (!asset || !user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const reference = generateRef();
      const res = await investorApi.payments.initialize({
        provider,
        email: (user as any).email ?? "",
        amount: totalAmount,
        callbackUrl: `${window.location.origin}/payments/callback`,
        reference,
        title: `Investment in ${asset.name}`,
        metadata: {
          assetId: asset.id,
          purchaseType,
          fractions: purchaseType === "fractional" ? fractions : undefined,
          paymentPlan: plan,
          installmentMonths: plan === "installments" ? schedule : undefined,
        },
      });
      const authUrl =
        res.data?.authorizationUrl ??
        res.data?.authorization_url ??
        res.data?.data?.authorizationUrl ??
        res.data?.data?.authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error("No payment URL returned from server.");
      }
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message ??
          err.message ??
          "Payment failed. Please try again.",
      );
      setSubmitting(false);
    }
  };

  /* ── asset loading states ── */
  if (loadingAsset)
    return (
      <div className="max-w-lg mx-auto py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );

  if (assetError || !asset)
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="card flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{assetError ?? "Property not found."}</p>
        </div>
        <Link to="/marketplace" className="btn-outline mt-4 inline-flex">
          Back to Marketplace
        </Link>
      </div>
    );

  const imageRaw = asset.images?.[0];
  const imageUrl = imageRaw
    ? resolveMediaUrl(typeof imageRaw === "string" ? imageRaw : imageRaw.url)
    : null;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Back */}
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />{" "}
        {isFirst ? "Back to Property" : "Back"}
      </button>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="capitalize">{step.replace(/([A-Z])/g, " $1")}</span>
          <span>
            {stepIndex + 1} / {steps.length}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Asset mini card */}
      <div className="card flex items-center gap-3 mb-6 p-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl font-bold">
              {asset.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-slate-800">{asset.name}</p>
          {asset.location && (
            <p className="text-xs text-slate-500">{asset.location}</p>
          )}
          <p className="text-sm font-semibold text-primary mt-0.5">
            {fmt(asset.price)}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="card">
        {/* STEP: Purchase Type */}
        {step === "type" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Purchase Type
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              How would you like to invest in this property?
            </p>
            <div className="space-y-3">
              {[
                {
                  value: "full" as PurchaseType,
                  icon: <Home className="w-5 h-5" />,
                  title: "Full Property",
                  desc: `Buy 100% ownership — ${fmt(asset.price)}`,
                },
                ...(asset.maxFractions
                  ? [
                      {
                        value: "fractional" as PurchaseType,
                        icon: <Layers className="w-5 h-5" />,
                        title: "Fractional",
                        desc: `Buy a share — from ${fmt(asset.fractionPrice ?? asset.price / asset.maxFractions)} per fraction`,
                      },
                    ]
                  : []),
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPurchaseType(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    purchaseType === opt.value
                      ? "border-primary bg-blue-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${purchaseType === opt.value ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{opt.title}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Fractions */}
        {step === "fractions" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Number of Fractions
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Choose how many fractions to buy (1–{asset.maxFractions ?? 10})
            </p>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setFractions((f) => Math.max(1, f - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-200"
              >
                −
              </button>
              <span className="text-3xl font-bold text-primary w-12 text-center">
                {fractions}
              </span>
              <button
                onClick={() =>
                  setFractions((f) => Math.min(asset.maxFractions ?? 10, f + 1))
                }
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-200"
              >
                +
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Total:{" "}
              <span className="font-bold text-slate-900">
                {fmt(
                  (asset.fractionPrice ??
                    asset.price / (asset.maxFractions ?? 10)) * fractions,
                )}
              </span>
            </p>
          </div>
        )}

        {/* STEP: Payment Plan */}
        {step === "plan" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Payment Plan
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              How would you like to pay?
            </p>
            <div className="space-y-3">
              {[
                {
                  value: "outright" as PaymentPlan,
                  title: "Outright",
                  desc: `Pay in full — ${fmt(totalAmount)}`,
                },
                {
                  value: "installments" as PaymentPlan,
                  title: "Installments",
                  desc: "Split across multiple payments",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPlan(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    plan === opt.value
                      ? "border-primary bg-blue-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${plan === opt.value ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{opt.title}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Schedule */}
        {step === "schedule" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Payment Schedule
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Choose how many months to spread payments over
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([3, 6, 12, 24] as ScheduleMonths[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSchedule(m)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    schedule === m
                      ? "border-primary bg-blue-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <p
                    className={`text-xl font-bold ${schedule === m ? "text-primary" : "text-slate-700"}`}
                  >
                    {m}
                  </p>
                  <p className="text-xs text-slate-500">months</p>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    {fmt(totalAmount / m)}/mo
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Payment Method */}
        {step === "payment" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Payment Method
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Select your payment gateway
            </p>
            <div className="space-y-3">
              {[
                {
                  value: "paystack" as Provider,
                  title: "Paystack",
                  desc: "Cards, bank transfers & USSD",
                },
                {
                  value: "flutterwave" as Provider,
                  title: "Flutterwave",
                  desc: "Cards, mobile money & more",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setProvider(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    provider === opt.value
                      ? "border-primary bg-blue-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${provider === opt.value ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{opt.title}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Confirm */}
        {step === "confirm" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Review & Confirm
            </h2>
            <div className="space-y-2 mb-4">
              {[
                { label: "Property", value: asset.name },
                {
                  label: "Purchase Type",
                  value:
                    purchaseType === "full"
                      ? "Full Property"
                      : `${fractions} Fraction${fractions > 1 ? "s" : ""}`,
                },
                {
                  label: "Payment Plan",
                  value:
                    plan === "outright"
                      ? "Outright"
                      : `Installments (${schedule} months)`,
                },
                {
                  label: "Gateway",
                  value: provider.charAt(0).toUpperCase() + provider.slice(1),
                },
                {
                  label:
                    plan === "installments" ? "First Payment" : "Total Amount",
                  value: fmt(
                    plan === "installments" ? installmentAmount : totalAmount,
                  ),
                  highlight: true,
                },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className="flex justify-between py-2 border-b border-slate-50 last:border-0"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span
                    className={`text-sm font-semibold ${highlight ? "text-primary" : "text-slate-800"}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {submitError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            <button
              onClick={handlePurchase}
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Proceed to Payment
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Next button (except on confirm step — handled inline) */}
      {!isLast && (
        <button onClick={goNext} className="btn-primary w-full mt-4">
          Continue
        </button>
      )}
    </div>
  );
}
