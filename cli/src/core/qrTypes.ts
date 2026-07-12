// Copied verbatim from components/qr-code/qrTypes.ts in the main app — these
// payload encoders are pure string-building with no browser dependency, so
// no porting is needed, just reuse.

export type QrTypeId =
  | "text" | "sms" | "wifi" | "vcard" | "event"
  | "link" | "email" | "phone" | "app" | "file" | "whatsapp" | "crypto" | "upi";

export interface QrTypeDef {
  id: QrTypeId;
  label: string;
  buildPayload: (v: Record<string, string>) => string;
}

const escapeSpecial = (s: string) => (s || "").replace(/([\\;,:])/g, "\\$1");

const buildQuery = (params: Record<string, string | undefined>) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}=${encodeURIComponent(v!.trim())}`);
  return parts.join("&");
};

const digitsOnly = (s: string) => (s || "").replace(/[^\d+]/g, "");

const toIcalDate = (s: string) => {
  const stripped = (s || "").replace(/[-:]/g, "").replace(/\.\d+Z?$/, "");
  if (!stripped) return "";
  return stripped.length === 13 ? `${stripped}00` : stripped;
};

const normalizeUrl = (s: string) => {
  const url = (s || "").trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};

export const qrTypes: QrTypeDef[] = [
  {
    id: "text",
    label: "Text",
    buildPayload: (v) => v.text || "",
  },
  {
    id: "sms",
    label: "SMS & Message",
    buildPayload: (v) => `SMSTO:${digitsOnly(v.phone)}:${v.message || ""}`,
  },
  {
    id: "wifi",
    label: "WiFi",
    buildPayload: (v) => {
      const enc = v.encryption || "WPA";
      const pass = enc === "nopass" ? "" : `P:${escapeSpecial(v.password || "")};`;
      return `WIFI:T:${enc};S:${escapeSpecial(v.ssid)};${pass}H:${v.hidden === "true" ? "true" : "false"};;`;
    },
  },
  {
    id: "vcard",
    label: "vCard",
    buildPayload: (v) => {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapeSpecial(v.name || "")}`,
        v.org ? `ORG:${escapeSpecial(v.org)}` : "",
        v.title ? `TITLE:${escapeSpecial(v.title)}` : "",
        v.phone ? `TEL:${digitsOnly(v.phone)}` : "",
        v.email ? `EMAIL:${v.email}` : "",
        v.website ? `URL:${v.website}` : "",
        v.address ? `ADR:;;${escapeSpecial(v.address)};;;;` : "",
        "END:VCARD",
      ];
      return lines.filter(Boolean).join("\n");
    },
  },
  {
    id: "event",
    label: "Event",
    buildPayload: (v) => {
      const start = toIcalDate(v.start || "");
      const end = toIcalDate(v.end || v.start || "");
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${escapeSpecial(v.title || "")}`,
        v.location ? `LOCATION:${escapeSpecial(v.location)}` : "",
        start ? `DTSTART:${start}` : "",
        end ? `DTEND:${end}` : "",
        v.description ? `DESCRIPTION:${escapeSpecial(v.description)}` : "",
        "END:VEVENT",
        "END:VCALENDAR",
      ];
      return lines.filter(Boolean).join("\n");
    },
  },
  {
    id: "link",
    label: "Link",
    buildPayload: (v) => normalizeUrl(v.url),
  },
  {
    id: "email",
    label: "Email",
    buildPayload: (v) => {
      const q = buildQuery({ subject: v.subject, body: v.body });
      return `mailto:${v.to || ""}${q ? `?${q}` : ""}`;
    },
  },
  {
    id: "phone",
    label: "Phone",
    buildPayload: (v) => `tel:${digitsOnly(v.phone)}`,
  },
  {
    id: "app",
    label: "Application",
    buildPayload: (v) => {
      const ios = (v.iosUrl || "").trim();
      const android = (v.androidUrl || "").trim();
      // The CLI has no hosted /app-link redirect page, so when both are
      // given we can't auto-detect a visitor's OS the way the browser tool
      // does — fall back to the iOS link with android as a secondary hint
      // isn't meaningful here either. Require the caller to pick one.
      return ios || android;
    },
  },
  {
    id: "file",
    label: "File",
    buildPayload: (v) => normalizeUrl(v.url),
  },
  {
    id: "whatsapp",
    label: "Whatsapp",
    buildPayload: (v) => {
      const phone = digitsOnly(v.phone).replace(/^\+/, "");
      const q = buildQuery({ text: v.message });
      return `https://wa.me/${phone}${q ? `?${q}` : ""}`;
    },
  },
  {
    id: "crypto",
    label: "Cryptocurrency",
    buildPayload: (v) => {
      const scheme = v.coin || "bitcoin";
      const q = buildQuery({ amount: v.amount, label: v.label });
      return `${scheme}:${v.address || ""}${q ? `?${q}` : ""}`;
    },
  },
  {
    id: "upi",
    label: "UPI Payment",
    buildPayload: (v) => {
      const q = buildQuery({ pa: v.vpa, pn: v.name, am: v.amount, tn: v.remarks, cu: "INR" });
      return `upi://pay?${q}`;
    },
  },
];

export const getQrType = (id: string): QrTypeDef => qrTypes.find((t) => t.id === id) || qrTypes[0];
