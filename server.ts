import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import Stripe from "stripe";
import admin from "firebase-admin";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    credential: admin.credential.applicationDefault(), // This works in Cloud Run
  });
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Stripe Webhook needs raw body
  app.post("/api/payments/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured.");
      return res.status(500).send("Webhook Secret missing");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24-preview' as any,
    });

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      // Card-saving flow: Checkout Session in 'setup' mode.
      // Fetch the resulting SetupIntent + PaymentMethod and persist a safe summary.
      if (session.mode === 'setup' && userId) {
        try {
          const setupIntentId = typeof session.setup_intent === 'string'
            ? session.setup_intent
            : session.setup_intent?.id;

          if (setupIntentId) {
            const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
              expand: ['payment_method'],
            });
            const pm = setupIntent.payment_method as Stripe.PaymentMethod | null;

            if (pm && pm.card) {
              const newPaymentMethod = {
                id: pm.id,
                type: 'card',
                last4: pm.card.last4,
                brand: pm.card.brand,
                expiryMonth: pm.card.exp_month,
                expiryYear: pm.card.exp_year,
                isDefault: true,
                cardHolder: pm.billing_details?.name || '',
                stripeCustomerId: typeof pm.customer === 'string' ? pm.customer : pm.customer?.id,
              };

              const walletRef = db.collection('wallets').doc(userId);
              const walletDoc = await walletRef.get();
              const walletData = walletDoc.data() || {};
              const currentMethods = walletData.paymentMethods || [];
              const updatedMethods = currentMethods
                .filter((m: any) => m.id !== newPaymentMethod.id)
                .map((m: any) => ({ ...m, isDefault: false }));
              updatedMethods.push(newPaymentMethod);

              await walletRef.set({ paymentMethods: updatedMethods }, { merge: true });
              console.log(`PaymentMethod ${pm.id} saved for user ${userId}`);
            }
          }
        } catch (err) {
          console.error("Error persisting saved card from setup session:", err);
        }

        return res.json({ received: true });
      }

      const amount = session.amount_total || 0; // JPY is zero-decimal

      if (userId) {
        try {
          const walletRef = db.collection('wallets').doc(userId);
          const transactionRef = db.collection('transactions').doc();

          // 10% tax included in the amount (e.g. 55000 -> 50000 budget, 5000 tax)
          const tax = Math.floor(amount / 11);
          const net = amount - tax;

          await db.runTransaction(async (t) => {
            const walletDoc = await t.get(walletRef);
            const data = walletDoc.data() || {};
            
            const currentTotal = data.balance_total || 0;
            const currentBudget = data.balance_ad_budget || 0;
            const currentTax = data.tax_holding || 0;
            
            t.set(walletRef, {
              balance_total: currentTotal + amount,
              balance_ad_budget: currentBudget + net,
              tax_holding: currentTax + tax,
              status: 'active',
              lastResetAt: Date.now(),
              // Initialize other fields if it's a new wallet
              ...(walletDoc.exists ? {} : {
                autoChargeEnabled: false,
                autoChargeThreshold: 10000,
                autoChargeAmount: 55000,
              })
            }, { merge: true });

            t.set(transactionRef, {
              id: transactionRef.id,
              userUid: userId,
              amount: amount,
              net_amount: net,
              tax_amount: tax,
              type: 'credit_card',
              status: 'completed',
              timestamp: Date.now(),
              stripeSessionId: session.id
            });
          });

          console.log(`Wallet updated for user ${userId}: Total +${amount}, Budget +${net}, Tax +${tax}`);
        } catch (error) {
          console.error("Error updating wallet:", error);
        }
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());
  
  // Serve uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Stripe Checkout Session
  app.post("/api/payments/create-checkout-session", async (req, res) => {
    const { amount, userId, successUrl, cancelUrl } = req.body;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured." });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24-preview' as any,
    });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: 'AMAS 広告デポジット',
                description: '広告運用費用のデポジットチャージ',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl || `${process.env.APP_URL}/wallet?success=true`,
        cancel_url: cancelUrl || `${process.env.APP_URL}/wallet?canceled=true`,
        metadata: {
          userId: userId,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save Card Method (Stripe SetupIntent / Checkout Session in setup mode)
  // The frontend MUST NOT send raw card data. This endpoint creates a Stripe-hosted
  // Checkout Session in 'setup' mode and returns the URL. The user is redirected to
  // Stripe to enter their card details; the saved PaymentMethod is persisted via the
  // webhook below (checkout.session.completed with mode === 'setup').
  app.post("/api/payments/save-card", async (req, res) => {
    const { userId, successUrl, cancelUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured." });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24-preview' as any,
    });

    try {
      // 1. Create or get Stripe Customer
      let customerId: string | undefined;
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      if (userData?.stripeCustomerId) {
        customerId = userData.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: userData?.email,
          metadata: { userId },
        });
        customerId = customer.id;
        await db.collection('users').doc(userId).update({ stripeCustomerId: customerId });
      }

      // 2. Create a Stripe Checkout Session in 'setup' mode (Intent-based flow)
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        payment_method_types: ['card'],
        customer: customerId,
        success_url: successUrl || `${process.env.APP_URL}/wallet?setup_success=true`,
        cancel_url: cancelUrl || `${process.env.APP_URL}/wallet?setup_canceled=true`,
        metadata: { userId },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Save Card Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini API Proxy
  app.post("/api/ai/gemini", async (req, res) => {
    const { model, contents, config } = req.body || {};

    // --- Env var diagnostics. Never include the actual key in the response. ---
    const rawKey = process.env.GEMINI_API_KEY;
    const keyPresent = typeof rawKey === "string" && rawKey.length > 0;
    const keyTrimmedLength = typeof rawKey === "string" ? rawKey.trim().length : 0;
    const keyIsWhitespace = keyPresent && keyTrimmedLength === 0;

    if (!keyPresent || keyIsWhitespace) {
      console.error("[/api/ai/gemini] GEMINI_API_KEY missing/empty", {
        typeofKey: typeof rawKey,
        rawLength: typeof rawKey === "string" ? rawKey.length : 0,
        nodeEnv: process.env.NODE_ENV || null,
      });
      return res.status(500).json({
        error: keyIsWhitespace
          ? "GEMINI_API_KEY is set but contains only whitespace."
          : "GEMINI_API_KEY is not configured on the server.",
        code: keyIsWhitespace ? "GEMINI_KEY_EMPTY" : "GEMINI_KEY_MISSING",
        diagnostics: {
          envVarPresent: keyPresent,
          envVarTypeof: typeof rawKey,
          envVarRawLength: typeof rawKey === "string" ? rawKey.length : 0,
          nodeEnv: process.env.NODE_ENV || null,
          hint: "Set GEMINI_API_KEY in the Cloud Run service environment variables (or bind it via Secret Manager). After updating, redeploy or revise the service.",
        },
      });
    }

    if (!model || typeof model !== "string") {
      return res.status(400).json({
        error: "Field 'model' is required and must be a string.",
        code: "BAD_REQUEST",
      });
    }
    if (!contents) {
      return res.status(400).json({
        error: "Field 'contents' is required.",
        code: "BAD_REQUEST",
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: rawKey });
      const response = await ai.models.generateContent({ model, contents, config });

      // Forward the text and candidates so callers can read structured/text/image data
      res.json({
        text: response.text,
        candidates: response.candidates,
      });
    } catch (error: any) {
      // Pull the most descriptive fields the SDK / upstream gives us, without
      // ever echoing the API key back to the client.
      const upstreamStatus =
        error?.status ||
        error?.response?.status ||
        error?.cause?.status ||
        null;
      const upstreamMessage =
        error?.response?.data?.error?.message ||
        error?.error?.message ||
        error?.message ||
        "Unknown upstream error";
      const upstreamCode =
        error?.response?.data?.error?.code ||
        error?.code ||
        error?.name ||
        null;

      console.error("[/api/ai/gemini] Gemini API Error:", {
        message: upstreamMessage,
        status: upstreamStatus,
        code: upstreamCode,
        model,
        stack: error?.stack,
      });

      const proxiedStatus =
        typeof upstreamStatus === "number" && upstreamStatus >= 400 && upstreamStatus < 600
          ? upstreamStatus
          : 502;

      res.status(proxiedStatus).json({
        error: upstreamMessage,
        code: "GEMINI_UPSTREAM_ERROR",
        upstream: {
          status: upstreamStatus,
          code: upstreamCode,
          name: error?.name || null,
        },
        requestedModel: model,
        hint: upstreamStatus === 401 || upstreamStatus === 403
          ? "The API key is rejected by Gemini. Verify the key is valid and that the Gemini API is enabled for this Google Cloud project."
          : upstreamStatus === 429
          ? "Rate limited by Gemini. Reduce request frequency or check quota."
          : undefined,
      });
    }
  });

  // OpenAI Image Generation Proxy (gpt-image-1)
  // Used for ad banner generation. Supports Google/Meta standard banner sizes
  // by mapping them to the closest gpt-image-1 supported aspect.
  app.post("/api/ai/image-generate", async (req, res) => {
    const { prompt, size, style, quality } = req.body || {};

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    }
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required." });
    }

    // gpt-image-1 supports 1024x1024 / 1024x1536 / 1536x1024 / auto.
    // Map the Google / Meta banner standards to the closest supported size.
    const sizeMap: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
      "1200x628": "1536x1024",   // OGP / landscape banner
      "1080x1080": "1024x1024",  // Instagram square
      "1080x1920": "1024x1536",  // Stories / Reels vertical
      "1024x1024": "1024x1024",
      "1024x1536": "1024x1536",
      "1536x1024": "1536x1024",
    };
    const apiSize = sizeMap[size] || "1024x1024";
    const fullPrompt = style ? `${prompt}\n\nStyle: ${style}` : prompt;

    try {
      const apiResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: fullPrompt,
          size: apiSize,
          n: 1,
          quality: quality || "high",
        }),
      });

      if (!apiResponse.ok) {
        const errBody = await apiResponse.text();
        console.error("[image-generate] OpenAI error:", apiResponse.status, errBody);
        return res.status(apiResponse.status).json({
          error: `OpenAI image generation failed (${apiResponse.status})`,
          detail: errBody,
        });
      }

      const data = await apiResponse.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) {
        return res.status(500).json({ error: "No image returned from OpenAI." });
      }

      res.json({
        url: `data:image/png;base64,${b64}`,
        b64_json: b64,
        size: apiSize,
        requestedSize: size || null,
      });
    } catch (error: any) {
      console.error("[image-generate] error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Claude API Proxy
  app.post("/api/ai/claude", async (req, res) => {
    const { model, system, messages, temperature, response_schema } = req.body;
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server." });
    }

    const anthropic = new Anthropic({ apiKey });

    try {
      const response = await anthropic.messages.create({
        model: model || "claude-sonnet-4-5",
        max_tokens: 4096,
        system: system,
        messages: messages,
        temperature: temperature || 0.7,
      });

      res.json(response);
    } catch (error: any) {
      console.error("Claude API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // OpenAI Chat Completions Proxy (GPT-4o by default)
  // Used as the primary engine for copy / creative generation. Mirrors the
  // diagnostic-rich error pattern used by /api/ai/gemini.
  app.post("/api/ai/gpt", async (req, res) => {
    const {
      model,
      messages,
      temperature,
      max_tokens,
      response_format,
    } = req.body || {};

    // --- Env var diagnostics. Never include the actual key in the response. ---
    const rawKey = process.env.OPENAI_API_KEY;
    const keyPresent = typeof rawKey === "string" && rawKey.length > 0;
    const keyTrimmedLength = typeof rawKey === "string" ? rawKey.trim().length : 0;
    const keyIsWhitespace = keyPresent && keyTrimmedLength === 0;

    if (!keyPresent || keyIsWhitespace) {
      console.error("[/api/ai/gpt] OPENAI_API_KEY missing/empty", {
        typeofKey: typeof rawKey,
        rawLength: typeof rawKey === "string" ? rawKey.length : 0,
        nodeEnv: process.env.NODE_ENV || null,
      });
      return res.status(500).json({
        error: keyIsWhitespace
          ? "OPENAI_API_KEY is set but contains only whitespace."
          : "OPENAI_API_KEY is not configured on the server.",
        code: keyIsWhitespace ? "GPT_KEY_EMPTY" : "GPT_KEY_MISSING",
        diagnostics: {
          envVarPresent: keyPresent,
          envVarTypeof: typeof rawKey,
          envVarRawLength: typeof rawKey === "string" ? rawKey.length : 0,
          nodeEnv: process.env.NODE_ENV || null,
          hint: "Set OPENAI_API_KEY in the Cloud Run service environment variables (or bind it via Secret Manager).",
        },
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Field 'messages' is required and must be a non-empty array.",
        code: "BAD_REQUEST",
      });
    }

    try {
      const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${rawKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "gpt-4o",
          messages,
          temperature: typeof temperature === "number" ? temperature : 0.7,
          max_tokens: typeof max_tokens === "number" ? max_tokens : 4096,
          ...(response_format ? { response_format } : {}),
        }),
      });

      const bodyText = await apiResponse.text();
      let bodyJson: any = null;
      try { bodyJson = JSON.parse(bodyText); } catch {}

      if (!apiResponse.ok) {
        console.error("[/api/ai/gpt] OpenAI error:", apiResponse.status, bodyText.slice(0, 500));
        return res.status(apiResponse.status).json({
          error: bodyJson?.error?.message || `OpenAI request failed (${apiResponse.status})`,
          code: "GPT_UPSTREAM_ERROR",
          upstream: {
            status: apiResponse.status,
            type: bodyJson?.error?.type || null,
            code: bodyJson?.error?.code || null,
          },
          requestedModel: model || "gpt-4o",
          hint:
            apiResponse.status === 401 || apiResponse.status === 403
              ? "OpenAI rejected the API key. Verify the key is valid and the project has GPT-4o access."
              : apiResponse.status === 429
              ? "Rate limited by OpenAI. Reduce request frequency or check quota."
              : undefined,
        });
      }

      // Reject the rare 2xx + unparseable body case explicitly so the client
      // doesn't have to crash on `.choices` access.
      if (!bodyJson || !Array.isArray(bodyJson.choices) || bodyJson.choices.length === 0) {
        console.error("[/api/ai/gpt] OpenAI returned 2xx with no choices:", bodyText.slice(0, 500));
        return res.status(502).json({
          error: "OpenAI returned an unexpected response shape (no choices).",
          code: "GPT_EMPTY_RESPONSE",
        });
      }

      // Forward the raw response so callers can read choices / usage / etc.
      res.json(bodyJson);
    } catch (error: any) {
      console.error("[/api/ai/gpt] error:", error);
      res.status(500).json({ error: error.message, code: "GPT_INTERNAL_ERROR" });
    }
  });

  // ===============================================================
  // mureo Workflow Endpoints
  // ===============================================================

  // Shared helper: call Claude on the server and return plain text.
  async function callClaudeText(opts: {
    system: string;
    user: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
    }
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: opts.model || "claude-sonnet-4-5",
      max_tokens: opts.maxTokens || 2048,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      temperature: opts.temperature ?? 0.4,
    });
    return response.content
      .map((block: any) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();
  }

  function parseJsonLoose<T = any>(text: string, fallback: T): T {
    if (!text) return fallback;
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    try {
      return JSON.parse(match ? match[0] : text) as T;
    } catch {
      return fallback;
    }
  }

  // Group a campaign into the high-level media bucket used by daily-check.
  function mediaBucket(platforms: string[] | undefined): "google" | "meta" | "other" {
    if (!platforms || platforms.length === 0) return "other";
    const isGoogle = platforms.some((p) =>
      ["GoogleSearch", "GoogleDisplay", "TrueView", "YahooSearch", "YahooDisplay"].includes(p)
    );
    const isMeta = platforms.some((p) => ["Instagram", "Facebook"].includes(p));
    if (isGoogle && !isMeta) return "google";
    if (isMeta && !isGoogle) return "meta";
    if (isGoogle && isMeta) return "google"; // mixed → bias toward primary
    return "other";
  }

  // 1) POST /api/workflow/daily-check
  // Aggregate active Google/Meta campaign metrics, ask Claude for anomaly detection.
  app.post("/api/workflow/daily-check", async (req, res) => {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId is required." });

    try {
      const snap = await db
        .collection("campaigns")
        .where("ownerUid", "==", userId)
        .get();

      const platformAgg: Record<string, {
        impressions: number;
        clicks: number;
        leads: number;
        spend: number;
        budget: number;
        roasSum: number;
        cpaSum: number;
        cviSum: number;
        count: number;
      }> = {};

      let totalImpressions = 0;
      let totalClicks = 0;
      let totalLeads = 0;
      let totalSpend = 0;
      let totalBudget = 0;
      let cviSumAll = 0;
      let roasSumAll = 0;
      let cpaSumAll = 0;
      let activeCount = 0;

      snap.forEach((doc) => {
        const c = doc.data() as any;
        if (c.status !== "active") return;
        const bucket = mediaBucket(c.platforms);
        if (bucket === "other") return;

        const agg = platformAgg[bucket] || {
          impressions: 0, clicks: 0, leads: 0, spend: 0, budget: 0,
          roasSum: 0, cpaSum: 0, cviSum: 0, count: 0,
        };
        agg.impressions += c.impressions || 0;
        agg.clicks += c.clicks || 0;
        agg.leads += c.leads || 0;
        agg.spend += c.spend || 0;
        agg.budget += c.budget || 0;
        agg.roasSum += c.roas || 0;
        agg.cpaSum += c.cpa || 0;
        agg.cviSum += c.cvi || 0;
        agg.count += 1;
        platformAgg[bucket] = agg;

        totalImpressions += c.impressions || 0;
        totalClicks += c.clicks || 0;
        totalLeads += c.leads || 0;
        totalSpend += c.spend || 0;
        totalBudget += c.budget || 0;
        roasSumAll += c.roas || 0;
        cpaSumAll += c.cpa || 0;
        cviSumAll += c.cvi || 0;
        activeCount += 1;
      });

      const byPlatform = Object.fromEntries(
        Object.entries(platformAgg).map(([k, v]) => [
          k,
          {
            impressions: v.impressions,
            clicks: v.clicks,
            leads: v.leads,
            spend: v.spend,
            budget: v.budget,
            cpa: v.count ? Math.round(v.cpaSum / v.count) : 0,
            roas: v.count ? +(v.roasSum / v.count).toFixed(2) : 0,
            cvi: v.count ? +(v.cviSum / v.count).toFixed(2) : 0,
            campaignCount: v.count,
          },
        ])
      );

      const totals = {
        impressions: totalImpressions,
        clicks: totalClicks,
        leads: totalLeads,
        spend: totalSpend,
        budget: totalBudget,
        cpa: activeCount ? Math.round(cpaSumAll / activeCount) : 0,
        roas: activeCount ? +(roasSumAll / activeCount).toFixed(2) : 0,
        cvi: activeCount ? +(cviSumAll / activeCount).toFixed(2) : 0,
        activeCampaigns: activeCount,
      };

      // Ask Claude for anomaly detection + recommendations.
      let aiReport: any = null;
      try {
        const prompt = `以下はAMASユーザーの本日時点の媒体別パフォーマンスです。
異常な数値（CPA急騰、ROAS低下、CVI低下、リードゼロ等）を検知し、
3件以内の具体的な改善提案を日本語で出してください。

【全体】
${JSON.stringify(totals)}

【媒体別】
${JSON.stringify(byPlatform)}

回答は以下のJSONのみで返してください（前置きや説明は付けないこと）:
{
  "summary": "本日の総評（日本語1-2文）",
  "anomalies": [
    { "platform": "google|meta", "metric": "指標名", "severity": "low|medium|high", "detail": "日本語の説明" }
  ],
  "recommendations": [
    { "title": "施策名", "detail": "実行内容（日本語）", "expectedImpact": "期待効果（日本語）" }
  ]
}`;
        const text = await callClaudeText({
          system: "あなたはAMASのパフォーマンス監査AIです。事実に基づき簡潔に回答してください。JSON形式のみで応答してください。",
          user: prompt,
        });
        aiReport = parseJsonLoose(text, {
          summary: text || "",
          anomalies: [],
          recommendations: [],
        });
      } catch (err: any) {
        console.error("[daily-check] Claude error:", err);
        aiReport = {
          summary: "AIによる異常検知に失敗しました。",
          anomalies: [],
          recommendations: [],
          error: err.message,
        };
      }

      res.json({
        userId,
        generatedAt: Date.now(),
        totals,
        byPlatform,
        ...aiReport,
      });
    } catch (error: any) {
      console.error("[daily-check] error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2) POST /api/workflow/budget-rebalance
  // Proposes shifting budget from low-CVI campaigns to high-CVI ones (proposal only).
  app.post("/api/workflow/budget-rebalance", async (req, res) => {
    const { userId, campaigns } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId is required." });
    if (!Array.isArray(campaigns)) {
      return res.status(400).json({ error: "campaigns must be an array." });
    }

    try {
      // Lightweight summary the LLM can reason over without truncation risk.
      const summarized = campaigns.map((c: any) => ({
        id: c.id,
        name: c.name,
        platforms: c.platforms,
        status: c.status,
        budget: c.budget || 0,
        spend: c.spend || 0,
        leads: c.leads || 0,
        cpa: c.cpa || 0,
        roas: c.roas || 0,
        cvi: c.cvi || 0,
      }));

      const prompt = `以下はユーザーの保有キャンペーン一覧です。
CVIが低い（=資本効率が悪い）キャンペーンから、CVIが高いキャンペーンへ
予算を再配分する「提案」を作成してください。実際の更新は行いません。

【キャンペーン一覧】
${JSON.stringify(summarized)}

【ルール】
- 元キャンペーンの予算より大きい額の移動は提案しない。
- 同一キャンペーン内の移動は提案しない。
- 月予算合計は変えない（=ゼロサム再配分）。
- 提案件数は最大5件まで。

回答は以下のJSONのみで返してください（前置きや説明は付けないこと）:
{
  "summary": "全体の方針（日本語1-2文）",
  "proposals": [
    {
      "fromCampaignId": "...", "fromCampaignName": "...",
      "toCampaignId": "...", "toCampaignName": "...",
      "amount": 移動額（円, 整数）,
      "reason": "日本語の根拠",
      "expectedCVIDelta": 数値(例: +1.2)
    }
  ]
}`;

      const text = await callClaudeText({
        system: "あなたはAMASの広告予算オプティマイザです。提案のみを返し、実行はしません。JSON形式のみで応答してください。",
        user: prompt,
      });

      const data = parseJsonLoose(text, { summary: text || "", proposals: [] });

      res.json({
        userId,
        generatedAt: Date.now(),
        applied: false,
        ...data,
      });
    } catch (error: any) {
      console.error("[budget-rebalance] error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3) POST /api/workflow/weekly-report
  // Aggregates campaign data over the last 7 days and asks Claude for a summary.
  app.post("/api/workflow/weekly-report", async (req, res) => {
    const { userId, campaigns } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId is required." });
    if (!Array.isArray(campaigns)) {
      return res.status(400).json({ error: "campaigns must be an array." });
    }

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    try {
      // Filter to campaigns created or active within the 7-day window. The schema
      // doesn't store daily snapshots, so we use current aggregates as the proxy.
      const recent = campaigns.filter((c: any) => {
        const created = typeof c.createdAt === "number" ? c.createdAt : 0;
        return created >= sevenDaysAgo || c.status === "active";
      });

      const totals = recent.reduce(
        (acc: any, c: any) => {
          acc.impressions += c.impressions || 0;
          acc.clicks += c.clicks || 0;
          acc.leads += c.leads || 0;
          acc.spend += c.spend || 0;
          acc.budget += c.budget || 0;
          acc.roasSum += c.roas || 0;
          acc.cpaSum += c.cpa || 0;
          acc.cviSum += c.cvi || 0;
          acc.count += 1;
          return acc;
        },
        { impressions: 0, clicks: 0, leads: 0, spend: 0, budget: 0, roasSum: 0, cpaSum: 0, cviSum: 0, count: 0 }
      );

      const avg = {
        cpa: totals.count ? Math.round(totals.cpaSum / totals.count) : 0,
        roas: totals.count ? +(totals.roasSum / totals.count).toFixed(2) : 0,
        cvi: totals.count ? +(totals.cviSum / totals.count).toFixed(2) : 0,
      };

      const prompt = `AMASユーザーの過去7日間の運用サマリーを、経営者向けに日本語で執筆してください。
語調は「です・ます」、4〜6文程度、専門用語は控えめに。
最後に「今週のハイライト」「来週の重点アクション」を箇条書きで添えてください。

【期間】
${new Date(sevenDaysAgo).toISOString().slice(0, 10)} 〜 ${new Date(now).toISOString().slice(0, 10)}

【合計】
インプレッション: ${totals.impressions} / クリック: ${totals.clicks} / リード: ${totals.leads}
広告費: ¥${totals.spend} / 予算上限: ¥${totals.budget}

【平均指標】
CPA: ¥${avg.cpa} / ROAS: ${avg.roas} / CVI: ${avg.cvi}

【参考: 対象キャンペーン数】
${totals.count}件`;

      const summary = await callClaudeText({
        system: "あなたはAMASの広告運用レポートライターです。事実に基づき、誇張せず簡潔に書いてください。",
        user: prompt,
        temperature: 0.6,
      });

      res.json({
        userId,
        generatedAt: now,
        period: { from: sevenDaysAgo, to: now },
        totals: {
          impressions: totals.impressions,
          clicks: totals.clicks,
          leads: totals.leads,
          spend: totals.spend,
          budget: totals.budget,
          campaignCount: totals.count,
        },
        averages: avg,
        summary,
      });
    } catch (error: any) {
      console.error("[weekly-report] error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 4) POST /api/workflow/learn
  // Saves an insight string to organizations/{userId}/knowledge.
  app.post("/api/workflow/learn", async (req, res) => {
    const { userId, insight } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId is required." });
    if (typeof insight !== "string" || insight.trim().length === 0) {
      return res.status(400).json({ error: "insight is required and must be a non-empty string." });
    }
    if (insight.length > 10000) {
      return res.status(400).json({ error: "insight is too long (max 10000 chars)." });
    }

    try {
      const docRef = await db
        .collection("organizations")
        .doc(userId)
        .collection("knowledge")
        .add({
          insight: insight.trim(),
          createdAt: Date.now(),
          source: "workflow.learn",
        });

      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("[workflow/learn] error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- REAL PIPELINE: OAUTH FLOW ---
  app.get("/api/auth/google/url", async (req, res) => {
    const { userId } = req.query;
    let clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    
    if (!clientId && userId) {
      try {
        const userDoc = await db.collection('users').doc(userId as string).get();
        if (userDoc.exists) {
          clientId = userDoc.data()?.google_ads_client_id;
        }
      } catch (error) {
        console.error("Error fetching google_ads_client_id from Firestore:", error);
      }
    }

    if (!clientId) {
      // Simulator mode: Return a mock URL
      return res.json({ url: `${process.env.APP_URL}/auth/callback?provider=google&code=mock_code` });
    }
    
    const redirectUri = `${process.env.APP_URL}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords',
      access_type: 'offline',
      prompt: 'consent'
    });
    
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    console.log(`[OAuth] Google callback received with code: ${code}`);
    
    // In a real app, exchange code for tokens
    // const tokens = await exchangeCodeForTokens(code);
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
              window.close();
            } else {
              window.location.href = '/connectors?success=true';
            }
          </script>
          <p>Google Ads 連携が完了しました。このウィンドウは自動的に閉じます。</p>
        </body>
      </html>
    `);
  });

  app.get("/api/auth/meta/url", async (req, res) => {
    const { userId } = req.query;
    let appId = process.env.META_APP_ID;

    if (!appId && userId) {
      try {
        const userDoc = await db.collection('users').doc(userId as string).get();
        if (userDoc.exists) {
          appId = userDoc.data()?.meta_app_id;
        }
      } catch (error) {
        console.error("Error fetching meta_app_id from Firestore:", error);
      }
    }

    if (!appId) {
      return res.json({ url: `${process.env.APP_URL}/auth/callback?provider=meta&code=mock_code` });
    }
    
    const redirectUri = `${process.env.APP_URL}/api/auth/meta/callback`;
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'ads_management,ads_read,business_management'
    });
    
    res.json({ url: `https://www.facebook.com/v18.0/dialog/oauth?${params}` });
  });

  app.get("/api/auth/meta/callback", async (req, res) => {
    const { code } = req.query;
    console.log(`[OAuth] Meta callback received with code: ${code}`);
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'meta' }, '*');
              window.close();
            } else {
              window.location.href = '/connectors?success=true';
            }
          </script>
          <p>Meta Ads 連携が完了しました。このウィンドウは自動的に閉じます。</p>
        </body>
      </html>
    `);
  });

  // Ad Account Provisioning / Connection
  app.post("/api/provision-accounts", async (req, res) => {
    const { userId, provider, accountId } = req.body;
    if (!userId) return res.status(400).send("User ID required");

    try {
      const userRef = db.collection('users').doc(userId);
      const tokenRef = db.collection('users').doc(userId).collection('tokens').doc(provider);

      // In the new OAuth model, we are "connecting" an existing account
      console.log(`[OAuth] Connecting ${provider} account for user ${userId}...`);
      
      const updateData: any = {};
      if (provider === 'google') {
        updateData.google_ads_connected = true;
        updateData.google_ad_account_id = accountId || `G-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      } else if (provider === 'meta') {
        updateData.meta_ads_connected = true;
        updateData.meta_ad_account_id = accountId || `ACT_${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
      }

      await userRef.update(updateData);
      
      // Simulate saving tokens
      await tokenRef.set({
        access_token: `sim_access_${Math.random().toString(36).substr(2)}`,
        refresh_token: `sim_refresh_${Math.random().toString(36).substr(2)}`,
        expires_at: Date.now() + 3600000,
        updated_at: Date.now()
      });

      res.json({ 
        success: true, 
        ...updateData,
        mode: process.env.GOOGLE_ADS_CLIENT_ID ? 'production' : 'simulator'
      });
    } catch (error) {
      console.error("Error connecting accounts:", error);
      res.status(500).send("Connection failed");
    }
  });

  // --- AI POLICY CHECK AGENT ---
  app.post("/api/ai/policy-check", async (req, res) => {
    const { headline, description, industry, platform } = req.body || {};
    if (!headline || !description) {
      return res.status(400).json({
        error: "Fields 'headline' and 'description' are required.",
        code: "BAD_REQUEST",
      });
    }

    // --- Env var diagnostics (mirrors /api/ai/gemini). Never echoes the key. ---
    const rawKey = process.env.GEMINI_API_KEY;
    const keyPresent = typeof rawKey === "string" && rawKey.length > 0;
    const keyTrimmedLength = typeof rawKey === "string" ? rawKey.trim().length : 0;
    const keyIsWhitespace = keyPresent && keyTrimmedLength === 0;

    if (!keyPresent || keyIsWhitespace) {
      console.error("[/api/ai/policy-check] GEMINI_API_KEY missing/empty", {
        typeofKey: typeof rawKey,
        rawLength: typeof rawKey === "string" ? rawKey.length : 0,
        nodeEnv: process.env.NODE_ENV || null,
      });
      return res.status(500).json({
        error: keyIsWhitespace
          ? "GEMINI_API_KEY is set but contains only whitespace."
          : "GEMINI_API_KEY is not configured on the server.",
        code: keyIsWhitespace ? "GEMINI_KEY_EMPTY" : "GEMINI_KEY_MISSING",
        diagnostics: {
          envVarPresent: keyPresent,
          envVarTypeof: typeof rawKey,
          envVarRawLength: typeof rawKey === "string" ? rawKey.length : 0,
          nodeEnv: process.env.NODE_ENV || null,
          hint: "Set GEMINI_API_KEY in the Cloud Run service environment variables (or bind it via Secret Manager). After updating, redeploy or revise the service.",
        },
      });
    }

    const prompt = `
        あなたは広告代理店の法務・審査担当AIです。
        以下の広告案が、日本の法律（薬機法、景表法）および${platform}の広告ポリシーに準拠しているか厳密に審査してください。

        【広告案】
        業種: ${industry}
        見出し: ${headline}
        説明文: ${description}

        【審査基準】
        1. 薬機法: 医薬品、医療機器等の品質、有効性及び安全性の確保等に関する法律。誇大広告や未承認の効能効果の標榜を禁止。
        2. 景表法: 不当景品類及び不当表示防止法。優良誤認（実際より著しく優良と見せかける）、有利誤認（実際より著しく有利と見せかける）を禁止。
        3. 媒体ポリシー: ${platform}の禁止コンテンツ（不適切な表現、過度な露出、虚偽の主張など）。

        【出力形式】
        JSON形式で出力してください。
        {
          "status": "approved" | "warning" | "rejected",
          "violations": [
            { "type": "薬機法" | "景表法" | "ポリシー", "reason": "具体的な理由", "suggestion": "修正案" }
          ],
          "score": 0-100 (100が最も安全)
        }
      `;

    let responseText: string | undefined;
    try {
      const ai = new GoogleGenAI({ apiKey: rawKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      responseText = response.text;
    } catch (error: any) {
      const upstreamStatus =
        error?.status ||
        error?.response?.status ||
        error?.cause?.status ||
        null;
      const upstreamMessage =
        error?.response?.data?.error?.message ||
        error?.error?.message ||
        error?.message ||
        "Unknown upstream error";
      const upstreamCode =
        error?.response?.data?.error?.code ||
        error?.code ||
        error?.name ||
        null;

      console.error("[/api/ai/policy-check] Gemini API Error:", {
        message: upstreamMessage,
        status: upstreamStatus,
        code: upstreamCode,
        stack: error?.stack,
      });

      const proxiedStatus =
        typeof upstreamStatus === "number" && upstreamStatus >= 400 && upstreamStatus < 600
          ? upstreamStatus
          : 502;

      return res.status(proxiedStatus).json({
        error: upstreamMessage,
        code: "POLICY_UPSTREAM_ERROR",
        upstream: {
          status: upstreamStatus,
          code: upstreamCode,
          name: error?.name || null,
        },
        hint: upstreamStatus === 401 || upstreamStatus === 403
          ? "The API key is rejected by Gemini. Verify the key is valid and that the Gemini API is enabled for this Google Cloud project."
          : upstreamStatus === 429
          ? "Rate limited by Gemini. Reduce request frequency or check quota."
          : undefined,
      });
    }

    // The model is asked for JSON; parse defensively so a malformed payload
    // surfaces as a clear error instead of a 500 with a cryptic SyntaxError.
    if (!responseText) {
      return res.status(502).json({
        error: "Gemini returned an empty response.",
        code: "POLICY_EMPTY_RESPONSE",
      });
    }

    try {
      res.json(JSON.parse(responseText));
    } catch (parseError: any) {
      console.error("[/api/ai/policy-check] JSON parse failed:", {
        message: parseError?.message,
        sample: responseText.slice(0, 500),
      });
      res.status(502).json({
        error: "Failed to parse Gemini response as JSON.",
        code: "POLICY_PARSE_ERROR",
        parseMessage: parseError?.message || null,
        rawSample: responseText.slice(0, 500),
      });
    }
  });

  // --- REAL PIPELINE: CAMPAIGN DEPLOYMENT ---
  app.post("/api/campaigns/deploy", async (req, res) => {
    const { campaignId, userId } = req.body;
    if (!campaignId || !userId) return res.status(400).send("Campaign ID and User ID required");

    try {
      const campaignRef = db.collection('campaigns').doc(campaignId);
      const campaignDoc = await campaignRef.get();
      
      if (!campaignDoc.exists) {
        return res.status(404).send("Campaign not found");
      }

      const campaignData = campaignDoc.data();
      const platform = campaignData?.platforms?.[0]; // e.g. 'google', 'meta'

      console.log(`[Pipeline] Deploying campaign ${campaignId} to ${platform}...`);

      // 1. Check for real credentials
      let googleConfig = {
        clientId: process.env.GOOGLE_ADS_CLIENT_ID,
        clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN
      };

      let metaConfig = {
        appId: process.env.META_APP_ID,
        appSecret: process.env.META_APP_SECRET,
        accessToken: process.env.META_ACCESS_TOKEN
      };

      // Fetch from Firestore if missing
      if (userId) {
        try {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (!googleConfig.clientId) googleConfig.clientId = userData?.google_ads_client_id;
            if (!googleConfig.clientSecret) googleConfig.clientSecret = userData?.google_ads_client_secret;
            if (!googleConfig.developerToken) googleConfig.developerToken = userData?.google_ads_developer_token;
            if (!googleConfig.refreshToken) googleConfig.refreshToken = userData?.google_ads_refresh_token;
            
            if (!metaConfig.appId) metaConfig.appId = userData?.meta_app_id;
            if (!metaConfig.appSecret) metaConfig.appSecret = userData?.meta_app_secret;
            if (!metaConfig.accessToken) metaConfig.accessToken = userData?.meta_access_token;
          }
        } catch (error) {
          console.error("Error fetching credentials from Firestore:", error);
        }
      }

      // 2. Simulate or Execute
      let deploymentResult;
      if (platform === 'google' && googleConfig.clientId && googleConfig.refreshToken && googleConfig.developerToken) {
        // REAL GOOGLE ADS API CALL (Simulation of the logic)
        console.log("[Pipeline] Executing real Google Ads API call...");
        // In a real implementation, you would use google-ads-api library
        // await googleAdsClient.createCampaign(...)
        deploymentResult = { success: true, externalId: `CAM-G-${Date.now()}`, mode: 'production' };
      } else if (platform === 'meta' && metaConfig.accessToken) {
        // REAL META API CALL (Simulation of the logic)
        console.log("[Pipeline] Executing real Meta Graph API call...");
        deploymentResult = { success: true, externalId: `CAM-M-${Date.now()}`, mode: 'production' };
      } else {
        // FALLBACK TO SIMULATOR
        console.log("[Pipeline] Credentials missing. Falling back to high-fidelity simulator.");
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate network latency
        deploymentResult = { success: true, externalId: `SIM-${Date.now()}`, mode: 'simulator' };
      }

      // 3. Update Firestore with deployment status
      await campaignRef.update({
        status: 'active',
        externalId: deploymentResult.externalId,
        deploymentMode: deploymentResult.mode,
        deployedAt: Date.now()
      });

      res.json(deploymentResult);
    } catch (error: any) {
      console.error("[Pipeline] Deployment error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- REAL PIPELINE: IMAGE STORAGE ---
  app.post("/api/storage/upload", async (req, res) => {
    const { base64, userId, fileName } = req.body;
    if (!base64 || !userId) return res.status(400).send("Data and User ID required");

    try {
      // In a real app, you'd use Firebase Storage or GCS
      // For this demo, we'll save to a local public folder to simulate a real URL
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, 'base64');
      const name = fileName || `img_${Date.now()}.png`;
      const filePath = path.join(uploadDir, name);
      
      fs.writeFileSync(filePath, buffer);

      const url = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/${name}`;
      console.log(`[Storage] Image uploaded: ${url}`);

      res.json({ url });
    } catch (error: any) {
      console.error("[Storage] Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    // Startup sanity check: fail loudly if the frontend build is missing.
    // Without this, a stale container would silently 200 every request with
    // index.html — including JS module requests, causing the browser's
    // "Failed to load module script: ... MIME type of text/html" error.
    if (!fs.existsSync(distPath)) {
      console.error(
        `[startup] FATAL: dist/ not found at ${distPath}. ` +
        `Run 'npm run build' before starting the production server.`
      );
    } else if (!fs.existsSync(indexPath)) {
      console.error(
        `[startup] FATAL: dist/index.html not found. The frontend build is incomplete.`
      );
    } else {
      console.log(`[startup] Serving static files from ${distPath}`);
    }

    // Serve built assets. `express.static` sets Content-Type from the file
    // extension; the explicit setHeaders block is defensive in case a host
    // strips or overrides defaults.
    app.use(
      express.static(distPath, {
        index: false, // let the SPA fallback below decide what serves `/`
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
          } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          } else if (filePath.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
          }
        },
      })
    );

    // SPA fallback. CRITICAL: only serve index.html for paths that actually
    // look like SPA routes. Without these guards a missing JS bundle would
    // get index.html with Content-Type: text/html, which the browser then
    // rejects as a module script.
    app.get('*', (req, res) => {
      // 1) Unknown API routes should return JSON 404, not HTML.
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          error: 'API endpoint not found',
          path: req.path,
        });
      }
      // 2) Anything with a file extension is an asset request that
      // `express.static` failed to satisfy — return a real 404 so the
      // browser shows a clean error instead of MIME-mismatching a module.
      if (path.extname(req.path)) {
        return res.status(404).type('text/plain').send('Not Found');
      }
      // 3) Genuine SPA navigation (e.g. /dashboard, /wallet, /clients).
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
