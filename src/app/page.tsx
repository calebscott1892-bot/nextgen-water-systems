import { Nav } from "@/components/Nav";
import { LivingDrawing } from "@/components/blueprint/LivingDrawing";
import { DrawingChrome } from "@/components/site/DrawingChrome";
import { SiteSpine } from "@/components/site/SiteSpine";

export default function Home() {
  return (
    <>
      <Nav />
      <DrawingChrome />
      <main>
        {/* SHEET 01 — the 3D journey signature (chrome → blueprint → teardown). */}
        <LivingDrawing />
        {/* SHEET 02–09 — the rest of the drawing set, one bound document. */}
        <SiteSpine />
      </main>
    </>
  );
}
