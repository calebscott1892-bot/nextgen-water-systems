import { Nav } from "@/components/Nav";
import { LivingDrawing } from "@/components/blueprint/LivingDrawing";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/*
          THE LIVING DRAWING — proof slice of the new direction: the NGW-01 column
          traced onto a real draughting plate as you scroll. Next: realistic 3D
          hero bookend (FilterJourney, kept dormant), exterior orbit + model
          spruce, Section A–A descent, and the FLOW TEST cleansing strip → CTA.
        */}
        <LivingDrawing />
      </main>
    </>
  );
}
