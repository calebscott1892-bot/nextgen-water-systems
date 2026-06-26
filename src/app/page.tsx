import { Nav } from "@/components/Nav";
import { PurificationHero } from "@/components/hero/PurificationHero";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <PurificationHero />
        {/*
          HERO MILESTONE: signature visual only, per the brief. The 12-section
          homepage lands after the hero is approved on real hardware.
        */}
      </main>
    </>
  );
}
