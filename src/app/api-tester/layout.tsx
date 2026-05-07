import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Tester — HTTP Client Online | DevBench",
  description:
    "Send GET, POST, PUT, PATCH, DELETE requests with headers, auth, and body. View formatted responses and export code snippets — uses a safe proxy.",
  keywords: ["API tester", "HTTP client online", "REST client", "test API", "curl online", "Postman alternative"],
  alternates: { canonical: "https://devbench.co.in/api-tester" },
};

export default function ApiTesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
