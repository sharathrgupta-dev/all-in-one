import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Tester — HTTP Client Online | DevForge",
  description:
    "Send GET, POST, PUT, PATCH, DELETE requests with headers, auth, and body. View formatted responses and export code snippets — uses a safe proxy.",
  keywords: ["API tester", "HTTP client online", "REST client", "test API"],
};

export default function ApiTesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
