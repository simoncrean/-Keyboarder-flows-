"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useBuilder } from "@/lib/store";
import { buildLayoutFlowB } from "@/lib/flowSeeds";
import { FlowChrome } from "../FlowChrome";

const FlowJourney = dynamic(
  () => import("../FlowJourney").then((m) => m.FlowJourney),
  { ssr: false, loading: () => <div className="flex-1" /> },
);

export default function FlowBPage() {
  const setLayout = useBuilder((s) => s.setLayout);
  const region = useBuilder((s) => s.region);

  // Flow B replaces HOT DRINKS with the Type-first journey: 23 Type tiles,
  // each opens a configurator wizard with Size_Milk (single) → Extras
  // (multi). The drill stops at Extras.
  useEffect(() => {
    setLayout(buildLayoutFlowB([], region));
  }, [setLayout, region]);

  return (
    <div className="flex flex-col h-screen">
      <FlowChrome variant="B" />
      <FlowJourney />
    </div>
  );
}
