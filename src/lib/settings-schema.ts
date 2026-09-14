import {
  BarChart3,
  Banknote,
  Bell,
  BellRing,
  Bot,
  Building2,
  Cookie,
  CreditCard,
  FileText,
  Globe,
  Image as ImageIcon,
  Languages,
  KeyRound,
  LogIn,
  Mail,
  
  MessageSquare,
  Palette,
  Percent,
  Share2,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";

import type { ProviderDef } from "@/components/admin/ProviderTabs";

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "switch"
  | "image"
  | "color"
  | "zones"
  | "alerts"
  | "analytics"
  | "sliders"
  | "providers"
  | "pages";

export type Field = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  providers?: ProviderDef[];
  full?: boolean;
};

export type Section = {
  key: string;
  label: string;
  group: string;
  icon: typeof Building2;
  description: string;
  fields: Field[];
};

const STATUS = [
  { value: "enable", label: "Enable" },
  { value: "disable", label: "Disable" },
];

const MODE = [
  { value: "sandbox", label: "Sandbox" },
  { value: "live", label: "Live" },
];

const yesNo = (name: string, label: string, full = false): Field => ({
  name,
  label,
  type: "switch",
  full,
});


export const SECTIONS: Section[] = [
  {
    key: "company",
    label: "Company",
    group: "General",
    icon: Building2,
    description: "Business identity shown on invoices, receipts and contact pages.",
    fields: [
      { name: "name", label: "Name", required: true, placeholder: "Faiza Zone" },
      { name: "latitude", label: "Latitude", placeholder: "22.6859" },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "longitude", label: "Longitude", placeholder: "90.6482" },
      { name: "phone", label: "Phone", required: true, placeholder: "+880 1798-113899" },
      { name: "website", label: "Website", placeholder: "https://faizazone.com" },
      { name: "city", label: "City", required: true },
      { name: "state", label: "State", required: true },
      { name: "country_code", label: "Country code", required: true, placeholder: "BD" },
      { name: "zip_code", label: "Zip code", required: true },
      { name: "address", label: "Address", type: "textarea", required: true, full: true },
    ],
  },
  {
    key: "site",
    label: "Site",
    group: "General",
    icon: Globe,
    description: "Storefront branding, currency and language defaults.",
    fields: [
      { name: "site_title", label: "Site title", required: true },
      { name: "tagline", label: "Tagline" },
      { name: "default_currency", label: "Default currency", placeholder: "BDT" },
      { name: "currency_symbol", label: "Currency symbol", placeholder: "৳" },
      {
        name: "default_language",
        label: "Default language",
        type: "select",
        options: [
          { value: "en", label: "English" },
          { value: "bn", label: "Bangla" },
        ],
      },
      { name: "timezone", label: "Timezone", placeholder: "Asia/Dhaka" },
      { name: "logo_url", label: "Logo", type: "image" },
      { name: "favicon_url", label: "Favicon", type: "image" },
      yesNo("maintenance_mode", "Maintenance mode", true),
    ],
  },
  {
    key: "mail",
    label: "Mail",
    group: "General",
    icon: Mail,
    description: "Outgoing email identity and SMTP delivery settings.",
    fields: [
      { name: "from_name", label: "From name" },
      { name: "from_email", label: "From email", type: "email" },
      { name: "smtp_host", label: "SMTP host" },
      { name: "smtp_port", label: "SMTP port" },
      { name: "smtp_user", label: "SMTP username" },
      {
        name: "encryption",
        label: "Encryption",
        type: "select",
        options: [
          { value: "tls", label: "TLS" },
          { value: "ssl", label: "SSL" },
          { value: "none", label: "None" },
        ],
      },
    ],
  },
  {
    key: "shipping",
    label: "Shipping Setup",
    group: "Commerce",
    icon: Truck,
    description: "Delivery charges applied at checkout.",
    fields: [
      { name: "inside_dhaka", label: "Inside Dhaka (৳)", type: "number" },
      { name: "outside_dhaka", label: "Outside Dhaka (৳)", type: "number" },
      { name: "flat_rate", label: "Flat rate (৳)", type: "number" },
      { name: "free_shipping_threshold", label: "Free shipping over (৳)", type: "number" },
      { name: "delivery_note", label: "Delivery note", type: "textarea", full: true },
    ],
  },
  {
    key: "shipping_intl",
    label: "International Shipping",
    group: "Commerce",
    icon: Globe,
    description:
      "Add any number of countries with their own currency, tax, shipping rates and delivery estimates.",
    fields: [{ name: "zones", label: "Shipping countries", type: "zones", full: true }],
  },
  {
    key: "otp",
    label: "OTP",
    group: "General",
    icon: KeyRound,
    description: "One-time password rules for login and order verification.",
    fields: [
      { name: "otp_type", label: "OTP type", type: "select", required: true, options: [
        { value: "sms", label: "SMS" },
        { value: "email", label: "EMAIL" },
        { value: "both", label: "BOTH" },
      ] },
      { name: "otp_length", label: "OTP digit limit", type: "select", required: true, options: [
        { value: "4", label: "4" },
        { value: "5", label: "5" },
        { value: "6", label: "6" },
      ] },
      { name: "otp_expiry_minutes", label: "OTP expire time", type: "select", required: true, options: [
        { value: "5", label: "5 Minutes" },
        { value: "10", label: "10 Minutes" },
        { value: "15", label: "15 Minutes" },
        { value: "30", label: "30 Minutes" },
      ] },
      yesNo("enable_otp", "Enable OTP verification", true),
    ],
  },
  {
    key: "notification",
    label: "Notification",
    group: "Communications",
    icon: Bell,
    description: "Firebase credentials used for web push notifications.",
    fields: [
      { name: "firebase_vapid_key", label: "Firebase public vapid key (key pair)", required: true },
      { name: "firebase_api_key", label: "Firebase API key", required: true },
      { name: "firebase_auth_domain", label: "Firebase auth domain", required: true },
      { name: "firebase_project_id", label: "Firebase project ID", required: true },
      { name: "firebase_storage_bucket", label: "Firebase storage bucket", required: true },
      { name: "firebase_sender_id", label: "Firebase message sender ID", required: true },
      { name: "firebase_app_id", label: "Firebase app ID", required: true },
      { name: "firebase_measurement_id", label: "Firebase measurement ID", required: true },
      { name: "firebase_service_json", label: "Service account file (JSON)", type: "textarea", full: true },
    ],
  },
  {
    key: "notification_alert",
    label: "Notification Alert",
    group: "Communications",
    icon: BellRing,
    description: "Mail, SMS and push messages sent on each order status.",
    fields: [{ name: "alerts", label: "Notification messages", type: "alerts", full: true }],
  },
  {
    key: "social",
    label: "Social Media",
    group: "Communications",
    icon: Share2,
    description: "Links used in the storefront footer and share buttons.",
    fields: [
      { name: "facebook", label: "Facebook", placeholder: "https://facebook.com/faizazone" },
      { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/@faizazone" },
      { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/faizazone" },
      { name: "twitter", label: "Twitter", placeholder: "https://twitter.com/faizazone" },
      { name: "tiktok", label: "TikTok" },
      { name: "whatsapp", label: "WhatsApp number", placeholder: "+8801798113899" },
    ],
  },
  {
    key: "cookies",
    label: "Cookies",
    group: "Communications",
    icon: Cookie,
    description: "Cookie consent banner shown to storefront visitors.",
    fields: [
      { name: "policy_url", label: "Cookies details page", required: true, placeholder: "/return-policy" },
      { name: "accept_label", label: "Accept button label", placeholder: "Accept" },
      {
        name: "cookie_text",
        label: "Cookies summary",
        type: "textarea",
        required: true,
        full: true,
        placeholder:
          "This website uses cookies to better understand how visitors use our site, for advertising, and to offer you a more personalized experience.",
      },
      yesNo("enable_cookie_banner", "Show cookie consent banner", true),
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    group: "Communications",
    icon: BarChart3,
    description: "Tracking scripts for marketing and measurement tools.",
    fields: [{ name: "items", label: "Analytics", type: "analytics", full: true }],
  },
  {
    key: "theme",
    label: "Theme",
    group: "Appearance",
    icon: Palette,
    description: "Logos, favicon and storefront colors.",
    fields: [
      { name: "logo_url", label: "Logo (128px, 43px)", type: "image" },
      { name: "favicon_url", label: "Fav icon (120px, 120px)", type: "image" },
      { name: "footer_logo_url", label: "Footer logo (144px, 48px)", type: "image" },
      { name: "primary_color", label: "Primary color", type: "color" },
      { name: "secondary_color", label: "Secondary color", type: "color" },
      { name: "heading_font", label: "Heading font", placeholder: "Poppins" },
      { name: "body_font", label: "Body font", placeholder: "Inter" },
      yesNo("sticky_header", "Sticky header", true),
    ],
  },
  {
    key: "sliders",
    label: "Sliders",
    group: "Appearance",
    icon: ImageIcon,
    description: "Homepage hero slides and slider behaviour.",
    fields: [
      { name: "items", label: "Sliders", type: "sliders", full: true },
      yesNo("autoplay", "Autoplay slides"),
      { name: "interval_ms", label: "Slide interval (ms)", type: "number", placeholder: "5000" },
      yesNo("show_arrows", "Show arrows"),
      yesNo("show_dots", "Show dots"),
    ],
  },

  {
    key: "currencies",
    label: "Currencies",
    group: "Commerce",
    icon: Banknote,
    description: "Currency display and conversion defaults.",
    fields: [
      { name: "base_currency", label: "Base currency", placeholder: "BDT" },
      { name: "symbol_position", label: "Symbol position", type: "select", options: [
        { value: "before", label: "Before amount" },
        { value: "after", label: "After amount" },
      ] },
      { name: "decimal_places", label: "Decimal places", type: "number" },
      { name: "thousand_separator", label: "Thousand separator", placeholder: "," },
      { name: "usd_rate", label: "1 USD = (BDT)", type: "number" },
      { name: "gbp_rate", label: "1 GBP = (BDT)", type: "number" },
    ],
  },
  {
    key: "outlets",
    label: "Outlets",
    group: "Commerce",
    icon: Store,
    description: "Physical outlets used for POS and pickup.",
    fields: [
      { name: "default_outlet", label: "Default outlet name" },
      { name: "outlet_phone", label: "Outlet phone" },
      { name: "outlet_address", label: "Outlet address", type: "textarea", full: true },
      { name: "opening_hours", label: "Opening hours", placeholder: "10:00 AM - 9:00 PM" },
      yesNo("enable_pickup", "Enable store pickup"),
    ],
  },
  {
    key: "taxes",
    label: "Taxes",
    group: "Commerce",
    icon: Percent,
    description: "Tax and VAT rules applied to orders.",
    fields: [
      yesNo("enable_tax", "Enable tax"),
      { name: "tax_label", label: "Tax label", placeholder: "VAT" },
      { name: "tax_rate", label: "Tax rate (%)", type: "number" },
      { name: "tax_mode", label: "Tax mode", type: "select", options: [
        { value: "exclusive", label: "Added at checkout" },
        { value: "inclusive", label: "Included in price" },
      ] },
      { name: "tax_number", label: "Tax / BIN number" },
    ],
  },
  {
    key: "pages",
    label: "Pages",
    group: "Content",
    icon: FileText,
    description: "Create and manage static pages shown in the storefront menus.",
    fields: [{ name: "items", label: "Pages", type: "pages", full: true }],
  },
  {
    key: "languages",
    label: "Languages",
    group: "Content",
    icon: Languages,
    description: "Languages available to storefront visitors.",
    fields: [
      { name: "default_language", label: "Default language", type: "select", options: [
        { value: "en", label: "English" },
        { value: "bn", label: "Bangla" },
      ] },
      yesNo("enable_english", "Enable English"),
      yesNo("enable_bangla", "Enable Bangla"),
      yesNo("show_switcher", "Show language switcher", true),
    ],
  },
  {
    key: "ai_agent",
    label: "AI Agent",
    group: "Integrations",
    icon: Bot,
    description: "AI shopping assistant behaviour.",
    fields: [
      yesNo("enable_agent", "Enable AI assistant"),
      { name: "agent_name", label: "Assistant name", placeholder: "Faiza Helper" },
      { name: "model", label: "Model", type: "select", options: [
        { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
        { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
        { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
      ] },
      { name: "welcome_message", label: "Welcome message", type: "textarea", full: true },
      { name: "system_prompt", label: "System prompt", type: "textarea", full: true },
    ],
  },
  {
    key: "sms_gateway",
    label: "SMS Gateway",
    group: "Integrations",
    icon: MessageSquare,
    description: "SMS providers used for OTP and order updates.",
    fields: [
      {
        name: "providers",
        label: "SMS providers",
        type: "providers",
        full: true,
        providers: [
          {
            key: "smsnetbd",
            label: "SMS.net.bd",
            fields: [
              { name: "api_key", label: "SMS.net.bd API key", type: "password" },
              { name: "status", label: "SMS.net.bd status", type: "select", options: STATUS },
            ],
          },
          {
            key: "twilio",
            label: "Twilio",
            fields: [
              { name: "account_sid", label: "Twilio account SID" },
              { name: "auth_token", label: "Twilio auth token", type: "password" },
              { name: "from_number", label: "Twilio from number", placeholder: "+15017122661" },
              { name: "status", label: "Twilio status", type: "select", options: STATUS },
            ],
          },
          {
            key: "clickatell",
            label: "Clickatell",
            fields: [
              { name: "api_key", label: "Clickatell API key", type: "password" },
              { name: "sender_id", label: "Clickatell sender ID" },
              { name: "status", label: "Clickatell status", type: "select", options: STATUS },
            ],
          },
          {
            key: "nexmo",
            label: "Nexmo",
            fields: [
              { name: "api_key", label: "Nexmo API key", type: "password" },
              { name: "api_secret", label: "Nexmo API secret", type: "password" },
              { name: "sender_id", label: "Nexmo sender ID" },
              { name: "status", label: "Nexmo status", type: "select", options: STATUS },
            ],
          },
          {
            key: "bulksmsbd",
            label: "BulkSMSBD",
            fields: [
              { name: "api_key", label: "BulkSMSBD API key", type: "password" },
              { name: "sender_id", label: "BulkSMSBD sender ID" },
              { name: "status", label: "BulkSMSBD status", type: "select", options: STATUS },
            ],
          },
          {
            key: "mimsms",
            label: "MimSMS",
            fields: [
              { name: "api_key", label: "MimSMS API key", type: "password" },
              { name: "username", label: "MimSMS username" },
              { name: "sender_id", label: "MimSMS sender ID" },
              { name: "status", label: "MimSMS status", type: "select", options: STATUS },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "payment_gateway",
    label: "Payment Gateway",
    group: "Integrations",
    icon: CreditCard,
    description: "Payment methods offered at checkout.",
    fields: [
      {
        name: "providers",
        label: "Payment providers",
        type: "providers",
        full: true,
        providers: [
          {
            key: "paypal",
            label: "Paypal",
            fields: [
              { name: "app_id", label: "Paypal app ID" },
              { name: "client_id", label: "Paypal client ID" },
              { name: "client_secret", label: "Paypal client secret", type: "password" },
              { name: "mode", label: "Paypal mode", type: "select", options: MODE },
              { name: "status", label: "Paypal status", type: "select", options: STATUS },
            ],
          },
          {
            key: "stripe",
            label: "Stripe",
            fields: [
              { name: "publishable_key", label: "Stripe publishable key" },
              { name: "secret_key", label: "Stripe secret key", type: "password" },
              { name: "webhook_secret", label: "Stripe webhook secret", type: "password" },
              { name: "mode", label: "Stripe mode", type: "select", options: MODE },
              { name: "status", label: "Stripe status", type: "select", options: STATUS },
            ],
          },
          { key: "eps", label: "EPS", fields: [] },
          {
            key: "global_remittance",
            label: "Global Remittance",
            fields: [
              { name: "merchant_id", label: "Merchant ID" },
              { name: "api_key", label: "API key", type: "password" },
              { name: "api_url", label: "API URL", full: true },
              { name: "status", label: "Status", type: "select", options: STATUS },
            ],
          },
        ],
      },
      yesNo("cod", "Cash on delivery"),
      yesNo("bkash", "bKash"),
      yesNo("nagad", "Nagad"),
      yesNo("rocket", "Rocket"),
      { name: "bkash_number", label: "bKash number" },
      { name: "nagad_number", label: "Nagad number" },
    ],
  },

  {
    key: "social_login",
    label: "Social Login",
    group: "Integrations",
    icon: LogIn,
    description: "Third-party sign-in providers for customers.",
    fields: [
      yesNo("google", "Google sign-in"),
      yesNo("facebook", "Facebook sign-in"),
      yesNo("apple", "Apple sign-in"),
      yesNo("email_password", "Email & password"),
      { name: "redirect_url", label: "Redirect URL", full: true, placeholder: "https://faizazone.com" },
    ],
  },
  {
    key: "license",
    label: "License",
    group: "System",
    icon: ShieldCheck,
    description: "Product license and support information.",
    fields: [
      { name: "license_key", label: "License key", full: true },
      { name: "licensed_to", label: "Licensed to" },
      { name: "purchase_code", label: "Purchase code" },
      { name: "expires_at", label: "Expires on", placeholder: "2027-01-01" },
      { name: "support_email", label: "Support email", type: "email" },
    ],
  },
];

export const SECTION_GROUPS = [
  "General",
  "Commerce",
  "Catalog",
  "Communications",
  "Appearance",
  "Content",
  "Integrations",
  "System",
] as const;
