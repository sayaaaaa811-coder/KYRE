"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useForm, type FieldError, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, ChevronDown, LoaderCircle } from "lucide-react";
import { attendeeOptions, budgetOptions, serviceOptions } from "@/content/contact";
import { services } from "@/content/services";
import { contactFormSchema, type ContactFormValues, type ContactResponse } from "@/lib/contact-schema";
import { cn } from "@/lib/cn";

type Status =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success" }
  | { type: "error"; code: string; message: string };

/** 画面上の項目の並び順（エラー時のフォーカス移動に使用） */
const FIELD_ORDER: (keyof ContactFormValues)[] = [
  "company",
  "name",
  "email",
  "phone",
  "service",
  "eventDate",
  "area",
  "attendees",
  "budget",
  "message",
  "privacy",
];

type ContactFormProps = {
  /** 送信先が未設定の場合に案内するメールアドレス */
  fallbackEmail: string | null;
  /** 送信先（環境変数）が設定済みかどうか */
  configured: boolean;
};

const fieldBase =
  "w-full rounded-none border-0 border-b bg-transparent px-0 py-3.5 text-base text-charcoal transition-colors duration-300 placeholder:text-stone/70 focus:outline-none focus-visible:outline-none";

function fieldClass(error?: FieldError) {
  return cn(fieldBase, error ? "border-[#9b3b2f] focus:border-[#9b3b2f]" : "border-charcoal/30 focus:border-charcoal");
}

function Label({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-3 text-sm font-medium tracking-[0.06em]">
      {children}
      <span className={cn("px-2 py-0.5 text-[0.6875rem] tracking-wider", required ? "bg-charcoal text-ivory" : "border border-line text-stone-ink")}>
        {required ? "必須" : "任意"}
      </span>
    </label>
  );
}

function ErrorText({ id, error }: { id: string; error?: FieldError }) {
  if (!error?.message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-[#9b3b2f]">
      {error.message}
    </p>
  );
}

function Field({
  name,
  label,
  required,
  error,
  hint,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = `contact-${name}`;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-stone-ink">
          {hint}
        </p>
      )}
      <div className="mt-1">{children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}</div>
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}

function Select({
  registration,
  options,
  placeholder,
  ...aria
}: {
  registration: UseFormRegisterReturn;
  options: readonly { value: string; label: string }[];
  placeholder: string;
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
  error?: FieldError;
}) {
  const { error, ...rest } = aria;
  return (
    <div className="relative">
      <select {...registration} {...rest} defaultValue="" className={cn(fieldClass(error), "appearance-none pr-10")}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-1 size-4 -translate-y-1/2 text-stone" strokeWidth={1.5} />
    </div>
  );
}

