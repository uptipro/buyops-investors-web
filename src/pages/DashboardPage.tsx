import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Briefcase,
  BarChart2,
  ArrowRight,
  RefreshCw} from "lucide-react";
import { NairaSign } from "../components/NairaSign";
import { useAuth } from "../contexts/AuthContext";
import { investorApi } from "../services/api-service";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    totalReturns: 0,
    portfolioValue: 0,
  });

  const load = async () => {
    try {
      const [invRes] = await Promise.all([
        investorApi.investments.getMyInvestments(),
      ]);
      const invs = invRes.data || [];
      setInvestments(invs);
      const totalInvested = invs.reduce(
        (s: number, i: any) =>
          s + (i.totalAmount ?? i.amountPaid ?? i.amount ?? 0),
        0,
      );
      setStats({
        totalInvested,
        activeInvestments: invs.length,
        totalReturns: invs.reduce(
          (s: number, i: any) => s + (i.returns ?? 0),
          0,
        ),
        portfolioValue: totalInvested,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statCards = [
    {
      label: "Portfolio Value",
      value: fmt(stats.portfolioValue),
      icon: NairaSign,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Total Invested",
      value: fmt(stats.totalInvested),
      icon: BarChart2,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Active Investments",
      value: stats.activeInvestments.toString(),
      icon: Briefcase,
      color: "text-amber-600 bg-amber-100",
    },
    {
      label: "Total Returns",
      value: fmt(stats.totalReturns),
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good day, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 mt-0.5">
            Here's your investment overview
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw
            className={`w-5 h-5 text-slate-500 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
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

      {/* Recent Investments */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Investments</h2>
          <Link
            to="/investments"
            className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : investments.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No investments yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Browse the marketplace to get started
              </p>
              <Link
                to="/marketplace"
                className="btn-primary inline-block mt-4 text-sm px-6 py-2.5"
              >
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {investments.slice(0, 5).map((inv: any) => (
                <Link
                  key={inv.id}
                  to={`/investments`}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {inv.asset?.name ?? inv.assetName ?? "Investment"}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {inv.status ?? "Active"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {fmt(
                        inv.totalAmount ?? inv.amountPaid ?? inv.amount ?? 0,
                      )}
                    </p>
                    <p
                      className={`text-xs mt-0.5 font-medium ${
                        inv.status === "COMPLETED"
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    >
                      {inv.status ?? "ACTIVE"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/marketplace"
          className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white hover:opacity-90 transition-opacity"
        >
          <h3 className="font-bold text-lg mb-1">Browse Marketplace</h3>
          <p className="text-blue-100 text-sm">
            Discover new investment opportunities
          </p>
          <ArrowRight className="w-5 h-5 mt-3" />
        </Link>
        <Link
          to="/portfolio"
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white hover:opacity-90 transition-opacity"
        >
          <h3 className="font-bold text-lg mb-1">View Portfolio</h3>
          <p className="text-green-100 text-sm">
            Track your investment performance
          </p>
          <ArrowRight className="w-5 h-5 mt-3" />
        </Link>
      </div>
    </div>
  );
}
