import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumb-schema";

const title = "AWS Lambda Sandbox — Test Handlers in Your Browser";
const description =
  "Run Node.js Lambda handlers against API Gateway, SQS, S3, EventBridge, and other event payloads. Sandboxed in a Web Worker — no AWS credentials, no network, fully client-side.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "AWS Lambda sandbox",
    "test Lambda function",
    "Lambda local testing",
    "Lambda event payload",
    "API Gateway event sample",
    "SQS event sample",
    "Lambda handler runner",
  ],
  alternates: { canonical: `${SITE_URL}/lambda-sandbox` },
  ...socialMetadata({ title, description, canonicalPath: "/lambda-sandbox" }),
};

export default function LambdaSandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([{ name: "Lambda Sandbox", path: "/lambda-sandbox" }])}
      />
      {children}
    </>
  );
}
