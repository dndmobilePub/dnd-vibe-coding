"use client";

import type { ComponentPropsWithRef } from "react";
import styles from "./select.module.css";

export type SelectProps = ComponentPropsWithRef<"select">;

export function Select({ className = "", ...props }: SelectProps) {
  return <select {...props} className={`${styles.control} ${className}`} />;
}
