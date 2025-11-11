"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}
