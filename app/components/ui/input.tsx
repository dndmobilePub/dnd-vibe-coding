"use client";

import type { ComponentPropsWithRef } from "react";
import styles from "./input.module.css";

export type InputProps = ComponentPropsWithRef<"input">;
export type TextareaProps = ComponentPropsWithRef<"textarea">;

export function Input({ className = "", ...props }: InputProps) {
  return <input {...props} className={`${styles.control} ${className}`} />;
}

export function Textarea({ className = "", ...props }: TextareaProps) {
  return <textarea {...props} className={`${styles.control} ${styles.multiline} ${className}`} />;
}
