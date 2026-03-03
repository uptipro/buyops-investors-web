import { useState, useEffect } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { investorApi } from "../services/api-service";

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    investorApi.notifications
      .getAll()
      .then((res) => {
        setNotifications(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try {
      await investorApi.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await investorApi.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeIcon: Record<string, string> = {
    PAYMENT_DUE: "🔔",
    PAYMENT_RECEIVED: "✅",
    INVESTMENT_CONFIRMED: "📄",
    SYSTEM: "ℹ️",
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-0.5">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <button
              key={notif.id}
              onClick={() => !notif.read && markRead(notif.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                notif.read
                  ? "bg-white border-slate-100"
                  : "bg-blue-50/60 border-blue-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{typeIcon[notif.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${notif.read ? "text-slate-700" : "font-semibold text-slate-900"}`}
                  >
                    {notif.message ?? notif.title ?? "Notification"}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notif.body}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {notif.createdAt
                      ? new Date(notif.createdAt).toLocaleString("en-NG")
                      : ""}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
