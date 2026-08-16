import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/marketing/legal-placeholder";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <LegalPlaceholder
      title="Terms of Service"
      document="Terms of Service"
      sections={[
        "Acceptance of terms",
        "Accounts and eligibility",
        "Credits, purchases and refunds",
        "Ownership of models you create",
        "Mart orders, fulfilment and returns",
        "Acceptable use",
        "Liability and warranty",
        "Changes to these terms",
      ]}
    />
  );
}
