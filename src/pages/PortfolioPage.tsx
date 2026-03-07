import { useState, useEffect } from "react";
import {
  TrendingUp,
  Briefcase,
  BarChart2,
  Loader2} from "lucide-react";
import { NairaSign } from "../components/NairaSign";
import { investorApi } from "../services/api-service";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export function PortfolioPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    investorApi.investments
      .getMyInvestments()
      .then((res) => {
        setInvestments(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalInvested = investments.reduce(
    (s, i) => s + (i.totalAmount ?? i.amountPaid ?? i.amount ?? 0),
    0,
  );
  const totalReturns = investments.reduce((s, i) => s + (i.returns ?? 0), 0);
  const active = investments.filter(
    (i) => i.status !== "COMPLETED" && i.status !== "CANCELLED",
  ).length;
  const completed = investments.filter((i) => i.status === "COMPLETED").length;

  const statsCards = [
    {
      label: "Total Invested",
      value: fmt(totalInvested),
      icon: NairaSign,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Total Returns",
      value: fmt(totalReturns),
      icon: TrendingUp,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Active",
      value: active.toString(),
      icon: Briefcase,
      color: "bg-amber-100 text-amber-600",
    },
    {
      label: "Completed",
      value: completed.toString(),
      icon: BarChart2,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      PENDING: "bg-amber-100 text-amber-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return map[status] ?? "bg-slate-100 text-slate-600";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
        <p className="text-slate-500 mt-0.5">
          Overview of all your investments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Investment list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">All Investments</h2>
        </div>
        {investments.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No investments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {investments.map((inv: any) => (
              <div
                key={inv.id}
                className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {inv.asset?.name ?? inv.assetName ?? "Investment"}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {inv.createdAt
                      ? new Date(inv.createdAt).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {fmt(inv.totalAmount ?? inv.amountPaid ?? inv.amount ?? 0)}
                  </p>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 inline-block ${statusBadge(inv.status)}`}
                  >
                    {inv.status ?? "ACTIVE"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
