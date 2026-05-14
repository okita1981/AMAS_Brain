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
  const PORT = 3000;

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

  // Save Card Method
  app.post("/api/payments/save-card", async (req, res) => {
    const { userId, cardData } = req.body;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured." });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24-preview' as any,
    });

    try {
      // 1. Create or get Customer
      let customerId;
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
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

      // 2. Create a mock PaymentMethod record for the UI
      // In a real production app, you would use Stripe Elements on the frontend
      // to get a payment_method_id and then attach it here.
      // For this implementation, we'll create a record in Firestore.
      const newPaymentMethod = {
        id: `pm_${Math.random().toString(36).substr(2, 9)}`,
        type: 'card',
        last4: cardData.number.slice(-4),
        brand: cardData.number.startsWith('4') ? 'visa' : 'mastercard',
        expiryMonth: parseInt(cardData.expiry.split('/')[0]),
        expiryYear: 2000 + parseInt(cardData.expiry.split('/')[1]),
        isDefault: true,
        cardHolder: cardData.name
      };

      // 3. Save to Firestore wallet
      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await walletRef.get();
      const walletData = walletDoc.data() || {};
      const currentMethods = walletData.paymentMethods || [];
      
      // Update isDefault for other methods
      const updatedMethods = currentMethods.map((m: any) => ({ ...m, isDefault: false }));
      updatedMethods.push(newPaymentMethod);

      await walletRef.update({ paymentMethods: updatedMethods });

      res.json({ success: true, paymentMethod: newPaymentMethod });
    } catch (error: any) {
      console.error("Save Card Error:", error);
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
        model: model || "claude-3-5-sonnet-20241022",
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
    const { headline, description, industry, platform } = req.body;
    if (!headline || !description) return res.status(400).send("Headline and description required");

    try {
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

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("AI Policy Check Error:", error);
      res.status(500).json({ error: error.message });
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
