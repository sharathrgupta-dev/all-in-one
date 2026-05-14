import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumb-schema";

const title = "Webhook Payload Simulator — GitHub, Stripe, Slack, Shopify";
const description =
  "Generate, send, and verify signed webhook payloads — GitHub, Stripe, Slack, Shopify, or a generic HMAC. Signing runs locally; your secret never leaves the browser.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "webhook simulator",
    "test webhook",
    "GitHub webhook signature",
    "Stripe webhook signing secret",
    "Slack X-Slack-Signature",
    "Shopify HMAC SHA256",
    "verify webhook signature",
    "HMAC generator",
  ],
  alternates: { canonical: `${SITE_URL}/webhook-simulator` },
  ...socialMetadata({ title, description, canonicalPath: "/webhook-simulator" }),
};

export default function WebhookSimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([{ name: "Webhook Simulator", path: "/webhook-simulator" }])}
      />
      {children}
    </>
  );
}
