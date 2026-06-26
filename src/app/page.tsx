import { Nav } from "@/components/Nav";
import { FilterJourney } from "@/components/journey/FilterJourney";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <FilterJourney />
        {/*
          SIGNATURE MILESTONE: the 3D teardown journey, beats 0–4 (emerge → orbit
          → through → cross-section). Explode/benchmark/labels + the full section
          spine follow after sign-off, per the brief.
        */}
      </main>
    </>
  );
}
