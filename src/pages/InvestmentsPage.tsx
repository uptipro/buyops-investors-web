import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { investorApi } from "../services/api-service";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export function InvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    investorApi.investments
      .getMyInvestments()
      .then((res) => {
        setInvestments(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      PENDING: "bg-amber-100 text-amber-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
      PAID: "bg-green-100 text-green-700",
      OVERDUE: "bg-red-100 text-red-700",
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Investments</h1>
        <p className="text-slate-500 mt-0.5">
          {investments.length} total investment
          {investments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No investments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((inv: any) => (
            <div
              key={inv.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(inv.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <p className="font-semibold text-slate-900">
                    {inv.asset?.name ?? inv.assetName ?? "Investment"}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {inv.date
                      ? new Date(inv.date).toLocaleDateString("en-NG")
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {fmt(
                        inv.totalAmount ?? inv.amountPaid ?? inv.amount ?? 0,
                      )}
                    </p>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-block ${statusBadge(inv.status)}`}
                    >
                      {inv.status ?? "ACTIVE"}
                    </span>
                  </div>
                  {expanded === inv.id ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Installments */}
              {expanded === inv.id && (
                <div className="border-t border-slate-100 p-5">
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Payment Schedule
                  </h4>
                  {(inv.installments ?? []).length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No installment data available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(inv.installments ?? []).map(
                        (inst: any, idx: number) => (
                          <div
                            key={inst.id ?? idx}
                            className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                Installment {idx + 1}
                              </p>
                              <p className="text-xs text-slate-500">
                                Due:{" "}
                                {inst.dueDate
                                  ? new Date(inst.dueDate).toLocaleDateString(
                                      "en-NG",
                                    )
                                  : "—"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">
                                {fmt(inst.amount ?? 0)}
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block ${statusBadge(inst.status)}`}
                              >
                                {inst.status ?? "PENDING"}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                  <Link
                    to={`/investments/${inv.id}`}
                    className="mt-3 inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  >
                    View Full Details →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
