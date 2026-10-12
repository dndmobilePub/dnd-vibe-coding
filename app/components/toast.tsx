"use client";

import { useEffect, useRef } from "react";
import { useExitState } from "./use-exit-state";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import styles from "./toast.module.css";

export type ToastVariant = "success" | "error" | "info";
export type ToastMessage = { message: string; variant: ToastVariant };

export function Toast({ notification, onClose }: { notification: ToastMessage; onClose: () => void }) {
  const [visible, setVisible, exiting] = useExitState(true);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [notification, setVisible]);
  useEffect(() => { if (!visible) closeRef.current(); }, [visible]);
  const Icon = notification.variant === "error" ? CircleAlert : notification.variant === "success" ? CircleCheck : Info;
  return (
    <div className={`${styles.toast} ${styles[notification.variant]} ${exiting ? styles.exiting : ""}`} role={notification.variant === "error" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <span>{notification.message}</span>
      <button type="button" aria-label="메시지 닫기" disabled={exiting} onClick={() => setVisible(false)}><X size={16} aria-hidden="true" /></button>
    </div>
  );
}
