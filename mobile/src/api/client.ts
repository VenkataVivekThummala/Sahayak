/**
 * Typed API Client for Government Sahayak Backend.
 */
export interface ApiConfig {
  baseUrl: string;
}

let currentConfig: ApiConfig = {
  baseUrl: typeof window !== "undefined" && window.location?.hostname ? "" : "http://10.0.2.2:8000",
};

export function setApiBaseUrl(url: string) {
  currentConfig.baseUrl = url.replace(/\/$/, "");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${currentConfig.baseUrl}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (response.status === 304) {
    return { notModified: true } as unknown as T;
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // keep fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  getHealth: () => apiRequest<{ status: string; schemes: number; dataset_version: string }>("/api/health"),

  getSchemes: (lang: "en" | "te" = "en", category?: string) => {
    const q = new URLSearchParams({ lang });
    if (category) q.append("category", category);
    return apiRequest<{ count: number; schemes: any[] }>(`/api/schemes?${q.toString()}`);
  },

  getSchemeDetail: (id: string, lang: "en" | "te" = "en") =>
    apiRequest<any>(`/api/schemes/${id}?lang=${lang}`),

  getDocuments: (id: string, lang: "en" | "te" = "en") =>
    apiRequest<{ documents: Array<{ name: string; required: boolean | null }> }>(
      `/api/schemes/${id}/documents?lang=${lang}`
    ),

  getSteps: (id: string, lang: "en" | "te" = "en") =>
    apiRequest<{ steps: Array<{ step: number; text: string }> }>(
      `/api/schemes/${id}/application-steps?lang=${lang}`
    ),

  getSources: (id: string, lang: "en" | "te" = "en") =>
    apiRequest<any>(`/api/sources/${id}?lang=${lang}`),

  getQuestions: (id: string, lang: "en" | "te" = "en") =>
    apiRequest<{ questions: Array<{ field: string; type: "bool" | "number"; text: string }> }>(
      `/api/eligibility/${id}/questions?lang=${lang}`
    ),

  checkEligibility: (schemeId: string, facts: Record<string, any>, lang: "en" | "te" = "en") =>
    apiRequest<any>("/api/eligibility/check", {
      method: "POST",
      body: JSON.stringify({ scheme_id: schemeId, facts, language: lang }),
    }),

  sendChat: (
    arg1: string | { message: string; language?: "en" | "te"; session?: any; scheme_id?: string },
    lang?: "en" | "te",
    session?: any,
    schemeId?: string
  ) => {
    let message = "";
    let language = lang;
    let sess = session;
    let sId = schemeId;

    if (typeof arg1 === "object" && arg1 !== null) {
      message = arg1.message;
      language = arg1.language || language;
      sess = arg1.session !== undefined ? arg1.session : sess;
      sId = arg1.scheme_id || sId;
    } else {
      message = arg1;
    }

    return apiRequest<any>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, language, session: sess, scheme_id: sId }),
    });
  },

  getServiceCenters: (lat: number, lng: number, schemeId?: string, radiusM: number = 10000) => {
    const q = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius_m: radiusM.toString(),
    });
    if (schemeId) q.append("scheme_id", schemeId);
    return apiRequest<any>(`/api/service-centers?${q.toString()}`);
  },

  submitHelpRequest: (data: {
    scheme_id?: string;
    question: string;
    language: string;
    contact_phone?: string;
    consent: boolean;
  }) =>
    apiRequest<{ request_id: string; status: string; status_token: string }>("/api/help-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getHelpRequestStatus: (requestId: string, token: string) =>
    apiRequest<any>(`/api/help-requests/${requestId}?token=${token}`),

  getMetaVersion: () =>
    apiRequest<{ dataset_version: string; updated_at: string }>("/api/meta/version"),

  exportDataset: (etag?: string) =>
    apiRequest<any>("/api/export", {
      headers: etag ? { "If-None-Match": etag } : {},
    }),
};

export const apiClient = api;
