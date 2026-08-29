"use client";

import { useCallback, useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

interface DisclosureProps {
  /** Trigger label — passed through t() by the caller. */
  label: string;
  children: React.ReactNode;
  /** Default open state (uncontrolled). */
  defaultOpen?: boolean;
  /** Extra classes forwarded to the body wrapper. */
  className?: string;
}

/**
 * EXPERIENCE LAYER · Progressive Disclosure
 *
 * 「WHY THIS MATCH →」式的编辑级展开：第一层一句话，点击后展开完整
 * 解释。网格行高动画（0fr → 1fr）保证任意高度内容都能平滑展开，
 * 无需测量 DOM。纯表现层组件：不含业务逻辑；CSS grid 动画无 JS
 * 计时器，prefers-reduced-motion 下退化为瞬时显示。
 */
export function Disclosure({
  label,
  children,
  defaultOpen = false,
  className,
}: DisclosureProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const onTriggerClick = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        className="disclosure-trigger"
        data-open={open}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onTriggerClick}
      >
        <ArrowRight
          className="h-3 w-3 shrink-0"
          strokeWidth={1.5}
          aria-hidden
        />
        {open ? t("common.actions.collapseDetails") : label}
      </button>
      <div
        id={panelId}
        className="disclosure-body grid transition-[grid-template-rows] duration-[var(--dur-reveal)] ease-[var(--ease-atelier)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className={`pt-5 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
