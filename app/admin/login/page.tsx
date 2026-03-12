import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAdminAction } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const errorMessages: Record<string, string> = {
  invalid_credentials: "Incorrect admin password.",
  missing_config: "Admin panel env variables are missing.",
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  if (await isAdminAuthenticated()) redirect("/admin");

  const params = await searchParams;
  const errorCode = getSingleValue(params.error);
  const errorMessage = errorCode ? errorMessages[errorCode] || "Login failed." : null;
  const ready = isAdminConfigured();

  return (
    <div className="mx-auto w-full max-w-md py-8">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Access product, banner, and order controls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!ready ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Set `ADMIN_PANEL_PASSWORD` and `ADMIN_PANEL_SECRET` in `.env.local`, then restart the dev server.
            </div>
          ) : null}
          {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}

          <form action={loginAdminAction} className="space-y-3">
            <Input
              type="password"
              name="password"
              placeholder="Admin password"
              autoComplete="current-password"
              required
              disabled={!ready}
            />
            <Button type="submit" className="w-full" disabled={!ready}>
              Sign In
            </Button>
          </form>

          <Button asChild variant="outline" className="w-full">
            <Link href="/">Back to Store</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
