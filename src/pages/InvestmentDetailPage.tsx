import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import { investorApi, resolveMediaUrl } from "../services/api-service";

type Investment = {
  id: string;
  totalAmount: number;
  status: string;
  date: string;
  asset?: {
    id: string;
    name: string;
    location?: string;
    images?: (string | { url: string })[];
  };
  installmentPlans?: {
    id: string;
    paidAmount: number;
  }[];
  installments?: Installment[];
};

type Installment = {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const Badge = ({ status }: { status: string }) => (
  <span
    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[status?.toLowerCase()] ?? "bg-slate-100 text-slate-600"}`}
  >
    {status}
  </span>
);

export default function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [tab, setTab] = useState<"overview" | "payments" | "income">(
    "overview",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [invRes, instRes] = await Promise.all([
          investorApi.investments.getById(id),
          investorApi.investments
            .getInstallments(id)
            .catch(() => ({ data: [] })),
        ]);
        setInvestment(invRes.data);
        setInstallments(instRes.data || []);
      } catch {
        setError("Failed to load investment details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading)
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        <div className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    );

  if (error || !investment)
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="card flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error ?? "Investment not found."}</p>
        </div>
      </div>
    );

  const amountPaid = investment.installmentPlans?.[0]?.paidAmount ?? 0;
  const progress = Math.min(
    100,
    (amountPaid / (investment.totalAmount || 1)) * 100,
  );
  const imageRaw = investment.asset?.images?.[0];
  const imageUrl = imageRaw
    ? resolveMediaUrl(typeof imageRaw === "string" ? imageRaw : imageRaw.url)
    : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Back */}
      <Link
        to="/investments"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Investments
      </Link>

      {/* Hero */}
      <div className="relative h-48 rounded-2xl overflow-hidden mb-4 bg-slate-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={investment.asset?.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-4xl font-bold">
            {investment.asset?.name?.charAt(0) ?? "?"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-xl font-bold">
            {investment.asset?.name ?? "Property"}
          </h1>
          {investment.asset?.location && (
            <p className="text-sm flex items-center gap-1 text-white/80 mt-0.5">
              <MapPin className="w-3 h-3" />
              {investment.asset.location}
            </p>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <Badge status={investment.status} />
        </div>
      </div>

      {/* Marketplace link */}
      {investment.asset?.id && (
        <div className="mb-4">
          <Link
            to={`/marketplace/${investment.asset.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            View in Marketplace <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(["overview", "payments", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              tab === t
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">
                Amount Paid
              </span>
              <span className="text-sm font-bold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>
                Paid:{" "}
                <span className="font-semibold text-green-600">
                  {fmt(amountPaid)}
                </span>
              </span>
              <span>
                Total:{" "}
                <span className="font-semibold text-slate-800">
                  {fmt(investment.totalAmount)}
                </span>
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="card space-y-3">
            {[
              { label: "Start Date", value: fmtDate(investment.date) },
              { label: "Status", value: <Badge status={investment.status} /> },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0"
              >
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-800">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments */}
      {tab === "payments" && (
        <div className="space-y-3">
          {installments.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No installments found.</p>
            </div>
          ) : (
            installments.map((inst, idx) => (
              <div
                key={inst.id}
                className="card flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Installment #{idx + 1}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {inst.paidDate
                      ? `Paid ${fmtDate(inst.paidDate)}`
                      : `Due ${fmtDate(inst.dueDate)}`}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    {fmt(inst.amount)}
                  </p>
                  <Badge status={inst.status} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Income */}
      {tab === "income" && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Expected Monthly Income
              </p>
              <p className="text-xs text-slate-500">
                Based on current ownership stake
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <DollarSign className="w-6 h-6 text-green-500" />
            <span>—</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Income projections are available once the property is fully funded
            and generating returns.
          </p>
        </div>
      )}
    </div>
  );
}
