import { Plus_Jakarta_Sans } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { AssessmentSync } from "@/components/assessment/assessment-sync";
import PwaRegister from "@/components/pwa-register";
import "./globals.css";

import { Suspense } from "react";
import NavbarGate from "@/components/layout/navbar-gate";

import { ToastProvider } from "@/context/toast-context";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Laras Karya",
  description:
    "Platform karier sektor hijau untuk perempuan Indonesia. Wujudkan karier bermakna di sektor hijau melalui asesmen singkat, rekomendasi lowongan, dan pelatihan.",
  applicationName: "Laras Karya",
  appleWebApp: {
    capable: true,
    title: "Laras Karya",
    statusBarStyle: "default",
  },
  icons: { icon: "/favicon.ico", apple: "/icons/icon-192.png" },
};

export const viewport = {
  themeColor: "#055c45",
  width: "device-width",
  initialScale: 1,
};
 

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <Suspense fallback={null}>
            <NavbarGate>
              <Navbar />
            </NavbarGate>
          </Suspense>
          {children}
          <Suspense fallback={null}>
            <AssessmentSync />
          </Suspense>
          <PwaRegister />
        </ToastProvider>
      </body>
    </html>
  );
}
