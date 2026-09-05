import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export const dynamic = "force-dynamic";

const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  if (!isClerkEnabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas text-fg">
        <p className="text-muted">Authentication provider is not configured.</p>
        <Link href="/login" className="mt-4 text-sm text-primary underline">
          Go to standard login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
