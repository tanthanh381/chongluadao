import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tanthanh381.github.io/chongluadao/"),
  title: "Khiên Số | Trò chơi cộng đồng nhận diện lừa đảo",
  description: "Dự án cộng đồng độc lập giúp luyện phản xạ nhận diện và xử lý các tình huống lừa đảo trực tuyến.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Khiên Số | Trò chơi cộng đồng nhận diện lừa đảo",
    description: "Chơi ẩn danh, học qua tình huống mô phỏng và xây dựng phản xạ phòng vệ số.",
    type: "website",
    locale: "vi_VN",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Khiên Số — Dự án cộng đồng độc lập" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Khiên Số | Trò chơi cộng đồng nhận diện lừa đảo",
    description: "Chơi ẩn danh và luyện phản xạ phòng vệ số qua các tình huống mô phỏng.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
