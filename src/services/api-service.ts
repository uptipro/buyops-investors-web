import api from "./api";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ?? "https://buyops-backend-production-9b5d.up.railway.app";

/** Resolve a relative media path to an absolute URL */
export const resolveMediaUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const clean = url.startsWith("/") ? url : `/${url}`;
    return `${BACKEND_URL}${clean}`;
};

// Auth
export const authApi = {
    login: (email: string, password: string) => api.post("/auth/login", { email, password }),
    register: (data: object) => api.post("/auth/register", data),
    logout: () => api.post("/auth/logout"),
    getProfile: () => api.get("/auth/me"),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        api.post("/auth/change-password", data),
    // 2FA
    setup2FA: () => api.post("/auth/2fa/setup"),
    enable2FA: (token: string) => api.post("/auth/2fa/enable", { token }),
    disable2FA: (token: string) => api.post("/auth/2fa/disable", { token }),
    verify2FA: (interimToken: string, token: string) =>
        api.post("/auth/2fa/verify", { interimToken, token }),
};

// Payments gateway
export const paymentsApi = {
    getProviders: () => api.get("/payments/providers"),
    initialize: (data: {
        provider: string;
        email: string;
        amount: number;
        callbackUrl: string;
        reference: string;
        metadata?: object;
        title?: string;
    }) => api.post("/payments/initialize", data),
    verify: (reference: string, provider: string) =>
        api.get("/payments/verify", { params: { reference, provider } }),
};

// Documents (derived from invested assets)
export const documentsApi = {
    getMyDocuments: async () => {
        const investRes = await api.get("/investments/my");
        const investments: any[] = investRes.data || [];

        const assetIds = [...new Set(investments.map((i: any) => i.assetId || i.asset?.id).filter(Boolean))];
        const assetsRes = await Promise.all(assetIds.map((id) => api.get(`/assets/${id}`).catch(() => null)));

        const documents: any[] = [];
        assetsRes.forEach((res) => {
            const asset = res?.data;
            if (!asset?.documents?.length) return;
            asset.documents.forEach((doc: any) => {
                documents.push({
                    ...doc,
                    url: resolveMediaUrl(doc.url),
                    assetName: asset.name,
                    assetId: asset.id,
                });
            });
        });
        return { data: documents };
    },
};

// Saved properties — stored in localStorage (no backend route for this)
export const savedPropertiesLocal = {
    getIds: (): string[] => {
        try { return JSON.parse(localStorage.getItem("saved_property_ids") ?? "[]"); }
        catch { return []; }
    },
    saveId: (assetId: string): void => {
        const ids = savedPropertiesLocal.getIds();
        if (!ids.includes(assetId)) {
            localStorage.setItem("saved_property_ids", JSON.stringify([...ids, assetId]));
        }
    },
    removeId: (assetId: string): void => {
        const ids = savedPropertiesLocal.getIds().filter((id) => id !== assetId);
        localStorage.setItem("saved_property_ids", JSON.stringify(ids));
    },
    isSaved: (assetId: string): boolean => savedPropertiesLocal.getIds().includes(assetId),
};

// Investor / Investments
export const investorApi = {
    assets: {
        getAll: (filters?: object) => api.get("/assets", { params: filters }),
        getById: (id: string) => api.get(`/assets/${id}`),
        getStats: () => api.get("/assets/stats/overview"),
        // Saved is handled locally — helpers below delegate to savedPropertiesLocal
        getSavedIds: (): string[] => savedPropertiesLocal.getIds(),
        isSaved: (assetId: string): boolean => savedPropertiesLocal.isSaved(assetId),
        save: async (assetId: string) => { savedPropertiesLocal.saveId(assetId); return { data: { saved: true } }; },
        unsave: async (assetId: string) => { savedPropertiesLocal.removeId(assetId); return { data: { saved: false } }; },
        // Fetch full asset objects for saved ids
        getSaved: async () => {
            const ids = savedPropertiesLocal.getIds();
            if (!ids.length) return { data: [] };
            const results = await Promise.all(ids.map((id) => api.get(`/assets/${id}`).catch(() => null)));
            return { data: results.filter(Boolean).map((r) => r!.data) };
        },
    },
    investments: {
        // GET /investments/me — returns Transaction[] with asset, installments, installmentPlans included
        getMyInvestments: () => api.get("/investments/me"),
        // GET /investments/summary
        getSummary: () => api.get("/investments/summary"),
        // No /investments/:id endpoint — use getMyInvestments() and filter client-side
        getById: async (id: string) => {
            const res = await api.get("/investments/me");
            const investments: any[] = res.data || [];
            const found = investments.find((inv: any) => inv.id === id);
            return { data: found ?? null };
        },
        // Installments are nested inside the transaction — extract them
        getInstallments: async (transactionId: string) => {
            const res = await api.get("/investments/me");
            const investments: any[] = res.data || [];
            const inv = investments.find((i: any) => i.id === transactionId);
            // installments are directly on the transaction object
            return { data: inv?.installments ?? [] };
        },
    },
    payments: {
        initialize: paymentsApi.initialize,
        verify: paymentsApi.verify,
        getProviders: paymentsApi.getProviders,
    },
    profile: {
        get: () => api.get("/users/me"),
        update: (data: object) => api.put("/users/me", data),
    },
    notifications: {
        getAll: () => api.get("/notifications"),
        getUnreadCount: () => api.get("/notifications/unread"),
        // Backend uses PUT (not PATCH)
        markRead: (id: string) => api.put(`/notifications/${id}/read`),
        markAllRead: () => api.put("/notifications/read-all"),
    },
    documents: documentsApi,
};
