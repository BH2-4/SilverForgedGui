import { MatchHeader } from "@/components/cultural-match/MatchHeader";
import { CulturalMatchStudio } from "@/components/cultural-match/CulturalMatchStudio";

export const dynamic = "force-dynamic";

export default function CulturalMatchPage() {
  return (
    <main className="stage-space relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-20 px-8 pb-24 sm:px-12 lg:px-16">
        <MatchHeader />
        <CulturalMatchStudio />
      </div>
    </main>
  );
}
