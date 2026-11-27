"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import {
  addOrderNote,
  changeOrderStatus,
  replyToOrder,
} from "@/server/actions/admin/orders";
import { ORDER_STATUSES } from "@/validators/admin-orders";
import { inputClass, textareaClass } from "./field";

type Status = (typeof ORDER_STATUSES)[number];

export function OrderStatusForm({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const t = useTranslations("AdminOrders");
  const router = useRouter();
  const [value, setValue] = useState<Status>(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(false);
        startTransition(async () => {
          const r = await changeOrderStatus({ id, status: value });
          if (r.ok) router.refresh();
          else setError(true);
        });
      }}
    >
      <div>
        <label
          htmlFor="order-status"
          className="mb-1 block text-sm font-medium"
        >
          {t("status")}
        </label>
        <select
          id="order-status"
          value={value}
          onChange={(e) => setValue(e.target.value as Status)}
          className={inputClass}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`statuses.${s}`)}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending || value === status}>
        {t("updateStatus")}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {t("errors.generic")}
        </span>
      )}
    </form>
  );
}

export function OrderNoteForm({ id }: { id: string }) {
  const t = useTranslations("AdminOrders");
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(false);
        startTransition(async () => {
          const r = await addOrderNote({ id, text });
          if (r.ok) {
            setText("");
            router.refresh();
          } else setError(true);
        });
      }}
    >
      <label htmlFor="order-note" className="block text-sm font-medium">
        {t("addNote")}
      </label>
      <textarea
        id="order-note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className={textareaClass}
      />
      <Button
        type="submit"
        variant="outline"
        disabled={pending || !text.trim()}
      >
        {t("saveNote")}
      </Button>
      {error && (
        <span role="alert" className="ms-2 text-xs text-red-700">
          {t("errors.generic")}
        </span>
      )}
    </form>
  );
}

export function OrderReplyForm({
  id,
  defaultSubject,
}: {
  id: string;
  defaultSubject: string;
}) {
  const t = useTranslations("AdminOrders");
  const router = useRouter();
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const r = await replyToOrder({ id, subject, body });
          if (r.ok) {
            setBody("");
            setMessage({ kind: "ok", text: t("replySent") });
          } else {
            setMessage({
              kind: "error",
              text: t.has(`errors.${r.error}`)
                ? t(`errors.${r.error}`)
                : t("errors.generic"),
            });
          }
          router.refresh();
        });
      }}
    >
      <div>
        <label
          htmlFor="reply-subject"
          className="mb-1 block text-sm font-medium"
        >
          {t("replySubject")}
        </label>
        <input
          id="reply-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="reply-body" className="mb-1 block text-sm font-medium">
          {t("replyBody")}
        </label>
        <textarea
          id="reply-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className={textareaClass}
        />
      </div>
      <Button
        type="submit"
        disabled={pending || !subject.trim() || !body.trim()}
      >
        {pending ? t("sending") : t("sendReply")}
      </Button>
      {message && (
        <p
          role={message.kind === "ok" ? "status" : "alert"}
          className={`text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-700"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
