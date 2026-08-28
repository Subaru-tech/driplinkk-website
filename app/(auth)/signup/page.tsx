import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { parseRole } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your DripLink account.",
};

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { role } = await searchParams;
  return <SignupForm initialRole={parseRole(role)} />;
}
