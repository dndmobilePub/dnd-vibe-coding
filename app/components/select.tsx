"use client";

import type { ComponentPropsWithRef } from "react";
import styles from "./select.module.css";

export function Select({ className = "", ...props }: ComponentPropsWithRef<"select">) {
  return <select {...props} className={`${styles.control} ${className}`} />;
}
