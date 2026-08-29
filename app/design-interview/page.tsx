import type { Metadata } from "next";
import { InterviewFlow } from "@/components/design-interview/InterviewFlow";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = {
  title: "Stage 0 · Guided Design Interview — Silver Future",
  description:
    "几个轻问题，帮我们看清你的审美与生活。在谈论银饰之前，先聊聊你自己。",
};

/**
 * Stage 0 — Guided Design Interview 路由。
 * 只负责理解用户偏好，输出结构化 UserDesignIntent（不含任何文化结论）。
 */
export default function DesignInterviewPage() {
  return <InterviewFlow demoMode={isDemoMode()} />;
}
