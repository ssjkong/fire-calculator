"use client";

import { useState, useEffect, useRef } from "react";

export function MoneyInput({
  value,
  onChange,
  symbol = "$",
  placeholder,
  subtle = false,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  symbol?: string;
  placeholder?: string;
  subtle?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const display = focused
    ? value === 0
      ? ""
      : String(value || "")
    : value || value === 0
    ? Number(value).toLocaleString()
    : "";

  return (
    <label className={`relative flex items-center ${className}`}>
      <span
        className="absolute text-graphite/70 pointer-events-none text-sm"
        style={{ left: subtle ? 0 : 12 }}
      >
        {symbol}
      </span>
      <input
        type="text"
        inputMode="numeric"
        className={`${subtle ? "input-subtle" : "input-std"} w-full font-medium`}
        style={{ paddingLeft: subtle ? 14 : 28 }}
        value={display}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d.-]/g, "");
          const n = cleaned === "" || cleaned === "-" ? 0 : Number(cleaned);
          if (!isNaN(n)) onChange(n);
        }}
      />
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  suffix,
  min = 0,
  max = 200,
  step = 1,
  className = "",
  subtle = false,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  subtle?: boolean;
}) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <input
        type="number"
        className={`${subtle ? "input-subtle" : "input-std"} w-16 text-center font-medium`}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = e.target.value === "" ? 0 : Number(e.target.value);
          if (!isNaN(n)) onChange(n);
        }}
      />
      {suffix ? <span className="ml-2 text-sm text-graphite/70">{suffix}</span> : null}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span
        className="toggle-track"
        data-on={checked ? "true" : "false"}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <span className="toggle-thumb" />
      </span>
      {label ? <span className="text-sm text-graphite">{label}</span> : null}
    </label>
  );
}

export function Check({
  checked,
  onChange,
  children,
  className = "",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <input
        type="checkbox"
        className="check-box"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-graphite">{children}</span>
    </label>
  );
}

export function Card({
  children,
  className = "",
  tone = "surface",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "surface" | "amethyst" | "sky" | "base";
}) {
  const bg =
    tone === "amethyst"
      ? "bg-amethyst/40"
      : tone === "sky"
      ? "bg-sky/40"
      : tone === "base"
      ? "bg-base"
      : "bg-surface";
  return (
    <div className={`${bg} rounded-3xl border border-border/60 shadow-subtle ${className}`}>
      {children}
    </div>
  );
}

export function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h3 className="font-display text-[22px] leading-none text-ink whitespace-nowrap">{children}</h3>
      {action}
    </div>
  );
}

export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  align = "left",
}: {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      if (anchorRef?.current?.contains(e.target as Node)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className={`popover-pop absolute z-30 mt-2 ${align === "right" ? "right-0" : "left-0"} bg-surface rounded-2xl border border-border/70 shadow-pop p-4`}
      style={{ minWidth: 240 }}
    >
      {children}
    </div>
  );
}

export function HelpDot({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-border text-[10px] text-graphite cursor-help">
        i
      </span>
      {open ? (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-ink text-white text-[11px] leading-snug rounded-lg px-2.5 py-1.5 whitespace-pre w-max max-w-[260px]">
          {children}
        </span>
      ) : null}
    </span>
  );
}
