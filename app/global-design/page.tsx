import { StudioHeader } from "@/components/global-demand/StudioHeader";
import { StudioForm } from "@/components/global-demand/StudioForm";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function GlobalDesignPage() {
  const demoMode = isDemoMode();

  return (
    <main className="relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-14 px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
        <StudioHeader demoMode={demoMode} />
        <StudioForm demoMode={demoMode} />
      </div>
    </main>
  );
}
