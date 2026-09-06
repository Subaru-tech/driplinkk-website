import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your DripLink account.",
};

export const dynamic = "force-dynamic";

const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignupPage() {
  if (!isClerkEnabled) {
    return <SignupForm />;
  }

  return (
    <div className="w-full flex justify-center">
      <SignUp
        path="/signup"
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
