import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Loader2,
} from "lucide-react";
import { investorApi } from "../services/api-service";

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
              <div className="relative h-44 bg-slate-100">
                {asset.imageUrl || asset.images?.[0] ? (
                  <img
                    src={
                      asset.imageUrl ??
                      (typeof asset.images[0] === "string"
                        ? asset.images[0]
                        : asset.images[0]?.url)
                    }
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Square className="w-12 h-12" />
                  </div>
                )}
                <button
                  onClick={(e) => toggleSave(asset.id, e)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <Heart
                    className={`w-4 h-4 ${savedIds.has(asset.id) ? "fill-red-500 text-red-500" : "text-slate-400"}`}
                  />
                </button>
                {asset.status && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-lg">
                    {asset.status}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  {asset.name}
                </h3>
                {asset.location && (
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {asset.location}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  {asset.bedrooms && (
                    <span className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5" /> {asset.bedrooms} Beds
                    </span>
                  )}
                  {asset.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5" /> {asset.bathrooms} Baths
                    </span>
                  )}
                  {asset.area && <span>{asset.area} m²</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-lg">
                    {fmt(asset.price ?? asset.totalValue ?? 0)}
                  </p>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                      asset.type === "APARTMENT"
                        ? "bg-blue-100 text-blue-700"
                        : asset.type === "HOUSE"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {asset.type ?? "Property"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
