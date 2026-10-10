import { auth } from "@clerk/nextjs/server";
import { AUTH_ENABLED, DEMO_USER_ID } from "@/lib/auth-config";
import { getPrepData } from "@/lib/synthetic-data";
import { PrepWorkspace } from "./components/prep-workspace";

export default async function Page() {
  // proxy.ts already redirects signed-out visitors; this narrows the type.
  const userId = AUTH_ENABLED ? (await auth.protect()).userId : DEMO_USER_ID;
  const data = await getPrepData();
  return (
    <main className="flex-1">
      <PrepWorkspace data={data} userId={userId} />
    </main>
  );
}
