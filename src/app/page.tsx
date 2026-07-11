import { Nav } from "@/components/Nav";
import { LivingDrawing } from "@/components/blueprint/LivingDrawing";
import { DrawingChrome } from "@/components/site/DrawingChrome";
import { StaticStory } from "@/components/site/StaticStory";
import { SiteSpine } from "@/components/site/SiteSpine";

export default function Home() {
  return (
    <>
      <Nav />
      <DrawingChrome />
      <main>
        {/* the pinned 3D journey carries the whole story via scroll beats */}
        <LivingDrawing />
        {/* reduced-motion fallback: the same story as a static document
            (display:none for everyone else — see globals.css) */}
        <StaticStory />
        {/* the compact booking tail */}
        <SiteSpine />
      </main>
    </>
  );
}
