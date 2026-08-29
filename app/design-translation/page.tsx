import { TranslationHeader } from "@/components/design-translation/TranslationHeader";
import { DesignTranslationStudio } from "@/components/design-translation/DesignTranslationStudio";

export const dynamic = "force-dynamic";

export default function DesignTranslationPage() {
  return (
    <main className="relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-14 px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
        <TranslationHeader />
        <DesignTranslationStudio />
      </div>
    </main>
  );
}
