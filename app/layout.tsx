import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "Khiên Số | HDBank - IT Security",
    description: "Chương trình mô phỏng tương tác của HDBank - IT Security, giúp nhận diện và xử lý các kịch bản lừa đảo trực tuyến phổ biến.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Khiên Số | HDBank - IT Security",
      description: "Học để không thành con mồi — thử sức với các tình huống lừa đảo và xây dựng phản xạ phòng vệ số.",
      type: "website",
      locale: "vi_VN",
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "Khiên Số — học để không thành con mồi" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Khiên Số | HDBank - IT Security",
      description: "Học để không thành con mồi — chương trình mô phỏng giúp xây dựng phản xạ phòng vệ số.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
