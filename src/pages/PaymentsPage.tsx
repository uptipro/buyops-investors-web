import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { investorApi } from "../services/api-service";

type Installment = {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | string;
  investmentId: string;
  assetName?: string;
  idx: number;
};

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  OVERDUE: "bg-red-100 text-red-700",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"}`}
  >
    {status}
  </span>
);

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function PaymentsPage() {
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [allInstallments, setAllInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await investorApi.investments.getMyInvestments();
        const investments: any[] = res.data || [];

        const flat: Installment[] = investments.flatMap((inv: any) =>
          (inv.installments ?? []).map((inst: any, idx: number) => ({
            ...inst,
            investmentId: inv.id,
            assetName: inv.asset?.name ?? "Property",
            idx,
          })),
        );

        setAllInstallments(flat);
      } catch {
        setError("Failed to load payments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const upcoming = allInstallments
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  const history = allInstallments
    .filter((i) => i.status === "PAID")
    .sort(
      (a, b) =>
        new Date(b.paidDate ?? 0).getTime() -
        new Date(a.paidDate ?? 0).getTime(),
    );

  const display = tab === "upcoming" ? upcoming : history;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-xl">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500">
            Manage your installment payments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(["upcoming", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              tab === t
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : error ? (
        <div className="card flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : display.length === 0 ? (
        <div className="card text-center py-16">
          {tab === "upcoming" ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">
                No upcoming payments
              </p>
              <p className="text-sm text-slate-500 mt-1">
                You're all caught up!
              </p>
            </>
          ) : (
            <>
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">
                No payment history yet
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Completed payments will appear here.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {display.map((inst) => (
            <div
              key={inst.id}
              className="card flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/investments/${inst.investmentId}`}
                    className="font-semibold text-slate-800 hover:text-primary text-sm truncate block"
                  >
                    {inst.assetName}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Installment #{inst.idx + 1} ·{" "}
                    {tab === "history" && inst.paidDate
                      ? `Paid ${fmtDate(inst.paidDate)}`
                      : `Due ${fmtDate(inst.dueDate)}`}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="font-bold text-slate-900 text-sm">
                  {fmt(inst.amount)}
                </p>
                <StatusBadge status={inst.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
