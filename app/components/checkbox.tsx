"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

export function Checkbox({
  className = "",
  checked,
  ...props
}: ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      {...props}
      checked={checked}
      className={`ui-checkbox ${className}`}
    >
      <CheckboxPrimitive.Indicator className="ui-checkbox-indicator">
        {checked === "indeterminate" ? (
          <Minus size={14} strokeWidth={3} aria-hidden="true" />
        ) : (
          <Check size={14} strokeWidth={3} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
