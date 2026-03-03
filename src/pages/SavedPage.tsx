import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, MapPin, Loader2, Trash2 } from "lucide-react";
import { investorApi } from "../services/api-service";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export function SavedPage() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    investorApi.assets
      .getSaved()
      .then((res) => {
        setSaved(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const unsave = async (assetId: string) => {
    try {
      await investorApi.assets.unsave(assetId);
      setSaved((prev) => prev.filter((a) => a.id !== assetId));
    } catch {
      /* ignore */
    }
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
        <h1 className="text-2xl font-bold text-slate-900">Saved Properties</h1>
        <p className="text-slate-500 mt-0.5">{saved.length} saved</p>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No saved properties</p>
          <p className="text-sm mt-1">Properties you save will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {saved.map((asset: any) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <Link to={`/marketplace/${asset.id}`}>
                <div className="h-40 bg-slate-100">
                  {(asset.imageUrl || asset.images?.[0]) && (
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
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900">{asset.name}</p>
                  {asset.location && (
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {asset.location}
                    </div>
                  )}
                  <p className="font-bold text-primary mt-2">
                    {fmt(asset.price ?? asset.totalValue ?? 0)}
                  </p>
                </div>
              </Link>
              <div className="px-4 pb-4">
                <button
                  onClick={() => unsave(asset.id)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
