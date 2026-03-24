import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { license_key } = await req.json();
    if (!license_key || typeof license_key !== "string") {
      return new Response(JSON.stringify({ valid: false, error: "License key is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sheetUrl = Deno.env.get("GOOGLE_SHEET_LICENSES_URL");
    if (!sheetUrl) {
      return new Response(JSON.stringify({ valid: false, error: "License service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the Google Sheet as CSV
    const csvResponse = await fetch(sheetUrl);
    if (!csvResponse.ok) {
      return new Response(JSON.stringify({ valid: false, error: "Could not reach license server" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const csvText = await csvResponse.text();
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    const trimmedKey = license_key.trim();
    const found = lines.some((line) => {
      // Handle CSV cells that might be quoted
      const cell = line.replace(/^"|"$/g, "").trim();
      return cell === trimmedKey;
    });

    if (!found) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // License is valid — save to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await supabase
      .from("app_licenses")
      .upsert({ license_key: trimmedKey }, { onConflict: "license_key" });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ valid: false, error: "Could not activate license" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ valid: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ valid: false, error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
