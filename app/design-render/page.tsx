import { RenderHeader } from "@/components/design-render/RenderHeader";
import { RenderStudio } from "@/components/design-render/RenderStudio";

export const dynamic = "force-dynamic";

export default function DesignRenderPage() {
  return (
    <main className="stage-space relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-20 px-8 pb-24 sm:px-12 lg:px-16">
        <RenderHeader />
        <RenderStudio />
      </div>
    </main>
  );
}
