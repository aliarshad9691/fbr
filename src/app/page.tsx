import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import InvoiceWorkbench from "@/components/InvoiceWorkbench";

export default async function Home() {
  const session = await auth();
  const username = session?.user?.name ?? "user";

  return (
    <AppShell username={username}>
      <InvoiceWorkbench />
    </AppShell>
  );
}
