// Supabase Edge Function: instagram-token-refresh
// Runs every 50 days to refresh the Instagram Basic Display access token.
// Instagram long-lived tokens expire after 60 days.
// On failure: writes to sync_log and sends Telegram alert.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  INSTAGRAM_ACCESS_TOKEN: string;
  CRON_SECRET: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

Deno.serve(async (req: Request) => {
  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET") || "";
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const env: Env = {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      INSTAGRAM_ACCESS_TOKEN: Deno.env.get("INSTAGRAM_ACCESS_TOKEN")!,
      CRON_SECRET: Deno.env.get("CRON_SECRET")!,
      TELEGRAM_BOT_TOKEN: Deno.env.get("TELEGRAM_BOT_TOKEN"),
      TELEGRAM_CHAT_ID: Deno.env.get("TELEGRAM_CHAT_ID"),
    };

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // --- Refresh Instagram Token ---
    // Instagram Graph API token refresh endpoint
    const refreshResponse = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`,
    );

    if (!refreshResponse.ok) {
      const errorBody = await refreshResponse.text();
      throw new Error(`Instagram token refresh failed: ${refreshResponse.status} — ${errorBody}`);
    }

    const refreshData: {
      access_token: string;
      token_type: string;
      expires_in: number; // seconds (typically ~5184000 = 60 days)
    } = await refreshResponse.json();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshData.expires_in);

    // Upsert into instagram_tokens table
    const { error: upsertError } = await supabase
      .from("instagram_tokens")
      .upsert(
        {
          id: "00000000-0000-0000-0000-000000000001", // single row
          access_token: refreshData.access_token,
          expires_at: expiresAt.toISOString(),
          last_refreshed_at: new Date().toISOString(),
          refresh_status: "success",
        },
        { onConflict: "id" },
      );

    if (upsertError) {
      throw new Error(`Failed to update instagram_tokens: ${upsertError.message}`);
    }

    // Log success
    await supabase.from("sync_log").insert({
      sync_type: "instagram_token_refresh",
      status: "success",
      detail: {
        expires_in_days: Math.round(refreshData.expires_in / 86400),
        expires_at: expiresAt.toISOString(),
      },
      ran_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        expires_at: expiresAt.toISOString(),
        expires_in_days: Math.round(refreshData.expires_in / 86400),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // Log failure
    try {
      const env: Env = {
        SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
        SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        INSTAGRAM_ACCESS_TOKEN: Deno.env.get("INSTAGRAM_ACCESS_TOKEN")!,
        CRON_SECRET: Deno.env.get("CRON_SECRET")!,
      };
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

      await supabase.from("sync_log").insert({
        sync_type: "instagram_token_refresh",
        status: "failed",
        detail: { error: errorMessage },
        ran_at: new Date().toISOString(),
      });

      // Mark token as failed in DB
      await supabase
        .from("instagram_tokens")
        .upsert(
          {
            id: "00000000-0000-0000-0000-000000000001",
            refresh_status: "failed",
            last_refreshed_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

      // Telegram alert
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
      if (telegramBotToken && telegramChatId) {
        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: `⚠️ *Instagram Token Refresh Failed*\n\n${errorMessage}\n\nAction required: Manually refresh the Instagram access token.`,
              parse_mode: "Markdown",
            }),
          },
        );
      }
    } catch {
      // Could not log — silent
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
