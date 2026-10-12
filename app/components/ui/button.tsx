"use client";

import type { ComponentPropsWithRef } from "react";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ButtonProps) {
  return <button {...props} type={type} className={`button ${variant} ${className}`} />;
}

export type IconButtonProps = ComponentPropsWithRef<"button"> & {
  "aria-label": string;
};

export function IconButton({ className = "", type = "button", ...props }: IconButtonProps) {
  return <button {...props} type={type} className={`icon-button ${className}`} />;
}
