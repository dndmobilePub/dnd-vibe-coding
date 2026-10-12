"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

export function useExitState<T>(initial: T, enabled = true) {
  const [value, setValue] = useState(initial);
  const [exiting, setExiting] = useState(false);
  const current = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const update = useCallback((action: SetStateAction<T>) => {
    const next = typeof action === "function" ? (action as (previous: T) => T)(current.current) : action;
    if (timer.current) clearTimeout(timer.current);
    if (!next && current.current && enabled && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setExiting(true);
      timer.current = setTimeout(() => { current.current = next; setValue(next); setExiting(false); timer.current = null; }, 160);
    } else {
      current.current = next;
      setValue(next);
      setExiting(false);
    }
  }, [enabled]);
  return [value, update, exiting] as const;
}
