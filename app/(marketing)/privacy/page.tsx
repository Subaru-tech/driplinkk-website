import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/marketing/legal-placeholder";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <LegalPlaceholder
      title="Privacy Policy"
      document="Privacy Policy"
      sections={[
        "What we collect",
        "How we use it",
        "Model files and storage",
        "Payment data and Razorpay",
        "Third-party processors",
        "Data retention and deletion",
        "Your rights",
        "Contact",
      ]}
    />
  );
}
