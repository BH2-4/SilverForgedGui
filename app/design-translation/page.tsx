import { TranslationHeader } from "@/components/design-translation/TranslationHeader";
import { DesignTranslationStudio } from "@/components/design-translation/DesignTranslationStudio";

export const dynamic = "force-dynamic";

export default function DesignTranslationPage() {
  return (
    <main className="stage-space relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-20 px-8 pb-24 sm:px-12 lg:px-16">
        <TranslationHeader />
        <DesignTranslationStudio />
      </div>
    </main>
  );
}
