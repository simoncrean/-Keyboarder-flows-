"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useBuilder } from "@/lib/store";
import { buildLayoutFlowA } from "@/lib/flowSeeds";
import { FlowChrome } from "../FlowChrome";

// Dynamic with ssr:false because dnd-kit's internal id counter differs
// between server and client; rendering only on the client avoids hydration
// mismatch.
const FlowJourney = dynamic(
  () => import("../FlowJourney").then((m) => m.FlowJourney),
  { ssr: false, loading: () => <div className="flex-1" /> },
);

export default function FlowAPage() {
  const setLayout = useBuilder((s) => s.setLayout);
  const region = useBuilder((s) => s.region);

  // Flow A is the original Size → Variety → wizard{Milks, Extras} drill.
  // No products are passed in — the comparison focuses on the HOT DRINKS
  // coffee journey, so other depts remain empty submenus.
  useEffect(() => {
    setLayout(buildLayoutFlowA([], region));
  }, [setLayout, region]);

  return (
    <div className="flex flex-col h-screen">
      <FlowChrome variant="A" />
      <FlowJourney />
    </div>
  );
}
