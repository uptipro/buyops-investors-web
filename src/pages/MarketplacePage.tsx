import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Heart,
  Loader2,
  TrendingUp,
  Building2,
} from "lucide-react";
import { investorApi, resolveMediaUrl } from "../services/api-service";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

const TYPES = ["All", "Apartment", "House", "Commercial", "Land"];

export function MarketplacePage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    investorApi.assets
      .getAll()
      .then((res) => {
        setAssets(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = assets.filter((a) => {
    const matchSearch =
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.location?.toLowerCase().includes(search.toLowerCase());
    const matchType =
      typeFilter === "All" ||
      a.type?.toLowerCase() === typeFilter.toLowerCase();
    return matchSearch && matchType;
  });

  const toggleSave = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (savedIds.has(id)) {
        await investorApi.assets.unsave(id);
        setSavedIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      } else {
        await investorApi.assets.save(id);
        setSavedIds((prev) => new Set(prev).add(id));
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
        <p className="text-slate-500 mt-0.5">
          Browse available investment properties
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((asset: any) => (
            <Link
              key={asset.id}
              to={`/marketplace/${asset.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-52 bg-slate-100 overflow-hidden">
                {asset.images?.[0] || asset.imageUrl ? (
                  <>
                    <img
                      src={resolveMediaUrl(
                        typeof asset.images?.[0] === "string"
                          ? asset.images[0]
                          : (asset.images?.[0]?.url ?? asset.imageUrl),
                      )}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                    <Building2 className="w-14 h-14" />
                  </div>
                )}
                {/* Type badge top-left */}
                {asset.type && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 text-slate-800 text-xs font-semibold rounded-lg z-10">
                    {asset.type}
                  </span>
                )}
                {/* Save button top-right */}
                <button
                  onClick={(e) => toggleSave(asset.id, e)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      savedIds.has(asset.id)
                        ? "fill-red-500 text-red-500"
                        : "text-slate-400"
                    }`}
                  />
                </button>
                {/* Title/location overlay at bottom of image */}
                {(asset.images?.[0] || asset.imageUrl) && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <p className="text-white font-semibold text-base leading-tight">
                      {asset.name}
                    </p>
                    {asset.location && (
                      <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                        <MapPin className="w-3 h-3" />
                        {asset.location}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                {/* Name/location only when there is no image */}
                {!asset.images?.[0] && !asset.imageUrl && (
                  <>
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                      {asset.name}
                    </h3>
                    {asset.location && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {asset.location}
                      </div>
                    )}
                  </>
                )}

                {/* Price + status */}
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      {(asset.fractionTotal ?? 0) > 0
                        ? "Cost per Fraction"
                        : "Price"}
                    </p>
                    <p className="font-bold text-primary text-lg">
                      {fmt(
                        (asset.fractionTotal ?? 0) > 0
                          ? parseFloat(asset.fractionCost ?? "0") ||
                              asset.finalPrice ||
                              0
                          : asset.finalPrice ||
                              parseFloat(asset.price ?? "0") ||
                              0,
                      )}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                      asset.projectStatus === "Completed"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : asset.projectStatus === "Under Development"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {asset.projectStatus || asset.status || "Available"}
                  </span>
                </div>

                {/* Returns card */}
                {(asset.projectedRentalIncome || asset.totalAnnualReturn) && (
                  <div className="mt-3 flex items-center justify-between bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-700 text-sm">
                          {fmt(asset.projectedRentalIncome ?? 0)}
                        </p>
                        <p className="text-xs text-slate-400">Annual Income</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 text-sm">
                        {asset.totalAnnualReturn
                          ? `${asset.totalAnnualReturn.toFixed(1)}%`
                          : asset.rentalYield
                            ? `${Number(asset.rentalYield).toFixed(1)}%`
                            : "-"}
                      </p>
                      <p className="text-xs text-slate-400">Total Return</p>
                    </div>
                  </div>
                )}

                {/* Funding progress */}
                {(asset.totalUnits ?? 0) > 0 &&
                  (() => {
                    const progress =
                      asset.availableUnits != null
                        ? ((asset.totalUnits - asset.availableUnits) /
                            asset.totalUnits) *
                          100
                        : 0;
                    return (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                          <span>Funding Progress</span>
                          <span className="font-semibold text-green-600">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(asset.fractionTotal ?? 0) > 0 && (
                    <span className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-600 border border-green-100 font-medium">
                      Fractional
                    </span>
                  )}
                  {asset.riskLevel && (
                    <span className="text-xs px-2 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
                      {asset.riskLevel} Risk
                    </span>
                  )}
                  {asset.availableUnits != null && (
                    <span className="text-xs px-2 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
                      {asset.availableUnits} Available
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
