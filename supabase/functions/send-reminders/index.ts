// Runs every minute (scheduled via pg_cron, see migrations/20260716000100_schedule_reminders.sql).
// Finds posts due within the next few minutes and sends a Telegram reminder with the
// caption ready to copy and the image ready to download, so publishing stays a manual,
// one-tap action on Instagram.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REMINDER_WINDOW_MINUTES = 5;
const PHOTO_CAPTION_LIMIT = 1024;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function telegramError(res: Response, label: string) {
  const body = await res.text();
  console.error(`${label} failed`, body);
  return `${label}: ${body.slice(0, 300)}`;
}

async function sendTelegramMessage(text: string) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
  });
  if (!res.ok) return telegramError(res, "sendMessage");
  return null;
}

async function sendTelegramPhoto(photoUrl: string, caption: string) {
  const truncated = caption.length > PHOTO_CAPTION_LIMIT
    ? caption.slice(0, PHOTO_CAPTION_LIMIT - 1) + "…"
    : caption;
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, photo: photoUrl, caption: truncated, parse_mode: "HTML" }),
  });
  if (!res.ok) return telegramError(res, "sendPhoto");
  return null;
}

async function sendTelegramMediaGroup(photoUrls: string[], caption: string) {
  const truncated = caption.length > PHOTO_CAPTION_LIMIT
    ? caption.slice(0, PHOTO_CAPTION_LIMIT - 1) + "…"
    : caption;
  const media = photoUrls.slice(0, 10).map((url, i) => ({
    type: "photo",
    media: url,
    ...(i === 0 ? { caption: truncated, parse_mode: "HTML" } : {}),
  }));
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, media }),
  });
  if (!res.ok) return telegramError(res, "sendMediaGroup");
  return null;
}

Deno.serve(async () => {
  const windowEnd = new Date(Date.now() + REMINDER_WINDOW_MINUTES * 60_000).toISOString();

  const { data: duePosts, error } = await supabase
    .from("posts")
    .select("id, caption, media_paths, scheduled_at, reminder_error, page:pages(name), category:categories(name)")
    .eq("reminder_sent", false)
    .lte("scheduled_at", windowEnd);

  if (error) {
    console.error("query failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  for (const post of duePosts ?? []) {
    const time = new Date(post.scheduled_at).toLocaleString("it-IT", { timeZone: "Europe/Rome" });
    const pageName = (post.page as { name?: string } | null)?.name ?? "Pagina";
    const categoryName = (post.category as { name?: string } | null)?.name;
    const header = categoryName ? `${pageName} · ${categoryName}` : pageName;
    const caption = `📅 <b>${header}</b> — ${time}\n\n${post.caption || "(nessuna caption)"}`;

    const mediaPaths: string[] = post.media_paths ?? [];
    const photoUrls = mediaPaths.map((path) => supabase.storage.from("media").getPublicUrl(path).data.publicUrl);

    const sendError = photoUrls.length > 1
      ? await sendTelegramMediaGroup(photoUrls, caption)
      : photoUrls.length === 1
      ? await sendTelegramPhoto(photoUrls[0], caption)
      : await sendTelegramMessage(caption);

    if (sendError) {
      // Leave reminder_sent false so the next cron run retries; surface the failure in the UI.
      const isNewFailure = !post.reminder_error;
      await supabase.from("posts").update({ reminder_error: sendError }).eq("id", post.id);
      if (isNewFailure) {
        // Best-effort plain-text alert so a failure isn't only visible next time someone opens the app.
        // Sent once per failure episode (not every retry) to avoid spamming Telegram.
        await sendTelegramMessage(
          `🚨 <b>Promemoria non inviato</b> — ${pageName} (${time})\n${sendError}\n\nL'app riproverà automaticamente ogni minuto.`,
        );
      }
      continue;
    }

    await supabase
      .from("posts")
      .update({ reminder_sent: true, status: "promemoria_inviato", reminder_error: null })
      .eq("id", post.id);
  }

  return new Response(JSON.stringify({ processed: duePosts?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
