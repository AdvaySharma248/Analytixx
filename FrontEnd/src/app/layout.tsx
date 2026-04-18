import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import FirebaseAnalytics from "@/components/firebase/FirebaseAnalytics";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const satoshi = localFont({
  src: [
    {
      path: "./fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Analytixx — AI-Powered Data Analytics Dashboard",
  description: "Upload CSV data and get instant visualizations and insights from our AI assistant.",
  keywords: ["Analytixx", "analytics", "AI dashboard", "data visualization", "CSV analysis"],
  authors: [{ name: "Analytixx" }],
  icons: {
    icon: "/favicon.svg?v=2",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dataai.app",
    title: "Analytixx — AI-Powered Data Analytics",
    description: "Upload CSV files and get instant AI-powered insights",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} ${satoshi.variable}`}
    >
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-background text-foreground"
      >
        <Script id="strip-extension-attrs" strategy="beforeInteractive">
          {`
            (() => {
              const strip = (root) => {
                if (!root || typeof root.querySelectorAll !== 'function') return;
                root.querySelectorAll('[bis_skin_checked]').forEach((node) => {
                  node.removeAttribute('bis_skin_checked');
                });
              };

              strip(document);

              const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                  if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                    mutation.target.removeAttribute('bis_skin_checked');
                  }

                  mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    if (node.hasAttribute('bis_skin_checked')) {
                      node.removeAttribute('bis_skin_checked');
                    }
                    strip(node);
                  });
                }
              });

              observer.observe(document.documentElement, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['bis_skin_checked'],
              });
            })();
          `}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="dataai-theme"
        >
          <FirebaseAnalytics />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
