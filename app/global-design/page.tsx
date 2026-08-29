import { StudioHeader } from "@/components/global-demand/StudioHeader";
import { StudioForm } from "@/components/global-demand/StudioForm";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function GlobalDesignPage() {
  const demoMode = isDemoMode();

  return (
    <main className="stage-space relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-20 px-8 pb-24 sm:px-12 lg:px-16">
        <StudioHeader />
        <StudioForm demoMode={demoMode} />
      </div>
    </main>
  );
}
