import { useEffect, useState } from "react";
import {
  FileText,
  Briefcase,
  Shield,
  FileBarChart,
  AlertCircle,
  Download,
} from "lucide-react";
import { investorApi } from "../services/api-service";

type Doc = {
  id: string;
  title: string;
  type?: string;
  url: string;
  createdAt?: string;
  assetName?: string;
  assetId?: string;
};

const getDocIcon = (type?: string) => {
  switch (type?.toLowerCase()) {
    case "agreement":
      return <Briefcase className="w-5 h-5 text-blue-500" />;
    case "title":
    case "deed":
      return <Shield className="w-5 h-5 text-green-500" />;
    case "tax":
      return <FileBarChart className="w-5 h-5 text-orange-500" />;
    default:
      return <FileText className="w-5 h-5 text-slate-400" />;
  }
};

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await investorApi.documents.getMyDocuments();
        setDocs(res.data || []);
      } catch {
        setError("Failed to load documents.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Group by asset
  const grouped = docs.reduce<Record<string, Doc[]>>((acc, doc) => {
    const key = doc.assetName ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-xl">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">
            Investment documents from your assets
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="card flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No documents yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Documents from your investments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([assetName, assetDocs]) => (
            <div key={assetName}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                {assetName}
              </h2>
              <div className="space-y-2">
                {assetDocs.map((doc) => (
                  <div key={doc.id} className="card flex items-center gap-4">
                    <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                      {getDocIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {fmtDate(doc.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => window.open(doc.url, "_blank")}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                      title="Open / Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
