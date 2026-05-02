import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  const sp = await props.searchParams;
  const callbackUrl =
    typeof sp.callbackUrl === "string" && sp.callbackUrl ? sp.callbackUrl : "/";

  if (session) redirect(callbackUrl);

  const errorParam = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <span className="text-sm font-semibold tracking-tight">FBR</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Digital Invoicing Client
          </h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>
        <LoginForm callbackUrl={callbackUrl} errorParam={errorParam} />
      </div>
    </main>
  );
}
