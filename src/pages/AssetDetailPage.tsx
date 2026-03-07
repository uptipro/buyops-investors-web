import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Home,
  BarChart2,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  FileText,
  Video,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { investorApi, resolveMediaUrl } from "../services/api-service";

const fmt = (n?: number) => {
  if (typeof n !== "number" || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
};

const safe = (v: any, fallback = "—") => {
  if (v === null || v === undefined || v === "") return fallback;
  if (typeof v === "number" && isNaN(v)) return fallback;
  return v;
};

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Completed: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  "Under Development": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  "Pre-Launch": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  available: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  reserved: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  sold: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const RISK_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Low: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  Medium: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  High: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-primary" />
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function DetailGrid({
  items,
}: {
  items: { label: string; value: React.ReactNode; accent?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map(({ label, value, accent }) => (
        <div key={label}>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <div
            className={`font-semibold text-sm ${accent ? "text-primary" : "text-slate-900"}`}
          >
            {value ?? "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);

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

  /* ── Derived values ── */
  const images: any[] = asset.images ?? [];
  const numericPrice =
    asset.finalPrice ?? parseFloat(String(asset.price ?? "0"));
  const finalPrice = asset.finalPrice ?? numericPrice;
  const totalFractions = asset.fractionTotal ?? 0;
  const costPerFraction =
    parseFloat(String(asset.fractionCost ?? asset.costPerFraction ?? "0")) ||
    (totalFractions > 0 ? finalPrice / totalFractions : 0);
  const isFractional =
    totalFractions > 0 || asset.ownershipType === "Fractional";
  const soldFractions =
    totalFractions > 0
      ? totalFractions - (asset.availableUnits ?? totalFractions)
      : (asset.totalUnits ?? 0) - (asset.availableUnits ?? 0);
  const fundingProgress =
    totalFractions > 0
      ? Math.min((soldFractions / totalFractions) * 100, 100)
      : (asset.totalUnits ?? 0) > 0
        ? Math.min(
            ((asset.totalUnits! - (asset.availableUnits ?? asset.totalUnits!)) /
              asset.totalUnits!) *
              100,
            100,
          )
        : 0;

  const statusKey = asset.projectStatus ?? String(asset.status ?? "");
  const sc = STATUS_COLORS[statusKey] ?? {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  };
  const rc = RISK_COLORS[asset.riskLevel ?? ""] ?? {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  };

  const imageUrl = (img: any) =>
    resolveMediaUrl(typeof img === "string" ? img : img?.url);

  const prevImg = () =>
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIndex((i) => (i + 1) % images.length);
  const isSold = String(asset.status ?? "").toLowerCase() === "sold";

  return (
    <div className="max-w-3xl mx-auto pb-28">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* ── Image Carousel ── */}
      <div className="relative h-80 bg-slate-100 rounded-2xl overflow-hidden mb-6">
        {images.length > 0 ? (
          <>
            <img
              src={imageUrl(images[imgIndex])}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === imgIndex ? "w-6 bg-primary" : "w-1.5 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Home className="w-16 h-16" />
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* ── 1: Overview ── */}
        <Card>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {asset.name}
              </h1>
              {asset.location && (
                <div className="flex items-center gap-1 text-slate-500 mt-1 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{asset.location}</span>
                </div>
              )}
            </div>
            {statusKey && (
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border shrink-0 ${sc.bg} ${sc.text} ${sc.border}`}
              >
                {statusKey}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {asset.type && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                {asset.type}
              </span>
            )}
            {asset.ownershipType && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                {asset.ownershipType}
              </span>
            )}
            {isFractional && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 font-medium">
                Fractional Available
              </span>
            )}
          </div>
        </Card>

        {/* ── 2: What You Are Buying ── */}
        <div>
          <SectionHeader icon={Home} title="What You Are Buying" />
          <Card>
            <DetailGrid
              items={[
                {
                  label: "Units",
                  value: safe(asset.totalUnits ?? asset.units),
                },
                {
                  label: "Configuration",
                  value: safe(asset.unitConfiguration ?? asset.rooms),
                },
                { label: "Area", value: safe(asset.area) },
                {
                  label: "Furnishing",
                  value: safe(asset.furnished ?? asset.furnishingStatus),
                },
              ]}
            />
            {asset.facilities?.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-4" />
                <p className="text-xs text-slate-400 mb-3">Facilities</p>
                <div className="flex flex-wrap gap-2">
                  {asset.facilities.map((f: string) => (
                    <span
                      key={f}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── 3: Investment Structure ── */}
        <div>
          <SectionHeader icon={BarChart2} title="Investment Structure" />
          <Card>
            <DetailGrid
              items={[
                { label: "Full Price", value: fmt(numericPrice), accent: true },
                {
                  label: "Cost per Fraction",
                  value: isFractional ? (
                    <span className="text-primary">{fmt(costPerFraction)}</span>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "Min. Investment",
                  value: fmt(
                    isFractional
                      ? costPerFraction * (asset.minFraction ?? 1)
                      : numericPrice,
                  ),
                },
                {
                  label: "Total Fractions",
                  value: totalFractions || safe(asset.totalUnits),
                },
              ]}
            />
            <div className="border-t border-slate-100 my-4" />
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-500">Funding Progress</span>
              <span className="text-slate-700 font-medium">
                {soldFractions} /{" "}
                {totalFractions || safe(asset.totalUnits, "?")} sold
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${fundingProgress}%` }}
              />
            </div>
            <p className="text-xs text-primary font-semibold mt-1.5">
              {fundingProgress.toFixed(0)}% funded
            </p>
          </Card>
        </div>

        {/* ── 4: Returns & Income ── */}
        <div>
          <SectionHeader icon={TrendingUp} title="Returns & Income" />
          <Card className="border-green-100 bg-green-50/30">
            <DetailGrid
              items={[
                {
                  label: "Monthly Rental",
                  value: (
                    <span className="text-green-600">
                      {fmt(Math.round((asset.projectedRentalIncome ?? 0) / 12))}
                    </span>
                  ),
                },
                {
                  label: "Rental Yield",
                  value: (
                    <span className="text-green-600">
                      {asset.rentalYield != null
                        ? `${asset.rentalYield}%`
                        : asset.rentalYieldMin != null &&
                            asset.rentalYieldMax != null
                          ? `${asset.rentalYieldMin}–${asset.rentalYieldMax}%`
                          : "—"}
                    </span>
                  ),
                },
                {
                  label: "Capital Appreciation",
                  value:
                    asset.capitalAppreciation != null
                      ? `${asset.capitalAppreciation}%`
                      : "—",
                },
                {
                  label: "Total Annual Return",
                  value:
                    asset.totalAnnualReturn != null
                      ? `${asset.totalAnnualReturn}%`
                      : "—",
                },
              ]}
            />
            {asset.firstPayoutDate && (
              <>
                <div className="border-t border-green-100 my-4" />
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="text-slate-500">First Payout:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(asset.firstPayoutDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── 5: Pricing & Payment ── */}
        <div>
          <SectionHeader icon={CreditCard} title="Pricing & Payment" />
          <Card>
            {asset.discount && (
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-400">Discount Applied</p>
                  <p className="font-semibold text-green-600 text-sm">
                    {asset.discount}% off
                  </p>
                </div>
                <p className="text-slate-400 line-through text-sm">
                  {fmt(numericPrice)}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Final Price</p>
              <p className="font-bold text-primary text-lg">
                {fmt(finalPrice)}
              </p>
            </div>
            {asset.paymentOptions?.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-4" />
                <p className="text-xs text-slate-400 mb-3">Payment Options</p>
                <div className="flex flex-wrap gap-2">
                  {asset.paymentOptions.map((opt: string) => (
                    <span
                      key={opt}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-medium"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── 6: Risk & Transparency ── */}
        {(asset.constructionStage ||
          asset.riskLevel ||
          asset.managementMode ||
          asset.exitLiquidity) && (
          <div>
            <SectionHeader icon={ShieldCheck} title="Risk & Transparency" />
            <Card>
              <div className="grid grid-cols-2 gap-4">
                {asset.constructionStage && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">
                      Construction Stage
                    </p>
                    <p className="font-semibold text-sm text-slate-900">
                      {asset.constructionStage}
                    </p>
                  </div>
                )}
                {asset.riskLevel && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Risk Level</p>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${rc.bg} ${rc.text} ${rc.border}`}
                    >
                      {asset.riskLevel}
                    </span>
                  </div>
                )}
                {asset.managementMode && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">
                      Management Mode
                    </p>
                    <p className="font-semibold text-sm text-slate-900">
                      {asset.managementMode}
                    </p>
                  </div>
                )}
                {asset.exitLiquidity && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">
                      Exit Liquidity
                    </p>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                      {asset.exitLiquidity}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ── 7: Documents & Media ── */}
        {(asset.virtualTourUrl || asset.documents?.length > 0) && (
          <div>
            <SectionHeader icon={FileText} title="Documents & Media" />
            <div className="space-y-3">
              {asset.virtualTourUrl && (
                <a
                  href={asset.virtualTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <span className="flex-1 font-medium text-slate-900 text-sm">
                    Take Virtual Tour
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              )}
              {asset.documents?.map((doc: any, i: number) => (
                <a
                  key={i}
                  href={resolveMediaUrl(doc.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {doc.name ?? doc.title ?? "Document"}
                    </p>
                    {doc.type && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {doc.type}
                      </p>
                    )}
                  </div>
                  <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── 8: About This Property ── */}
        {asset.description && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              About This Property
            </h2>
            <Card>
              <p className="text-slate-600 leading-relaxed text-sm">
                {asset.description}
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-4 py-4 lg:left-64">
        <div className="max-w-3xl mx-auto flex gap-3">
          {isFractional && (
            <button
              onClick={() =>
                navigate(`/marketplace/${asset.id}/invest?type=fractional`)
              }
              className="flex-1 py-3 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
            >
              Buy Fraction
            </button>
          )}
          <button
            onClick={() => navigate(`/marketplace/${asset.id}/invest`)}
            disabled={isSold}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-colors ${
              isSold
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isSold ? "Sold Out" : isFractional ? "Buy Asset" : "Buy Property"}
          </button>
        </div>
      </div>
    </div>
  );
}
