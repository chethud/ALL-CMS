import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { currentSiteContext } from "@/lib/data";
import { EDITOR_COOKIE, editorTokenValid } from "@/lib/editor-session";

export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const signedIn = await editorTokenValid(cookieStore.get(EDITOR_COOKIE)?.value);
  if (!signedIn) redirect("/login");

  const context = await currentSiteContext();

  return (
    <Shell sites={context.sites} site={context.site} dbError={context.error}>
      {children}
    </Shell>
  );
}
