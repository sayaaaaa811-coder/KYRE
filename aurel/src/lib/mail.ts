import "server-only";
import { siteConfig } from "@/config/site";
import { attendeeOptions, budgetOptions, serviceOptions } from "@/content/contact";
import { optionLabel, type ContactFormValues } from "./contact-schema";

type MailConfig = {
  apiKey: string;
  to: string[];
  from: string;
  autoReply: boolean;
};

/** 送信に必要な環境変数がそろっている場合のみ設定を返す */
export function getMailConfig(): MailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = (process.env.CONTACT_TO_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  if (!apiKey || to.length === 0 || !from) return null;
  return { apiKey, to, from, autoReply: process.env.CONTACT_AUTO_REPLY === "true" };
}

/** 改行や制御文字を除去（件名・ヘッダーに使う値） */
const singleLine = (s: string) => s.replace(/[\r\n\t\u0000-\u001f]+/g, " ").trim();

function summary(v: ContactFormValues): string {
  return [
    `会社名: ${v.company}`,
    `担当者名: ${v.name}`,
    `メールアドレス: ${v.email}`,
    `電話番号: ${v.phone || "（未入力）"}`,
    `ご相談サービス: ${optionLabel(serviceOptions, v.service)}`,
    `開催予定日: ${v.eventDate || "（未入力）"}`,
    `開催エリア: ${v.area}`,
    `参加予定人数: ${optionLabel(attendeeOptions, v.attendees)}`,
    `想定予算: ${optionLabel(budgetOptions, v.budget)}`,
    "",
    "ご相談内容:",
    v.message,
  ].join("\n");
}

async function send(config: MailConfig, body: Record<string, unknown>): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Resend responded with ${res.status}`);
  }
}

/** 問い合わせ通知メール（と、設定時は自動返信メール）を送る */
export async function sendContactMail(config: MailConfig, v: ContactFormValues): Promise<void> {
  const brand = siteConfig.brand.name;
  // HTML メールにせずテキストのみで送ることで、入力値によるマークアップ注入を避ける
  await send(config, {
    from: config.from,
    to: config.to,
    reply_to: v.email,
    subject: singleLine(`【${brand}】お問い合わせ: ${v.company} ${v.name} 様`),
    text: `${brand} のWebサイトからお問い合わせがありました。\n\n${summary(v)}\n`,
  });

  if (config.autoReply) {
    try {
      await send(config, {
        from: config.from,
        to: [v.email],
        subject: singleLine(`【${brand}】お問い合わせを受け付けました`),
        text: [
          `${v.name} 様`,
          "",
          `このたびは ${brand} にお問い合わせいただき、ありがとうございます。`,
          "以下の内容でお問い合わせを受け付けました。内容を確認のうえ、担当者よりご連絡いたします。",
          "",
          "――――――――――――――――",
          summary(v),
          "――――――――――――――――",
          "",
          "※ このメールは送信専用アドレスから自動で送信しています。",
          brand,
        ].join("\n"),
      });
    } catch {
      // 自動返信の失敗は通知メールの送信結果に影響させない
    }
  }
}
