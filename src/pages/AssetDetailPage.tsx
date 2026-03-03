import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Bed, Bath, Square, Loader2 } from "lucide-react";
import { investorApi, resolveMediaUrl } from "../services/api-service";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    investorApi.assets
      .getById(id)
      .then((res) => {
        setAsset(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  if (!asset)
    return (
      <div className="text-center py-20 text-slate-400">
        Property not found.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Image */}
      <div className="h-72 bg-slate-100 rounded-2xl overflow-hidden">
        {asset.imageUrl || asset.images?.[0] ? (
          <img
            src={resolveMediaUrl(
              asset.imageUrl ??
                (typeof asset.images[0] === "string"
                  ? asset.images[0]
                  : asset.images[0]?.url),
            )}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Square className="w-16 h-16" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{asset.name}</h1>
            {asset.location && (
              <div className="flex items-center gap-1 text-slate-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{asset.location}</span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-primary">
            {fmt(asset.price ?? asset.totalValue ?? 0)}
          </p>
        </div>

        {/* Features */}
        <div className="flex gap-4 text-sm text-slate-600">
          {asset.bedrooms && (
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" /> {asset.bedrooms} Bedrooms
            </span>
          )}
          {asset.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" /> {asset.bathrooms} Bathrooms
            </span>
          )}
          {asset.area && (
            <span className="flex items-center gap-1">
              <Square className="w-4 h-4" /> {asset.area} m²
            </span>
          )}
        </div>

        {/* Description */}
        {asset.description && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">
              About this property
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {asset.description}
            </p>
          </div>
        )}

        {/* Amenities */}
        {asset.amenities?.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {asset.amenities.map((a: string) => (
                <span
                  key={a}
                  className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate(`/marketplace/${asset.id}/invest`)}
          className="btn-primary w-full mt-2"
          disabled={asset.status === "SOLD"}
        >
          {asset.status === "SOLD" ? "Sold Out" : "Invest Now"}
        </button>
      </div>
    </div>
  );
}
