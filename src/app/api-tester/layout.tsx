import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "API Tester — HTTP Client Online";
const description =
  "Send GET, POST, PUT, PATCH, DELETE requests with headers, auth, and body. View formatted responses and export code snippets — uses a safe proxy.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["API tester", "HTTP client online", "REST client", "test API", "curl online", "Postman alternative"],
  alternates: { canonical: `${SITE_URL}/api-tester` },
  ...socialMetadata({ title, description, canonicalPath: "/api-tester" }),
};

export default function ApiTesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
