import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeScript } from "@/components/theme-script";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

/* Spec §1.2 — Space Grotesk for headings, Inter for body,
   JetBrains Mono for credit numbers, order IDs, filenames and timestamps. */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "DripLink — design it, refine it, print it",
    template: "%s · DripLink",
  },
  description:
    "DripLink builds LeaFF OS, Mart and the DripLink app — one pipeline from idea to printed part, without bouncing between two tools.",
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const page = (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-fg">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );

  if (clerkPublishableKey) {
    return <ClerkProvider publishableKey={clerkPublishableKey}>{page}</ClerkProvider>;
  }

  return page;
}

