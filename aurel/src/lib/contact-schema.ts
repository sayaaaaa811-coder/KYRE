import { z } from "zod";
import { attendeeOptions, budgetOptions, serviceOptions } from "@/content/contact";

const values = <T extends readonly { value: string }[]>(options: T) =>
  options.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label}を入力してください` })
    .max(max, { error: `${label}は${max}文字以内で入力してください` });

/** フォーム入力の検証ルール（クライアント・サーバー共通） */
export const contactFormSchema = z.object({
  company: required("会社名", 100),
  name: required("担当者名", 50),
  email: z
    .string()
    .trim()
    .min(1, { error: "メールアドレスを入力してください" })
    .pipe(z.email({ error: "メールアドレスの形式が正しくありません" }))
    .pipe(z.string().max(254, { error: "メールアドレスが長すぎます" })),
  phone: z
    .string()
    .trim()
    .max(20, { error: "電話番号は20文字以内で入力してください" })
    .regex(/^[0-9+\-() ]*$/, { error: "電話番号は半角数字とハイフンで入力してください" }),
  service: z.enum(values(serviceOptions), { error: "ご相談サービスを選択してください" }),
  eventDate: z.string().trim().max(50, { error: "開催予定日は50文字以内で入力してください" }),
  area: required("開催エリア", 50),
  attendees: z.enum(values(attendeeOptions), { error: "参加予定人数を選択してください" }),
  budget: z.enum(values(budgetOptions), { error: "想定予算を選択してください" }),
  message: z
    .string()
    .trim()
    .min(10, { error: "ご相談内容を10文字以上で入力してください" })
    .max(3000, { error: "ご相談内容は3000文字以内で入力してください" }),
  privacy: z.boolean().refine((v) => v, { error: "プライバシーポリシーへの同意が必要です" }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/** API に送る内容（スパム対策用の項目を含む） */
export const contactPayloadSchema = contactFormSchema.extend({
  /** ボット対策の隠し項目。人間は入力しない */
  website: z.string().max(200).optional().default(""),
  /** フォーム表示時刻（ミリ秒）。極端に速い送信を弾く */
  startedAt: z.number().int().nonnegative(),
});

export type ContactPayload = z.infer<typeof contactPayloadSchema>;

/** API の応答 */
export type ContactResponse =
  | { ok: true }
  | {
      ok: false;
      code: "invalid" | "spam" | "rate_limited" | "not_configured" | "send_failed" | "forbidden";
      message: string;
      fieldErrors?: Partial<Record<keyof ContactFormValues, string[]>>;
    };

export function optionLabel(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
