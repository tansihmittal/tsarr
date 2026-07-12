// QR data-type definitions: form fields + payload encoders for every supported
// QR type. Every type here encodes its payload directly into the QR (no
// backend/short-link redirect), so "Dynamic QR" below is a UI grouping that
// matches common QR-generator conventions, not an indication that these
// types are editable-after-print the way a real hosted redirect would be.

export type FieldType = "text" | "textarea" | "tel" | "email" | "url" | "number" | "select" | "checkbox" | "datetime";

export interface QrField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

export interface QrTypeDef {
  id: string;
  label: string;
  category: "static" | "dynamic";
  fields: QrField[];
  buildPayload: (v: Record<string, string>) => string;
  describe: (v: Record<string, string>) => string;
}

// ---------- escaping helpers ----------

// WIFI: / vCard / iCal all reserve the same special characters and require
// backslash-escaping them inside field values.
const escapeSpecial = (s: string) => (s || "").replace(/([\\;,:])/g, "\\$1");

const buildQuery = (params: Record<string, string | undefined>) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}=${encodeURIComponent(v!.trim())}`);
  return parts.join("&");
};

const digitsOnly = (s: string) => (s || "").replace(/[^\d+]/g, "");

// iCal wants YYYYMMDDTHHMMSS (local, no timezone conversion attempted here —
// datetime-local inputs already give us the pieces we need).
const toIcalDate = (s: string) => {
  const stripped = (s || "").replace(/[-:]/g, "").replace(/\.\d+Z?$/, "");
  if (!stripped) return "";
  // datetime-local has no seconds step, so its value strips down to
  // "YYYYMMDDTHHmm" (13 chars) — pad to the DATE-TIME form iCal requires.
  return stripped.length === 13 ? `${stripped}00` : stripped;
};

const normalizeUrl = (s: string) => {
  const url = (s || "").trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};

export const qrTypes: QrTypeDef[] = [
  // ─── Static ───────────────────────────────────────────────────────────
  {
    id: "text",
    label: "Text",
    category: "static",
    fields: [
      { key: "text", label: "Text", type: "textarea", placeholder: "Enter any text…", required: true },
    ],
    buildPayload: (v) => v.text || "",
    describe: () => "Plain text, shown as-is when scanned.",
  },
  {
    id: "sms",
    label: "SMS & Message",
    category: "static",
    fields: [
      { key: "phone", label: "Phone Number", type: "tel", placeholder: "+1 234 567 8900", required: true },
      { key: "message", label: "Message", type: "textarea", placeholder: "Pre-filled message text" },
    ],
    buildPayload: (v) => `SMSTO:${digitsOnly(v.phone)}:${v.message || ""}`,
    describe: () => "Opens the messaging app with a pre-filled text.",
  },
  {
    id: "wifi",
    label: "WiFi",
    category: "static",
    fields: [
      { key: "ssid", label: "Network Name (SSID)", type: "text", placeholder: "MyNetwork", required: true },
      { key: "password", label: "Password", type: "text", placeholder: "Leave blank for open networks" },
      {
        key: "encryption",
        label: "Encryption",
        type: "select",
        options: [
          { value: "WPA", label: "WPA/WPA2/WPA3" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "None (open)" },
        ],
        defaultValue: "WPA",
      },
      { key: "hidden", label: "Hidden network", type: "checkbox" },
    ],
    buildPayload: (v) => {
      const enc = v.encryption || "WPA";
      const pass = enc === "nopass" ? "" : `P:${escapeSpecial(v.password || "")};`;
      return `WIFI:T:${enc};S:${escapeSpecial(v.ssid)};${pass}H:${v.hidden === "true" ? "true" : "false"};;`;
    },
    describe: () => "Connects to WiFi instantly when scanned (no typing a password).",
  },
  {
    id: "vcard",
    label: "vCard",
    category: "static",
    fields: [
      { key: "name", label: "Full Name", type: "text", placeholder: "Jane Doe", required: true },
      { key: "org", label: "Organization", type: "text", placeholder: "Acme Inc." },
      { key: "title", label: "Job Title", type: "text", placeholder: "Product Designer" },
      { key: "phone", label: "Phone", type: "tel", placeholder: "+1 234 567 8900" },
      { key: "email", label: "Email", type: "email", placeholder: "jane@example.com" },
      { key: "website", label: "Website", type: "url", placeholder: "https://example.com" },
      { key: "address", label: "Address", type: "text", placeholder: "123 Main St, City" },
    ],
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
    describe: () => "Saves a contact card directly to the phone's address book.",
  },
  {
    id: "event",
    label: "Event",
    category: "static",
    fields: [
      { key: "title", label: "Event Title", type: "text", placeholder: "Team Offsite", required: true },
      { key: "location", label: "Location", type: "text", placeholder: "123 Main St" },
      { key: "start", label: "Starts", type: "datetime", required: true },
      { key: "end", label: "Ends", type: "datetime" },
      { key: "description", label: "Description", type: "textarea" },
    ],
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
    describe: () => "Adds an event straight to the phone's calendar.",
  },

  // ─── Dynamic (still encoded directly — no redirect backend) ────────────
  {
    id: "link",
    label: "Link",
    category: "dynamic",
    fields: [{ key: "url", label: "URL", type: "url", placeholder: "https://example.com", required: true }],
    buildPayload: (v) => normalizeUrl(v.url),
    describe: () => "Opens a website link.",
  },
  {
    id: "email",
    label: "Email",
    category: "dynamic",
    fields: [
      { key: "to", label: "To", type: "email", placeholder: "you@example.com", required: true },
      { key: "subject", label: "Subject", type: "text", placeholder: "Subject line" },
      { key: "body", label: "Message", type: "textarea", placeholder: "Email body" },
    ],
    buildPayload: (v) => {
      const q = buildQuery({ subject: v.subject, body: v.body });
      return `mailto:${v.to || ""}${q ? `?${q}` : ""}`;
    },
    describe: () => "Opens a pre-filled email draft.",
  },
  {
    id: "phone",
    label: "Phone",
    category: "dynamic",
    fields: [{ key: "phone", label: "Phone Number", type: "tel", placeholder: "+1 234 567 8900", required: true }],
    buildPayload: (v) => `tel:${digitsOnly(v.phone)}`,
    describe: () => "Starts a phone call.",
  },
  {
    id: "app",
    label: "Application",
    category: "dynamic",
    fields: [
      { key: "iosUrl", label: "App Store Link (iOS)", type: "url", placeholder: "https://apps.apple.com/…" },
      { key: "androidUrl", label: "Play Store Link (Android)", type: "url", placeholder: "https://play.google.com/store/apps/…" },
    ],
    buildPayload: (v) => {
      const ios = (v.iosUrl || "").trim();
      const android = (v.androidUrl || "").trim();
      if (!ios && !android) return "";
      // Only one link provided — nothing to branch on, encode it directly.
      if (ios && !android) return ios;
      if (android && !ios) return android;
      // Both provided — route through our own redirect page, which picks
      // the right store link from the visitor's device at scan time.
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const q = buildQuery({ ios, android });
      return `${origin}/app-link?${q}`;
    },
    describe: (v) =>
      v.iosUrl && v.androidUrl
        ? "Detects iOS vs Android when scanned and opens the matching store automatically."
        : "Sends visitors straight to your app's store listing. Add both links to auto-detect the visitor's OS.",
  },
  {
    id: "file",
    label: "File",
    category: "dynamic",
    fields: [
      { key: "url", label: "Hosted File URL", type: "url", placeholder: "https://example.com/file.pdf", required: true },
    ],
    buildPayload: (v) => normalizeUrl(v.url),
    describe: () => "Links to a file you've already hosted somewhere (this tool doesn't host files itself — paste a direct link).",
  },
  {
    id: "whatsapp",
    label: "Whatsapp",
    category: "dynamic",
    fields: [
      { key: "phone", label: "Phone Number (with country code)", type: "tel", placeholder: "12345678900", required: true },
      { key: "message", label: "Pre-filled Message", type: "textarea", placeholder: "Hi! I'd like to…" },
    ],
    buildPayload: (v) => {
      const phone = digitsOnly(v.phone).replace(/^\+/, "");
      const q = buildQuery({ text: v.message });
      return `https://wa.me/${phone}${q ? `?${q}` : ""}`;
    },
    describe: () => "Opens a WhatsApp chat with a pre-filled message.",
  },
  {
    id: "crypto",
    label: "Cryptocurrency",
    category: "dynamic",
    fields: [
      {
        key: "coin",
        label: "Currency",
        type: "select",
        options: [
          { value: "bitcoin", label: "Bitcoin (BTC)" },
          { value: "ethereum", label: "Ethereum (ETH)" },
          { value: "litecoin", label: "Litecoin (LTC)" },
        ],
        defaultValue: "bitcoin",
      },
      { key: "address", label: "Wallet Address", type: "text", placeholder: "bc1q…", required: true },
      { key: "amount", label: "Amount (optional)", type: "number", placeholder: "0.01" },
      { key: "label", label: "Label (optional)", type: "text", placeholder: "Invoice #123" },
    ],
    buildPayload: (v) => {
      const scheme = v.coin || "bitcoin";
      const q = buildQuery({ amount: v.amount, label: v.label });
      return `${scheme}:${v.address || ""}${q ? `?${q}` : ""}`;
    },
    describe: () => "Opens the visitor's crypto wallet with the address (and amount) pre-filled.",
  },
  {
    id: "upi",
    label: "UPI Payment",
    category: "dynamic",
    fields: [
      { key: "name", label: "Your Name (Payee)", type: "text", placeholder: "e.g. Acme Fresh Produce", required: true },
      { key: "vpa", label: "Your UPI ID (VPA)", type: "text", placeholder: "yourname@oksbi", required: true },
      { key: "amount", label: "Amount (Optional)", type: "number", placeholder: "100" },
      { key: "remarks", label: "Remarks (Optional)", type: "text", placeholder: "For Invoice #123" },
    ],
    buildPayload: (v) => {
      const q = buildQuery({
        pa: v.vpa,
        pn: v.name,
        am: v.amount,
        tn: v.remarks,
        cu: "INR",
      });
      return `upi://pay?${q}`;
    },
    describe: () => "Real-time UPI payment QR — scan and pay with any UPI app (GPay, PhonePe, Paytm, etc).",
  },
];

export const getQrType = (id: string): QrTypeDef => qrTypes.find((t) => t.id === id) || qrTypes[0];