export function ContactForm({ fallbackEmail, configured }: ContactFormProps) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const startedAt = useRef(0);
  const honeypotId = useId();
  const resultRef = useRef<HTMLDivElement>(null);

  const serviceParam = searchParams.get("service");
  const planParam = searchParams.get("plan");
  const presetService = serviceOptions.some((o) => o.value === serviceParam) ? (serviceParam as ContactFormValues["service"]) : undefined;
  const presetPlan = services.find((s) => s.slug === presetService)?.plans.find((p) => p.id === planParam);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    mode: "onTouched",
    // 画面上の並び順どおりに最初のエラー項目へ移動するため、フォーカスは onInvalid で制御する
    shouldFocusError: false,
    defaultValues: {
      company: "",
      name: "",
      email: "",
      phone: "",
      service: presetService,
      eventDate: "",
      area: "",
      message: presetPlan ? `【ご検討中のプラン】${presetPlan.name}\n\n` : "",
      privacy: false,
    },
  });

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status.type === "success" || status.type === "error") {
      resultRef.current?.focus();
    }
  }, [status]);

  const onInvalid = (fieldErrors: Partial<Record<keyof ContactFormValues, unknown>>) => {
    const first = FIELD_ORDER.find((key) => key in fieldErrors);
    if (!first) return;
    const target =
      first === "service"
        ? document.querySelector<HTMLInputElement>('input[name="service"]')
        : first === "privacy"
          ? document.querySelector<HTMLInputElement>('input[name="privacy"]')
          : document.getElementById(`contact-${first}`);
    target?.focus({ preventScroll: true });
    target?.closest("fieldset, div")?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const submit = async (values: ContactFormValues) => {
    setStatus({ type: "submitting" });
    const honeypot = (document.getElementById(honeypotId) as HTMLInputElement | null)?.value ?? "";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot, startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => null)) as ContactResponse | null;
      if (res.ok && data?.ok) {
        setStatus({ type: "success" });
        return;
      }
      if (data && !data.ok) {
        if (data.fieldErrors) {
          for (const [key, messages] of Object.entries(data.fieldErrors)) {
            if (messages?.[0]) setError(key as keyof ContactFormValues, { message: messages[0] });
          }
        }
        setStatus({ type: "error", code: data.code, message: data.message });
        return;
      }
      setStatus({ type: "error", code: "unknown", message: "送信に失敗しました。時間をおいて再度お試しください。" });
    } catch {
      setStatus({ type: "error", code: "network", message: "通信に失敗しました。インターネット接続をご確認のうえ、再度お試しください。" });
    }
  };

  if (status.type === "success") {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="border border-line bg-white px-8 py-16 text-center outline-none sm:px-14 sm:py-20">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-champagne-ink text-champagne-ink">
          <Check aria-hidden className="size-6" strokeWidth={1.25} />
        </span>
        <p className="eyebrow mt-8 text-champagne-ink">Thank You</p>
        <h2 className="display mt-4 text-4xl sm:text-5xl">Your inquiry has been sent.</h2>
        <p className="mt-8 text-base leading-loose">
          お問い合わせいただき、ありがとうございます。
          <br />
          内容を確認のうえ、担当者よりご連絡いたします。
        </p>
        <Link href="/" className="mt-12 inline-flex items-center gap-3 border-b border-charcoal/40 pb-1.5 text-sm tracking-[0.12em] uppercase hover:border-charcoal">
          Back to Home
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  const submitting = status.type === "submitting";

  return (
    <form onSubmit={(e) => handleSubmit(submit, onInvalid)(e)} noValidate aria-describedby="form-note" className="relative border border-line bg-white px-6 py-10 sm:px-12 sm:py-14">
      {!configured && (
        <div role="note" className="mb-10 border-l-2 border-champagne-ink bg-sand px-5 py-4 text-sm leading-relaxed">
          <p className="font-medium">現在、フォームの送信先を準備中です。</p>
          <p className="mt-1 text-stone-ink">
            フォームから送信いただいても、お問い合わせは届きません。
            {fallbackEmail ? (
              <>
                お手数ですが <a className="underline underline-offset-4" href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a> までご連絡ください。
              </>
            ) : (
              "準備が整うまで、しばらくお待ちください。"
            )}
          </p>
        </div>
      )}

      <p id="form-note" className="text-sm text-stone-ink">
        <span className="bg-charcoal px-2 py-0.5 text-[0.6875rem] tracking-wider text-ivory">必須</span> の項目は入力が必要です。
      </p>

      <div className="mt-10 grid gap-x-10 gap-y-9 md:grid-cols-2">
        <Field name="company" label="会社名" required error={errors.company}>
          {(p) => <input {...p} {...register("company")} type="text" autoComplete="organization" className={fieldClass(errors.company)} />}
        </Field>
        <Field name="name" label="担当者名" required error={errors.name}>
          {(p) => <input {...p} {...register("name")} type="text" autoComplete="name" className={fieldClass(errors.name)} />}
        </Field>
        <Field name="email" label="メールアドレス" required error={errors.email}>
          {(p) => (
            <input {...p} {...register("email")} type="email" inputMode="email" autoComplete="email" placeholder="name@example.com" className={fieldClass(errors.email)} />
          )}
        </Field>
        <Field name="phone" label="電話番号" error={errors.phone}>
          {(p) => <input {...p} {...register("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="03-0000-0000" className={fieldClass(errors.phone)} />}
        </Field>
      </div>

      <fieldset className="mt-12" aria-describedby={errors.service ? "contact-service-error" : undefined}>
        <legend className="flex items-center gap-3 text-sm font-medium tracking-[0.06em]">
          ご相談サービス
          <span className="bg-charcoal px-2 py-0.5 text-[0.6875rem] tracking-wider text-ivory">必須</span>
        </legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {serviceOptions.map((option) => (
            <label
              key={option.value}
              className="group flex cursor-pointer items-start gap-3 border border-line px-4 py-4 text-[0.9375rem] leading-snug transition-colors hover:border-charcoal/50 has-[:checked]:border-charcoal has-[:checked]:bg-ivory has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-champagne-ink"
            >
              <input
                {...register("service")}
                type="radio"
                value={option.value}
                className="peer sr-only"
              />
              <span aria-hidden className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-charcoal/50 peer-checked:border-charcoal">
                <span className="size-2 scale-0 rounded-full bg-charcoal transition-transform group-has-[:checked]:scale-100" />
              </span>
              {option.label}
            </label>
          ))}
        </div>
        <ErrorText id="contact-service-error" error={errors.service} />
      </fieldset>

      <div className="mt-12 grid gap-x-10 gap-y-9 md:grid-cols-2">
        <Field name="eventDate" label="開催予定日" error={errors.eventDate} hint="未定の場合は時期の目安でも構いません">
          {(p) => <input {...p} {...register("eventDate")} type="text" placeholder="例：2027年3月中旬" className={fieldClass(errors.eventDate)} />}
        </Field>
        <Field name="area" label="開催エリア" required error={errors.area} hint="施設のご相談の場合は所在地のエリア">
          {(p) => <input {...p} {...register("area")} type="text" placeholder="例：東京都内" className={fieldClass(errors.area)} />}
        </Field>
        <Field name="attendees" label="参加予定人数" required error={errors.attendees}>
          {(p) => <Select {...p} registration={register("attendees")} options={attendeeOptions} placeholder="選択してください" error={errors.attendees} />}
        </Field>
        <Field name="budget" label="想定予算" required error={errors.budget}>
          {(p) => <Select {...p} registration={register("budget")} options={budgetOptions} placeholder="選択してください" error={errors.budget} />}
        </Field>
      </div>

      <div className="mt-9">
        <Field name="message" label="ご相談内容" required error={errors.message} hint="イベントの目的、ご検討状況、気になっていることなどをご記入ください">
          {(p) => <textarea {...p} {...register("message")} rows={7} className={cn(fieldClass(errors.message), "resize-y leading-relaxed")} />}
        </Field>
      </div>

      {/* スパム対策：人間には見えない入力欄（ボットのみが入力する） */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={honeypotId}>Website</label>
        <input id={honeypotId} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed">
          <input
            {...register("privacy")}
            type="checkbox"
            aria-invalid={Boolean(errors.privacy)}
            aria-describedby={errors.privacy ? "contact-privacy-error" : undefined}
            className="mt-1 size-4 shrink-0 accent-charcoal"
          />
          <span>
            <Link href="/privacy" target="_blank" className="underline underline-offset-4 hover:text-champagne-ink">
              プライバシーポリシー
            </Link>
            に同意のうえ送信します
            <span className="ml-3 bg-charcoal px-2 py-0.5 text-[0.6875rem] tracking-wider text-ivory">必須</span>
          </span>
        </label>
        <ErrorText id="contact-privacy-error" error={errors.privacy} />

        {status.type === "error" && (
          <div ref={resultRef} tabIndex={-1} role="alert" className="mt-8 border-l-2 border-[#9b3b2f] bg-[#9b3b2f]/5 px-5 py-4 text-sm leading-relaxed outline-none">
            <p className="font-medium text-[#9b3b2f]">{status.message}</p>
            {status.code === "not_configured" && (
              <p className="mt-1 text-stone-ink">
                {fallbackEmail ? (
                  <>
                    お手数ですが <a className="underline underline-offset-4" href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a> までご連絡ください。
                  </>
                ) : (
                  "お問い合わせは届いていません。準備が整うまで、しばらくお待ちください。"
                )}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="group mt-10 inline-flex min-h-16 w-full items-center justify-center gap-4 bg-charcoal px-10 text-base font-medium tracking-[0.1em] text-ivory transition-colors duration-500 hover:bg-[#2b2a28] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        >
          {submitting ? (
            <>
              <LoaderCircle aria-hidden className="size-5 animate-spin" strokeWidth={1.5} />
              送信中…
            </>
          ) : (
            <>
              送信する
              <ArrowRight aria-hidden className="size-4 transition-transform duration-500 group-hover:translate-x-1.5" strokeWidth={1.5} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
