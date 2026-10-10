import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { AUTH_ENABLED } from "@/lib/auth-config";

export default function Page() {
  if (!AUTH_ENABLED) redirect("/");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <SignIn />
    </main>
  );
}
