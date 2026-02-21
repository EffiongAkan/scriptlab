
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  to: string[];
  shareUrl: string;
  scriptTitle: string;
  message?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, shareUrl, scriptTitle, message }: InviteRequest = await req.json();

    // Log received request for debugging
    console.log("EdgeFunction: Email send requested. to:", to, "shareUrl:", shareUrl, "scriptTitle:", scriptTitle);

    // Validate 'to'
    if (!Array.isArray(to) || to.length === 0) {
      return new Response(
        JSON.stringify({ error: "No email recipients provided." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Simple link validation
    if (!shareUrl || typeof shareUrl !== "string" || !shareUrl.startsWith("http")) {
      return new Response(
        JSON.stringify({ error: "Malformed or missing shareUrl: " + shareUrl }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const fromAddress = "ScriptForge <onboarding@resend.dev>";

    // Log debug info for troubleshooting
    console.log("Sending invite: to", to, "subject", scriptTitle, "shareUrl", shareUrl);

    const subject = `You've been invited to view a script: "${scriptTitle}"`;
    const html = `
      <h1>Script Share Invitation</h1>
      <p>You have been invited to view: <b>${scriptTitle}</b></p>
      <p>
        <a href="${shareUrl}">Click here to view the script</a>
      </p>
      <div style="margin-top: 6px">
        or paste this link: <code>${shareUrl}</code>
      </div>
      ${message ? `<p>${message}</p>` : ""}
      <hr>
      <p>This link was generated on ScriptForge.</p>
    `;

    const emailResult = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log("Resend emailResult:", emailResult);

    if ((emailResult as any)?.error) {
      return new Response(
        JSON.stringify({ error: (emailResult as any).error.message || "Resend error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify(emailResult), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-invite-email error:", error?.message, error);
    return new Response(
      JSON.stringify({ error: error && error.message ? error.message : String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
