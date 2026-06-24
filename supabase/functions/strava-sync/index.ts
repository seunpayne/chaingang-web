// Supabase Edge Function: strava-sync
// Syncs Strava club activities to leaderboard_cache
// Phase 1: Single STRAVA_REFRESH_TOKEN → club activities → aggregate per athlete

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SupabaseEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface StravaEnv {
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_REFRESH_TOKEN: string;
  STRAVA_CLUB_ID: string;
}

interface StravaActivity {
  athlete: { id: number; firstname: string; lastname: string };
  distance: number; // meters
  total_elevation_gain: number; // meters
  type: string;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface LeaderboardRow {
  strava_athlete_id: number;
  display_name: string;
  total_km: number;
  total_elevation_m: number;
  rides_attended: number;
  kom_qom_count: number;
}

interface AggregatedAthlete {
  display_name: string;
  total_km: number;
  total_elevation_m: number;
  rides_attended: number;
}

Deno.serve(async (req: Request) => {
  try {
    // --- Auth: CRON_SECRET or Authorization header ---
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET") || "";
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Init Supabase client ---
    const supabaseEnv: SupabaseEnv = {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    };

    const supabase = createClient(
      supabaseEnv.SUPABASE_URL,
      supabaseEnv.SUPABASE_SERVICE_ROLE_KEY,
    );

    // --- Get Strava access token ---
    const stravaEnv: StravaEnv = {
      STRAVA_CLIENT_ID: Deno.env.get("STRAVA_CLIENT_ID")!,
      STRAVA_CLIENT_SECRET: Deno.env.get("STRAVA_CLIENT_SECRET")!,
      STRAVA_REFRESH_TOKEN: Deno.env.get("STRAVA_REFRESH_TOKEN")!,
      STRAVA_CLUB_ID: Deno.env.get("STRAVA_CLUB_ID")!,
    };

    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: stravaEnv.STRAVA_CLIENT_ID,
        client_secret: stravaEnv.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: stravaEnv.STRAVA_REFRESH_TOKEN,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Strava token refresh failed: ${tokenResponse.status}`);
    }

    const tokenData: StravaTokenResponse = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // --- Fetch club activities (paginated) ---
    const PER_PAGE = 200;
    let page = 1;
    let allActivities: StravaActivity[] = [];
    let hasMore = true;

    while (hasMore) {
      const activitiesResponse = await fetch(
        `https://www.strava.com/api/v3/clubs/${stravaEnv.STRAVA_CLUB_ID}/activities` +
          `?page=${page}&per_page=${PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!activitiesResponse.ok) {
        throw new Error(
          `Strava activities fetch failed: ${activitiesResponse.status}`,
        );
      }

      const activities: StravaActivity[] = await activitiesResponse.json();
      allActivities = allActivities.concat(activities);
      hasMore = activities.length === PER_PAGE;
      page++;

      if (page > 10) break; // Safety cap: max 2,000 activities
    }

    // --- Aggregate per athlete ---
    const athletes = new Map<number, AggregatedAthlete>();

    for (const activity of allActivities) {
      const aid = activity.athlete.id;
      if (!athletes.has(aid)) {
        athletes.set(aid, {
          display_name:
            `${activity.athlete.firstname} ${activity.athlete.lastname}`.trim(),
          total_km: 0,
          total_elevation_m: 0,
          rides_attended: 0,
        });
      }

      const agg = athletes.get(aid)!;
      agg.total_km += activity.distance / 1000; // meters → km
      agg.total_elevation_m += activity.total_elevation_gain;
      agg.rides_attended += 1;
    }

    // --- Upsert into leaderboard_cache ---
    const periodMonth = new Date().toISOString().slice(0, 7) + "-01"; // YYYY-MM-01
    const rows: LeaderboardRow[] = [];

    for (const [athleteId, agg] of athletes) {
      rows.push({
        strava_athlete_id: athleteId,
        display_name: agg.display_name,
        total_km: parseFloat(agg.total_km.toFixed(2)),
        total_elevation_m: parseFloat(agg.total_elevation_m.toFixed(1)),
        rides_attended: agg.rides_attended,
        kom_qom_count: 0, // Phase 2
      });
    }

    // Upsert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error: upsertError } = await supabase
        .from("leaderboard_cache")
        .upsert(
          batch.map((r) => ({
            strava_athlete_id: r.strava_athlete_id,
            display_name: r.display_name,
            period_month: periodMonth,
            total_km: r.total_km,
            total_elevation_m: r.total_elevation_m,
            rides_attended: r.rides_attended,
            kom_qom_count: r.kom_qom_count,
            synced_at: new Date().toISOString(),
          })),
          { onConflict: "strava_athlete_id,period_month" },
        );

      if (upsertError) {
        throw new Error(`Upsert error: ${upsertError.message}`);
      }
    }

    // --- Write sync_log ---
    await supabase.from("sync_log").insert({
      sync_type: "strava_leaderboard",
      status: "success",
      detail: {
        activities_fetched: allActivities.length,
        athletes_processed: athletes.size,
        period_month: periodMonth,
      },
      ran_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        activities_fetched: allActivities.length,
        athletes_processed: athletes.size,
        period_month: periodMonth,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // Attempt to log failure
    try {
      const supabaseEnv: SupabaseEnv = {
        SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
        SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      };
      const supabase = createClient(
        supabaseEnv.SUPABASE_URL,
        supabaseEnv.SUPABASE_SERVICE_ROLE_KEY,
      );
      await supabase.from("sync_log").insert({
        sync_type: "strava_leaderboard",
        status: "failed",
        detail: { error: errorMessage },
        ran_at: new Date().toISOString(),
      });
    } catch {
      // Could not log — silent
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
