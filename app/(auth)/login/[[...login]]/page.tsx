import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your DripLink account.",
};

export const dynamic = "force-dynamic";

const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function LoginPage() {
  if (!isClerkEnabled) {
    return <LoginForm />;
  }

  return (
    <div className="w-full flex justify-center">
      <SignIn
        path="/login"
        signUpUrl="/signup"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
