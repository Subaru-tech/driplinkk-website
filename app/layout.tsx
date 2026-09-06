import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
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

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#527953",
    colorBackground: "#121913",
    colorInputBackground: "#1a231b",
    colorInputText: "#e5ece5",
    colorText: "#e5ece5",
    colorTextSecondary: "#8a9a8b",
    fontFamily: "var(--font-inter)",
    fontFamilyButtons: "var(--font-space-grotesk)",
    borderRadius: "0.5rem",
  },
  elements: {
    card: "border border-line bg-surface shadow-2xl rounded-[var(--radius-card)]",
    cardBox: "shadow-none",
    headerTitle: "font-display text-xl font-semibold text-fg tracking-tight",
    headerSubtitle: "text-muted text-sm",
    socialButtonsBlockButton:
      "border border-line-control bg-transparent text-fg hover:bg-raised transition-colors duration-150 rounded-[var(--radius-control)] h-11 text-sm font-medium",
    socialButtonsBlockButtonText: "font-medium text-fg",
    formButtonPrimary:
      "bg-accent text-accent-contrast hover:bg-accent-hover font-medium rounded-[var(--radius-control)] h-11 text-sm transition-colors duration-150 shadow-none active:brightness-95",
    footerActionLink: "text-accent hover:text-accent-hover font-medium transition-colors",
    formFieldInput:
      "rounded-[var(--radius-control)] border border-line-control bg-raised px-3 text-sm text-fg placeholder:text-muted transition-colors duration-150 focus:border-accent focus:ring-2 focus:ring-accent/35 h-10",
    formFieldLabel: "text-sm font-medium text-fg",
    dividerLine: "border-line",
    dividerText: "text-xs font-medium uppercase tracking-wider text-muted",
    footer: "bg-transparent border-t border-line",
    identityPreview: "border border-line bg-raised rounded-[var(--radius-control)]",
    identityPreviewText: "text-fg",
    identityPreviewEditButton: "text-accent hover:text-accent-hover",
    userButtonPopoverCard: "border border-line bg-surface shadow-2xl rounded-[var(--radius-card)]",
    userPreviewMainIdentifier: "text-fg font-medium",
    userPreviewSecondaryIdentifier: "text-muted",
    userButtonPopoverActionButton: "hover:bg-raised text-fg transition-colors",
    userButtonPopoverActionButtonIcon: "text-muted",
    userButtonPopoverFooter: "hidden",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const content = <ToastProvider>{children}</ToastProvider>;

  return (
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
        {clerkPublishableKey ? (
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            appearance={clerkAppearance}
            signInUrl="/login"
            signUpUrl="/signup"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
          >
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}

