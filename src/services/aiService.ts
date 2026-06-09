import { Type } from "@google/genai";
import { AgentType, MarketingTask, IndustryType, StrategicPlan, AIAdvice, PlatformType, AdContent, PlanType, AdCensorshipResult, BannerDesignPreset, BannerType, Campaign, KeywordSuggestion, Draft, DraftSummary, DraftStatus } from "../types";

// Gemini is now invoked via the backend proxy at /api/ai/gemini so the API key
// never reaches the browser. `Type` from @google/genai is just an enum of plain
// strings used to construct responseSchema — safe to keep in the bundle.
interface GeminiProxyResponse {
  text?: string;
  candidates?: any[];
}

async function callGemini(params: {
  model: string;
  contents: any;
  config?: any;
}): Promise<GeminiProxyResponse> {
  const response = await fetch("/api/ai/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let message = "Failed to call Gemini API";
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export interface AdSuggestions {
  headlines: { text: string; length: 'short' | 'medium' | 'long'; platform: string }[];
  descriptions: { text: string; length: 'short' | 'medium' | 'long'; platform: string }[];
  ctas: string[];
  keywords: string[];
}

// Helper to call Claude via Backend
async function callClaude(params: {
  model?: string;
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  temperature?: number;
}) {
  const response = await fetch("/api/ai/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to call Claude API");
  }

  return response.json();
}

// Helper to call GPT-4o via Backend. Returns the raw OpenAI Chat Completion
// response. Read the assistant text via `getGPTText(result)` so empty / null
// content surfaces as a typed error instead of crashing on `.match` / `.map`.
async function callGPT(params: {
  model?: string;
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}): Promise<{ choices: Array<{ message: { role: string; content: string | null } }> }> {
  const openaiMessages: { role: string; content: string }[] = [];
  if (params.system) openaiMessages.push({ role: 'system', content: params.system });
  openaiMessages.push(...params.messages);

  // Only include keys when they have a value — `JSON.stringify` already drops
  // `undefined` props, but being explicit guards against future refactors that
  // might serialise via a different path.
  const body: Record<string, unknown> = {
    model: params.model || 'gpt-4o',
    messages: openaiMessages,
  };
  if (typeof params.temperature === 'number') body.temperature = params.temperature;
  if (typeof params.max_tokens === 'number') body.max_tokens = params.max_tokens;
  if (params.response_format) body.response_format = params.response_format;

  const response = await fetch("/api/ai/gpt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Failed to call GPT API (HTTP ${response.status})`;
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }

  const data = await response.json();

  // Validate response shape so each caller doesn't have to. Failures here are
  // caught by the per-function try/catch and trigger the Gemini fallback.
  if (!data || typeof data !== 'object') {
    throw new Error("GPT API returned an empty body.");
  }
  if (!Array.isArray((data as any).choices) || (data as any).choices.length === 0) {
    throw new Error("GPT API response is missing 'choices'.");
  }
  return data;
}

// Safely pull the assistant text out of a chat-completion response. Throws
// when the model returned no usable content so the caller's try/catch can
// route to the Gemini fallback.
function getGPTText(result: { choices: Array<{ message: { content: string | null } }> }): string {
  const choice = result?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error("GPT returned no text content.");
  }
  return content;
}

export async function generateAdSuggestions(
  industry: string,
  goal: string,
  plan: PlanType = 'Free',
  businessDescription?: string
): Promise<AdSuggestions> {
  const prompt = `
    AMAS 広告クリエイティブ生成エンジン
    業種/コンテキスト: ${industry}
    最適化ゴール: ${goal}
    商材詳細: ${businessDescription || '未設定'}
    
    上記の情報に基づき、CVI（成約速度）を最大化するための広告コピー案を生成してください。
    
    制約事項:
    1. 見出し案は、Google検索広告（30文字以内）、Meta広告（インパクト重視）など、媒体特性に合わせたものを生成してください。
    2. 説明文/本文案は、短文（80文字以内）と長文（ストーリー重視）の両方を生成してください。
    3. CTA（Call to Action）案は、ユーザーの行動を促す短く強力なフレーズ（例：今すぐ予約、無料相談はこちら、資料請求する等）を5つ生成してください。
    4. キーワード案は、検索意図が明確で成約に近いものを5つ以上挙げてください。
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "headlines": [
        { "text": "見出しテキスト", "length": "short/medium/long", "platform": "推奨媒体名" },
        ...
      ],
      "descriptions": [
        { "text": "説明文テキスト", "length": "short/medium/long", "platform": "推奨媒体名" },
        ...
      ],
      "ctas": ["CTA1", "CTA2", ...],
      "keywords": ["キーワード1", "キーワード2", ...]
    }
  `;

  // GPT-4o is the primary engine for copy/creative generation. Gemini is the fallback.
  try {
    const result = await callGPT({
      model: "gpt-4o",
      system: "あなたはプロの広告運用エージェントです。JSON形式のみで回答してください。",
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = getGPTText(result);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content) as AdSuggestions;
  } catch (error) {
    console.warn("GPT-4o failed, falling back to Gemini:", error);
    // Continue to Gemini logic below
  }

  // Gemini fallback
  const response = await callGemini({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headlines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                length: { type: Type.STRING, enum: ["short", "medium", "long"] },
                platform: { type: Type.STRING }
              },
              required: ["text", "length", "platform"]
            }
          },
          descriptions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                length: { type: Type.STRING, enum: ["short", "medium", "long"] },
                platform: { type: Type.STRING }
              },
              required: ["text", "length", "platform"]
            }
          },
          ctas: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["headlines", "descriptions", "ctas", "keywords"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as AdSuggestions;
}

export async function getAIAdvice(
  platform: PlatformType,
  content: AdContent,
  industry: IndustryType,
  plan: PlanType = 'Free'
): Promise<AIAdvice> {
  const prompt = `
    AMAS 広告診断エンジン
    業種: ${industry}
    対象媒体: ${platform}
    見出し: ${content.headline}
    説明文/本文: ${content.description || content.body}
    画像URL: ${content.imageUrl || "なし"}
    
    この広告クリエイティブについて、以下の観点で診断してください。
    1. 媒体との相性（例：Google検索ならキーワード適合性、Metaならビジュアルの引き）
    2. CVI（成約速度）の観点からの改善アドバイス
    3. 他の媒体と比較した際の特徴
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "score": 0-100の期待効果スコア,
      "comment": "具体的なアドバイス（日本語）",
      "platformComparison": "他媒体との比較コメント（例：Googleよりもインスタ向き、など）"
    }
  `;

  // GPT-4o is the primary engine for copy/creative generation. Gemini is the fallback.
  try {
    const result = await callGPT({
      model: "gpt-4o",
      system: "あなたは広告診断の専門家です。JSON形式のみで回答してください。",
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    const resContent = getGPTText(result);
    const jsonMatch = resContent.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : resContent) as AIAdvice;
  } catch (error) {
    console.warn("GPT-4o failed, falling back to Gemini:", error);
  }

  const response = await callGemini({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          comment: { type: Type.STRING },
          platformComparison: { type: Type.STRING }
        },
        required: ["score", "comment", "platformComparison"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as AIAdvice;
}

export async function generateMarketingContent(
  type: AgentType, 
  industry: IndustryType,
  context: string,
  plan: PlanType = 'Free'
): Promise<Partial<MarketingTask>> {
  console.log(`[aiService] generateMarketingContent called for type: ${type}, industry: ${industry}, plan: ${plan}`);

  const industryContext: Record<string, string> = {
    Dental: "歯科医院（インプラント、矯正、ホワイトニング、地域密着型SEO）",
    WasteRemoval: "不用品回収（即日対応、遺品整理、格安、エリア特化）",
    General: "一般的なマーケティング"
  };

  const indText = industryContext[industry] || industry || "一般的なマーケティング";

  const prompts = {
    SEO: `AMAS SEOエージェントとして、以下のコンテキストに基づき、利用者のメインサイトを一切変更せずに、外側に構築する「CVI特化型サテライトページ」の構成案および、実際のHTML/CSSコードを日本語で生成してください。
    
    【コンテキスト】
    業種: ${indText}
    ${context}
    
    【生成ガイドライン】
    1. サテライトページの目的: 特定の検索意図（悩みや欲求）を持つユーザーを捕まえ、メインサイトへと送客すること。
    2. メインサイトへの誘導: コンテキストに含まれる「送客先URL」を、ページ内の主要なボタン（CTA）のリンク先として必ず使用してください。
    3. 商材の訴求: 「商材詳細」の情報を元に、ユーザーのベネフィットを強調したコンテンツを作成してください。
    4. デザイン: Tailwind CSSをCDN経由で使用した、モダンで成約率の高いLPデザイン。
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "title": "サテライトページ展開案: [ターゲットキーワード]",
      "content": "このページがどのようにメインサイトへの成約（CVI）を加速させるかの戦略説明",
      "metadata": {
        "targetKeywords": ["キーワード1 (CVIスコア)", "キーワード2"],
        "satelliteUrl": "amas-net.jp/lp/[unique-id]",
        "htmlContent": "<!DOCTYPE html><html>...</html> (Tailwind CSSをCDN経由で使用した、モダンで成約率の高いLPのHTMLコード。メインサイトへの誘導ボタンを必ず含むこと)",
        "cssContent": "/* 追加のカスタムCSSがあれば */",
        "pageStructure": {
          "hero": "キャッチコピー案",
          "problem": "ユーザーの悩みへの共感",
          "solution": "メインサイトへの誘導（ベネフィット提示）",
          "cta": "メインサイトへのボタン"
        }
      }
    }
    `,
    Ads: `AMAS Adsエージェントとして、以下のコンテキストに基づき、CVI（成約速度）を最大化するための広告運用プランを日本語で生成してください。
    
    【コンテキスト】
    業種: ${indText}
    ${context}
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "title": "Ads運用最適化案: ${indText}",
      "content": "CVIを最大化するための媒体選定と入札戦略の説明",
      "metadata": {
        "platforms": ["Google Ads", "Meta Ads"],
        "targetAudience": "ターゲット層の詳細",
        "heroSection": "メインの訴求メッセージ",
        "ctaButton": "推奨されるCTA文言",
        "searchIntent": "狙うべき検索意図"
      }
    }
    `,
    LPO: `AMAS LPOエージェントとして、既存のLP（またはサテライトページ）の成約率を向上させ、CVIを加速させるための改善案を日本語で生成してください。
    
    【コンテキスト】
    業種: ${indText}
    ${context}
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "title": "LPO改善案: ${indText}",
      "content": "現在の課題分析と、成約率向上のための具体的な修正提案",
      "metadata": {
        "trigger": "ユーザーが離脱しているポイントと対策",
        "steps": ["改善ステップ1", "改善ステップ2", "改善ステップ3"]
      }
    }
    `,
    CRM: `AMAS CRMエージェントとして、LINE公式アカウント等でのステップ配信を自動化し、成約までのリードタイムを短縮するためのシナリオ案を日本語で生成してください。
    
    【コンテキスト】
    業種: ${indText}
    ${context}
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "title": "CRM自動化シナリオ: ${indText}",
      "content": "リード獲得から成約までの自動フォローアップ戦略",
      "metadata": {
        "trigger": "配信開始のトリガー（例：資料請求、友だち追加）",
        "steps": ["1日目: 挨拶とベネフィット提示", "3日目: 成功事例の紹介", "7日目: 限定オファーの提示"]
      }
    }
    `
  };

  const prompt = prompts[type];
  let generatedData;

  // GPT-4o is the primary engine for copy/creative generation. Gemini is the fallback.
  try {
    const result = await callGPT({
      model: "gpt-4o",
      system: "あなたはマーケティングの専門家です。JSON形式のみで回答してください。",
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    const resContent = getGPTText(result);
    const jsonMatch = resContent.match(/\{[\s\S]*\}/);
    generatedData = JSON.parse(jsonMatch ? jsonMatch[0] : resContent);
  } catch (error) {
    console.warn("GPT-4o failed, falling back to Gemini:", error);
  }

  if (!generatedData) {
    try {
      const response = await callGemini({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              metadata: {
                type: Type.OBJECT,
                properties: {
                  targetKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  satelliteUrl: { type: Type.STRING },
                  htmlContent: { type: Type.STRING },
                  cssContent: { type: Type.STRING },
                  pageStructure: { type: Type.OBJECT },
                  searchIntent: { type: Type.STRING },
                  platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  targetAudience: { type: Type.STRING },
                  heroSection: { type: Type.STRING },
                  ctaButton: { type: Type.STRING },
                  trigger: { type: Type.STRING },
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: []
              }
            },
            required: ["title", "content"]
          }
        }
      });
      generatedData = JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini generation failed:", error);
      throw error;
    }
  }

  const content = generatedData.content || "コンテンツの生成に失敗しました";
  const safetyCheckPrompt = `
    AMAS検閲エンジン: 以下のコンテンツがブランドガイドラインおよび禁止語句に抵触していないか、また「経営者のパートナー」として適切なトーンかセルフチェックしてください。
    内容: ${content}
    JSON形式で回答: { "score": 0-100, "feedback": "日本語フィードバック" }
  `;

  let safetyData;
  try {
    // GPT-4o is the primary safety engine. Gemini is the fallback.
    try {
      const result = await callGPT({
        model: "gpt-4o",
        system: "あなたはコンテンツ検閲エンジンです。JSON形式のみで回答してください。",
        messages: [{ role: 'user', content: safetyCheckPrompt }],
        response_format: { type: 'json_object' },
      });
      const resContent = getGPTText(result);
      const jsonMatch = resContent.match(/\{[\s\S]*\}/);
      safetyData = JSON.parse(jsonMatch ? jsonMatch[0] : resContent);
    } catch (gptErr) {
      console.warn("GPT-4o safety check failed, falling back to Gemini:", gptErr);
      const safetyResponse = await callGemini({
        model: "gemini-2.5-flash",
        contents: safetyCheckPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["score", "feedback"]
          }
        }
      });
      safetyData = JSON.parse(safetyResponse.text || '{"score": 50, "feedback": "チェック失敗"}');
    }
  } catch (error) {
    console.warn("Safety check failed, using default values:", error);
    safetyData = { score: 70, feedback: "自動チェックがスキップされました。" };
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    agentId: '1',
    type,
    title: generatedData.title || `AMAS ${type}最適化: ${context.substring(0, 20)}...`,
    content,
    status: 'pending',
    createdAt: Date.now(),
    brandSafetyScore: safetyData.score,
    safetyFeedback: safetyData.feedback,
    metadata: generatedData.metadata || {}
  };
}

export async function getOrchestrationPlan(
  industry: string,
  budget: string,
  channels: string[],
  plan: PlanType = 'Free'
): Promise<StrategicPlan> {
  const prompt = `
    AMAS Optimization Engine
    業種: ${industry}
    月予算: ${budget}
    チャネル: ${channels.join(", ")}
    
    CVI (Capital Velocity Index = 利益 / (広告費 * 成約日数)) を最大化するための戦略を立案してください。
    
    以下の3つのフェーズで回答してください。
    1. 【分析フェーズ】各媒体で「何を見るべきか（Spend, Impressions, Clicks, Conversions, Days_to_Conversion等）」のリスト。
    2. 【戦略フェーズ】CVIを最大化するための媒体配分シナリオ。LINE等のステップ配信での自動化提案も含む。
    3. 【実行フェーズ】外部ツール(Make.com/n8n)へ渡すための初期設定用JSONパケット。
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "analysis": ["分析ポイント1", "分析ポイント2", ...],
      "strategy": "戦略の詳細テキスト（日本語）",
      "cviProjection": 0-100の予測値,
      "webhookPayload": {
        "action": "AMAS_INITIAL_SETUP",
        "industry": "${industry}",
        "budget": ${parseInt(budget.replace(/[^0-9]/g, "")) || 0},
        "optimization_goal": "MAXIMIZE_CVI",
        "campaigns": [
          { "platform": "GOOGLE_ADS", "budget_allocation": 0.5, "focus": "HIGH_INTENT_KW" },
          ...
        ]
      }
    }
  `;

  // Claude is the primary engine for all plans. Gemini is the fallback.
  try {
    const result = await callClaude({
      model: "claude-sonnet-4-5",
      system: "あなたは戦略立案の専門家です。JSON形式で回答してください。",
      messages: [{ role: 'user', content: prompt }]
    });
    const resContent = result.content[0].text;
    const jsonMatch = resContent.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : resContent) as StrategicPlan;
  } catch (error) {
    console.warn("Claude API failed, falling back to Gemini:", error);
  }

  const response = await callGemini({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.ARRAY, items: { type: Type.STRING } },
          strategy: { type: Type.STRING },
          cviProjection: { type: Type.NUMBER },
          webhookPayload: { type: Type.OBJECT }
        },
        required: ["analysis", "strategy", "cviProjection", "webhookPayload"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as StrategicPlan;
}

export async function getHelpResponse(query: string, plan: PlanType = 'Free'): Promise<string> {
  const systemInstruction = `
あなたはAMAS（Autonomous Marketing Agent System）の公式サポートAIです。
以下のAMASの正確な情報をもとに回答してください。

---

■ AMASとは
広告運用を自律型AIに委任するSaaSです。
ユーザーはWalletに広告予算をチャージし、
AIが24時間365日自動で広告を最適化します。
手数料ゼロで、チャージした全額が媒体に投入されます。

■ 独自指標CVI（Capital Velocity Index）
CVI = 利益 ÷（広告費 × 成約までの日数）
単なるCPAではなく、投下資本が何日で回収できるかを示す
AMASオリジナルの指標です。

■ 4つのAIエージェント
1. SEOセンチネル：サテライトページの自動構築
2. アド・アストラ：Google/Meta/LINE等への自動入稿・入札
3. オプティフロー：LPのCVR改善
4. リードナーチャリング：LINE等での自動追客

■ Dual-Brain構造
Claude（戦略脳）：コピー生成・戦略立案
Gemini（実行脳）：入札調整・媒体API連携

■ プラン構成
Free：¥0 / URLのみ / Google Search
Lite：¥9,800 / AIヒアリング / Google+Instagram+Facebook
Standard：¥29,800 / AMASフォーム / 主要媒体
Pro：¥98,000 / GA4連携 / 全媒体 / 最大20アカウント
Agency：¥198,000 / ホワイトラベル / 無制限 / API連携

■ 初期設定の手順

STEP 1：設定ページで組織プロフィールを入力・保存
　→ 入力した情報は請求書・レポートに自動反映されます。
　→「ビジネス設定」に入力した業種・サービス内容・
　　 NGワードは、AIがテキストやクリエイティブを
　　 生成する際に自動で参照されます。

STEP 2：お支払い方法を登録
　→ クレジットカードまたは銀行振込が利用可能です。
　→ 登録しておくとWalletへのチャージがスムーズになります。
　→ オートチャージを設定すると残高不足による
　　 広告停止を防げます（残高¥50,000以下で自動チャージ）。

STEP 3：Walletにチャージ
　→ チャージした金額が広告予算の上限になります。
　→ チャージ額以上は絶対に配信されません。
　→ チャージ完了後、残高はリアルタイムで反映されます。

STEP 4：広告アカウントの連携
　→ データ連携タブから「Googleでログイン」ボタンを押す。
　→ ご自身のGoogleアカウントで承認するだけで
　　 AMASが管理権限を取得します。
　→ パスワードはAMASに保存されません。
　→ Meta Adsも同様の手順で連携できます。

STEP 5：新規入稿
　→ 左メニューの「新規入稿」から開始します。
　→ 運用したい媒体を選択します。
　→ 月間予算を入力します。
　→ AIが業種・予算・ビジネス設定をもとに
　　 テキストとクリエイティブを自動生成します。
　→ 生成されたコピー・バナーを確認し、
　　 修正したい場合は自由に編集できます。
　→「入稿する」ボタンを押すと媒体審査に進みます。

STEP 6：媒体審査と配信開始
　→ 媒体審査は通常1〜3営業日かかります。
　→ 審査中はダッシュボードに「審査中」と表示されます。
　→ 承認されると「配信中」に切り替わります。
　→ ガードレール設定に応じて
　　 自動配信または任意承認で運用が開始されます。

■ ガードレール
ユーザーが最大日次予算と自律承認しきい値を設定。
AIはその範囲内でのみ自律的に行動します。

■ よくある「？」への回答

Q：チャージしたお金はいつ広告費として使われますか？
A：キャンペーンが承認・配信開始されてから
　 実際の広告費として消費されます。
　 配信前にチャージが消えることはありません。

Q：AIが生成したテキストが気に入らない場合は？
A：入稿前に自由に編集できます。
　 また承認ワークフローで確認してから
　 配信することも可能です。

Q：広告を止めたいときはどうすればいいですか？
A：ダッシュボードのキャンペーン一覧から
　 「停止」ボタンを押すと即座に配信が止まります。
　 AIの自動運用も同時に停止されます。

Q：予算が足りなくなったらどうなりますか？
A：Walletの残高がゼロになると広告配信が自動停止します。
　 オートチャージを設定しておくことを推奨します。

Q：どの媒体に出せばいいかわからない場合は？
A：業種を入力するとAIが最適な媒体を提案します。
　 迷ったらまずGoogle Searchから始めることを推奨します。

Q：レポートはいつ見られますか？
A：ダッシュボードでリアルタイムに確認できます。
　 月次レポートはレポートページから
　 PDFまたはCSVでダウンロードできます。

Q：代理店として複数クライアントを管理したい場合は？
A：Agencyプランでクライアント管理機能が使えます。
　 クライアントごとにダッシュボードを切り替えて
　 管理できます。ホワイトラベルにも対応しています。

■ 回答ルール
- 「です・ます」調で答える
- 専門用語は使わず、使う場合は括弧で説明する
- AMASの機能範囲外の質問には
  「現在AMASではその機能は提供していません」と答える
- 競合他社（シロフネ等）との比較は行わない
- わからない場合は
  「support@amas-core.aiにお問い合わせください」
  と案内する

---
  `;

  // GPT-4o is the primary engine for copy/creative generation. Gemini is the fallback.
  try {
    const result = await callGPT({
      model: "gpt-4o",
      system: systemInstruction,
      messages: [{ role: 'user', content: query }],
      temperature: 0.7,
    });
    return getGPTText(result);
  } catch (error) {
    console.warn("GPT-4o failed, falling back to Gemini:", error);
  }

  const response = await callGemini({
    model: "gemini-2.5-flash",
    contents: query,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || "申し訳ありません。回答を生成できませんでした。しばらく時間をおいて再度お試しください。";
}

export async function getAIHearingQuestions(industry: string, plan: PlanType = 'Free'): Promise<string[]> {
  const prompt = `
    AMAS AIヒアリングエンジン
    業種: ${industry}
    プラン: ${plan}
    
    広告主に対して、過去1週間のオフライン成果（電話問い合わせ、来店、成約など）をヒアリングするための質問を3つ生成してください。
    
    回答は以下のJSON形式で厳密に出力してください（配列のみ）:
    ["質問1", "質問2", "質問3"]
  `;

  try {
    if (plan === 'Standard' || plan === 'Pro') {
      try {
        const model = plan === 'Pro' ? "claude-opus-4-5" : "claude-sonnet-4-5";
        const result = await callClaude({
          model,
          system: "あなたはヒアリングの専門家です。JSON形式で回答してください。",
          messages: [{ role: 'user', content: prompt }]
        });
        const resContent = result.content[0].text;
        const jsonMatch = resContent.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : resContent);
      } catch (error) {
        console.warn("Claude API failed, falling back to Gemini:", error);
      }
    }

    const response = await callGemini({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return ["先週の電話問い合わせは何件ありましたか？", "そのうち、実際に成約に至ったのは何件ですか？", "成約した案件の概算売上を教えてください。"];
  } catch (error) {
    console.error("AI API Error (Hearing):", error);
    return ["先週の電話問い合わせは何件ありましたか？", "そのうち、実際に成約に至ったのは何件ですか？", "成約した案件の概算売上を教えてください。"];
  }
}

export async function checkAdContentCensorship(
  content: AdContent,
  industry: IndustryType,
  plan: PlanType = 'Free'
): Promise<AdCensorshipResult> {
  const prompt = `
    AMAS AI検閲官（Claude Ads / Gemini Guard）
    業種: ${industry}
    見出し: ${content.headline}
    説明文/本文: ${content.description || content.body}
    
    以下の基準で広告内容を厳格に検閲してください：
    1. 【景表法・薬機法対策】「最高」「世界一」「日本一」「No.1」などの根拠なき最大級表現が含まれていないか。
    2. 【ブランド安全性】不適切な表現、暴力、差別、過度な露出、公序良俗に反する内容が含まれていないか。
    3. 【整合性】広告文の内容が具体的で、ユーザーに誤解を与えないか。
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "passed": true/false (検閲を通過したか),
      "score": 0-100 (安全スコア),
      "feedback": "全体的なフィードバック（日本語）",
      "violations": ["違反項目1", "違反項目2", ...] (違反がある場合のみ)
    }
  `;

  if (plan === 'Pro' || plan === 'Agency') {
    try {
      const result = await callClaude({
        model: "claude-sonnet-4-5",
        system: "あなたは広告検閲の専門家です。JSON形式で回答してください。",
        messages: [{ role: 'user', content: prompt }]
      });
      const resContent = result.content[0].text;
      const jsonMatch = resContent.match(/\{[\s\S]*\}/);
      const data = JSON.parse(jsonMatch ? jsonMatch[0] : resContent);
      return { ...data, checkedAt: Date.now() };
    } catch (error) {
      console.warn("Claude API failed, falling back to Gemini:", error);
    }
  }

  const response = await callGemini({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          passed: { type: Type.BOOLEAN },
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          violations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["passed", "score", "feedback", "violations"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  return { ...data, checkedAt: Date.now() };
}

export interface BannerCopyText {
  headline: string;
  subheadline?: string;
  cta: string;
}

export interface BannerSuggestion {
  backgroundPrompt: string;
  preset: BannerDesignPreset;
  explanation: string;
  // Copy text generated by Claude. Will be rendered into the image by GPT Image 2.
  copyText?: BannerCopyText;
}

export async function generateBannerSuggestions(
  industry: string,
  headline: string,
  description: string,
  plan: PlanType = 'Free'
): Promise<BannerSuggestion[]> {
  const prompt = `
AMAS バナーデザイン・プランナー（コンセプト + コピーテキスト生成）
業種: ${industry}
入力キャッチコピー: ${headline}
入力説明文: ${description}

上記の情報を基に、成約率の高いバナー広告のコンセプトを3案作成してください。
各案は、画像生成AI（GPT Image 2）が「テキスト込みの完成バナー」を一発で描けるように、
背景デザインと焼き込み用のコピーテキストの両方を含めてください。

【各案に必要な要素】
1. backgroundPrompt（英語）: 背景デザインの指示。
   - 写実的な情景・スタイル・色調・構図を具体的に。
   - ブランドセーフな表現（暴力・差別・誤認誘発なし）。
   - テキストやロゴそのものへの言及は最小限（コピーテキストは別途指示するため）。
2. preset: 'impact' | 'catalog' | 'minimal'
   - impact: 文字を中央大きく配置。インパクト重視。
   - catalog: 文字を右側、左に商品/サービスイメージ。
   - minimal: 文字を下部控えめ。背景の美しさを活かす。
3. copyText（日本語）: バナーに焼き込むテキスト。短く力強く。
   - headline: 主見出し（最大15文字、最重要）
   - subheadline: 補助コピー（最大25文字、省略可）
   - cta: ボタン文言（最大10文字、例: 今すぐ予約 / 無料相談）
4. explanation（日本語）: この案で刺さる理由の解説。

【回答形式】
以下のJSONのみを返してください。前置きやコードブロックは付けないこと。
{
  "suggestions": [
    {
      "backgroundPrompt": "...",
      "preset": "impact|catalog|minimal",
      "copyText": { "headline": "...", "subheadline": "...", "cta": "..." },
      "explanation": "..."
    }
  ]
}
`;

  // Primary: GPT-4o generates concept + copy text.
  try {
    const result = await callGPT({
      model: "gpt-4o",
      system: "あなたは熟練の広告クリエイティブディレクター兼コピーライターです。JSON形式のみで応答してください。",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });
    const text = getGPTText(result);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
      return parsed.suggestions as BannerSuggestion[];
    }
  } catch (error) {
    console.warn("GPT-4o banner suggestions failed, falling back to Gemini:", error);
  }

  // Fallback: Gemini (structured JSON via responseSchema).
  const response = await callGemini({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                backgroundPrompt: { type: Type.STRING },
                preset: { type: Type.STRING, enum: ["impact", "catalog", "minimal"] },
                copyText: {
                  type: Type.OBJECT,
                  properties: {
                    headline: { type: Type.STRING },
                    subheadline: { type: Type.STRING },
                    cta: { type: Type.STRING }
                  },
                  required: ["headline", "cta"]
                },
                explanation: { type: Type.STRING }
              },
              required: ["backgroundPrompt", "preset", "explanation"]
            }
          }
        },
        required: ["suggestions"]
      }
    }
  });

  const data = JSON.parse(response.text || '{"suggestions": []}');
  return data.suggestions;
}

// Generate the final banner image (background + rendered copy text) via GPT Image 2.
// `copyText` is optional for backward compatibility; if provided, the text is baked
// into the image by gpt-image-1 instead of being overlaid on the client.
export async function generateBannerImage(
  prompt: string,
  aspectRatio: BannerType,
  copyText?: BannerCopyText,
  preset: BannerDesignPreset | string = 'impact'
): Promise<string> {
  // Google / Meta standard banner sizes (the backend remaps to gpt-image-1 sizes).
  const sizeMap: Record<BannerType, string> = {
    [BannerType.Square]: "1080x1080",     // Instagram square
    [BannerType.Wide]: "1200x628",        // OGP / landscape
    [BannerType.Vertical]: "1080x1920",   // Stories / Reels
  };

  // Per-preset layout instructions. Verbose on purpose: gpt-image-1 needs
  // explicit spatial guidance to place Japanese text reliably.
  const presetGuide: Record<string, string> = {
    impact: [
      "LAYOUT — IMPACT (center stage):",
      "- The MAIN HEADLINE is the visual hero: place it dead-center, occupying roughly 25-30% of the canvas height in massive bold Japanese type.",
      "- If a SUB HEADLINE exists, place it directly under the headline at roughly half the headline size, with a small gap.",
      "- The CTA button sits in the lower third, horizontally centered, as a clearly visible rounded rectangle filled with a vivid accent color.",
      "- Subtly darken or blur the area behind the headline so the type pops; keep the rest of the background crisp.",
    ].join("\n"),

    catalog: [
      "LAYOUT — CATALOG (split composition, magazine style):",
      "- Divide the canvas into two vertical halves at 50/50.",
      "- LEFT HALF: a full-bleed hero photograph of the product / service implied by the background scene description.",
      "- RIGHT HALF: a clean panel (white or very light tinted background) holding a vertical text stack:",
      "    1) MAIN HEADLINE at the top of the right panel, large bold Japanese sans-serif.",
      "    2) SUB HEADLINE just below in a lighter weight.",
      "    3) CTA button anchored to the lower portion of the right panel in an accent color.",
      "- Keep generous padding inside the right panel; avoid touching the canvas edges.",
    ].join("\n"),

    minimal: [
      "LAYOUT — MINIMAL (bottom band, photo-led):",
      "- The background photograph fills the full canvas.",
      "- Reserve the BOTTOM 20-25% of the canvas as a text area, using a semi-transparent dark or light band (whichever maximises contrast against the photo).",
      "- Inside that band, stack: SUB HEADLINE (small, top), MAIN HEADLINE (mid-size, prominent), CTA pill (right-aligned or centered).",
      "- Top 75-80% remains uncluttered photography — no overlaid text up there.",
    ].join("\n"),
  };

  // Per-size optimization. gpt-image-1 still composes around the requested
  // aspect even when the requested resolution is remapped on the backend.
  const sizeGuide: Record<BannerType, string> = {
    [BannerType.Square]: [
      "FORMAT — 1080x1080 (Instagram / SNS square):",
      "- Single dominant focal point. Bold, impact-first composition.",
      "- Keep typography large and confident; this format is scanned in 1-2 seconds in a feed.",
      "- Safe margins of ~6% on every side so nothing critical is cropped by SNS UI.",
    ].join("\n"),

    [BannerType.Wide]: [
      "FORMAT — 1200x628 (OGP / landscape banner):",
      "- Horizontal composition. Place primary visual element on one side, text block on the other.",
      "- Allow more information density: headline + subheadline + CTA can all coexist comfortably.",
      "- Keep critical text well inside the central 80% of the canvas; OGP previews crop edges aggressively.",
    ].join("\n"),

    [BannerType.Vertical]: [
      "FORMAT — 1080x1920 (Stories / Reels vertical):",
      "- TOP ~55-60% of the canvas: background photograph / product imagery.",
      "- BOTTOM ~40-45%: text area stacked vertically (headline → subheadline → CTA).",
      "- Keep the very top 10% and very bottom 10% clear of essential text (UI chrome / profile bar / reactions overlay).",
    ].join("\n"),
  };

  // Quality directives — applied to every banner regardless of preset / size.
  const qualityDirectives = [
    "QUALITY REQUIREMENTS (must satisfy ALL):",
    "- Professional advertisement quality, polished commercial finish suitable for paid media.",
    "- Japanese text MUST be perfectly rendered: every kana / kanji / character correct, no garbled glyphs, no invented characters, no Latin substitutes.",
    "- Clean modern design — no decorative clutter, no random shapes, no watermarks, no logos other than what is explicitly described.",
    "- High contrast between text and its background for instant readability at small sizes.",
    "- Use a clean Japanese sans-serif style (think Noto Sans JP / ヒラギノ角ゴ / 游ゴシック). Proper kerning and line spacing.",
    "- Do NOT add any text beyond what is listed in the TEXT TO RENDER block.",
  ].join("\n");

  // Compose the final prompt.
  let fullPrompt = `PROFESSIONAL ADVERTISEMENT BANNER

BACKGROUND SCENE:
${prompt}

${qualityDirectives}

${sizeGuide[aspectRatio]}

${presetGuide[preset as string] || presetGuide.impact}`;

  if (copyText && (copyText.headline || copyText.cta)) {
    const textLines: string[] = [];
    if (copyText.headline)    textLines.push(`- MAIN HEADLINE (largest, most prominent): 「${copyText.headline}」`);
    if (copyText.subheadline) textLines.push(`- SUB HEADLINE (medium, supporting): 「${copyText.subheadline}」`);
    if (copyText.cta)         textLines.push(`- CTA BUTTON LABEL (inside a clearly visible rounded button): 「${copyText.cta}」`);

    fullPrompt += `

TEXT TO RENDER (exact Japanese strings, render character-by-character with NO substitutions):
${textLines.join("\n")}

TEXT STYLING:
- Headline: bold, large, dark on light backgrounds OR white on dark backgrounds — whichever yields the highest contrast.
- Subheadline: regular weight, ~50-60% of headline size, same family.
- CTA: filled rounded-rectangle button using a vivid accent color (e.g. accent orange / coral / cyan / brand red) with white text inside. The button must look tappable.
- Verify every Japanese character is rendered correctly before finalising the image.`;
  } else {
    fullPrompt += `\n\nNo text overlays in the image.`;
  }

  const response = await fetch("/api/ai/image-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: fullPrompt,
      size: sizeMap[aspectRatio],
      style: "modern, premium, high-conversion Japanese advertising banner with perfectly rendered Japanese typography",
      quality: "high",
    }),
  });

  if (!response.ok) {
    let message = "画像の生成に失敗しました。";
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.url) {
    throw new Error("画像の生成に失敗しました。");
  }
  return data.url as string;
}

// ===============================================================
// mureo Workflow Clients
// Each function wraps a /api/workflow/* endpoint on the backend.
// ===============================================================

export interface DailyCheckMetrics {
  impressions: number;
  clicks: number;
  leads: number;
  spend: number;
  budget: number;
  cpa: number;
  roas: number;
  cvi: number;
  campaignCount?: number;
  activeCampaigns?: number;
}

export interface DailyCheckAnomaly {
  platform: string;
  metric: string;
  severity: 'low' | 'medium' | 'high';
  detail: string;
}

export interface DailyCheckRecommendation {
  title: string;
  detail: string;
  expectedImpact: string;
}

export interface DailyCheckResult {
  userId: string;
  generatedAt: number;
  totals: DailyCheckMetrics;
  byPlatform: Record<string, DailyCheckMetrics>;
  summary: string;
  anomalies: DailyCheckAnomaly[];
  recommendations: DailyCheckRecommendation[];
  error?: string;
}

export interface BudgetRebalanceProposal {
  fromCampaignId: string;
  fromCampaignName: string;
  toCampaignId: string;
  toCampaignName: string;
  amount: number;
  reason: string;
  expectedCVIDelta?: number;
}

export interface BudgetRebalanceResult {
  userId: string;
  generatedAt: number;
  applied: boolean;
  summary: string;
  proposals: BudgetRebalanceProposal[];
}

export interface WeeklyReportResult {
  userId: string;
  generatedAt: number;
  period: { from: number; to: number };
  totals: {
    impressions: number;
    clicks: number;
    leads: number;
    spend: number;
    budget: number;
    campaignCount: number;
  };
  averages: { cpa: number; roas: number; cvi: number };
  summary: string;
}

async function postWorkflow<T>(path: string, body: any): Promise<T> {
  const response = await fetch(`/api/workflow/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let message = `Workflow request failed: ${path}`;
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

export async function runDailyCheck(userId: string): Promise<DailyCheckResult> {
  return postWorkflow<DailyCheckResult>("daily-check", { userId });
}

export async function runBudgetRebalance(
  userId: string,
  campaigns: Campaign[]
): Promise<BudgetRebalanceResult> {
  return postWorkflow<BudgetRebalanceResult>("budget-rebalance", { userId, campaigns });
}

export async function runWeeklyReport(
  userId: string,
  campaigns: Campaign[]
): Promise<WeeklyReportResult> {
  return postWorkflow<WeeklyReportResult>("weekly-report", { userId, campaigns });
}

export async function saveInsight(
  userId: string,
  insight: string
): Promise<{ success: boolean; id: string }> {
  return postWorkflow<{ success: boolean; id: string }>("learn", { userId, insight });
}

// ── Keyword Planning ─────────────────────────────────────────────
// バックエンド /api/keywords/* を呼ぶシンプルなラッパー。
// suggestKeywords は GPT-4o(主)/Gemini(副)、estimateKeywordVolume は Gemini。

async function postKeywordApi<T>(path: "suggest" | "volume", body: unknown): Promise<T> {
  const response = await fetch(`/api/keywords/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let message = `Failed to call /api/keywords/${path} (HTTP ${response.status})`;
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function suggestKeywords(
  industry: string,
  targetUrl: string,
  platforms: string[]
): Promise<string[]> {
  const data = await postKeywordApi<{ keywords: string[] }>("suggest", {
    industry,
    targetUrl: targetUrl || undefined,
    platforms,
  });
  return Array.isArray(data?.keywords) ? data.keywords : [];
}

export async function estimateKeywordVolume(
  keywords: string[],
  industry: string,
  targetUrl?: string,
): Promise<KeywordSuggestion[]> {
  const data = await postKeywordApi<{ items: KeywordSuggestion[] }>("volume", {
    keywords,
    industry,
    targetUrl: targetUrl || undefined,
  });
  return Array.isArray(data?.items) ? data.items : [];
}

// ── Drafts ───────────────────────────────────────────────────────
// バックエンド /api/drafts/* を呼ぶシンプルなラッパー。
// snapshot は呼び出し側で JSON.stringify したものを渡す。

export interface DraftSaveInput {
  name: string;
  status?: DraftStatus;
  wizardData: string;   // JSON.stringify した NewCampaignWizard 全状態
}

async function draftFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/drafts${path}`, init);
  if (!response.ok) {
    if (response.status === 204) return undefined as T;
    let message = `Draft API ${path} failed (HTTP ${response.status})`;
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }
  // 204 No Content (DELETE) — body は空
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function saveDraft(userId: string, draftData: DraftSaveInput): Promise<Draft> {
  return draftFetch<Draft>("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...draftData }),
  });
}

export async function listDrafts(userId: string): Promise<DraftSummary[]> {
  const data = await draftFetch<{ drafts: DraftSummary[] }>(
    `/list?userId=${encodeURIComponent(userId)}`,
  );
  return Array.isArray(data?.drafts) ? data.drafts : [];
}

export async function getDraft(id: string): Promise<Draft> {
  return draftFetch<Draft>(`/${encodeURIComponent(id)}`);
}

export async function deleteDraft(id: string): Promise<void> {
  await draftFetch<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ── Export (CSV / 直接入稿) ──────────────────────────────────────
// バックエンド /api/export/* を呼ぶラッパー。
// CSV出力は媒体ごとのフォーマット (Google Ads Editor / Meta Ads Manager / 等) を
// サーバー側で生成し、テキスト本文として返す。フロントは Blob 化して順次DLする。

export interface ExportUtmSettings {
  enabled: boolean;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface ExportPayload {
  campaignName: string;
  productName?: string;
  adGroupName?: string;
  landingPageUrl: string;
  path1?: string;
  path2?: string;
  platforms: PlatformType[];
  headlines: string[];
  longHeadline?: string;
  descriptions: string[];
  primaryText?: string;
  keywords?: string[];
  matchType?: 'exact' | 'phrase' | 'broad';
  utm?: ExportUtmSettings;
}

export interface ExportFile {
  platform: string;
  filename: string;
  content: string;
}

export interface SubmitResult {
  platform: string;
  platformLabel?: string;
  success: boolean;
  mode: 'mock' | 'production';
  externalId?: string;
  message?: string;
}

export async function exportToCsv(payload: ExportPayload): Promise<ExportFile[]> {
  const response = await fetch("/api/export/csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let message = `Failed to export CSV (HTTP ${response.status})`;
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }
  const data = await response.json();
  return Array.isArray(data?.files) ? data.files : [];
}

export async function submitToMedia(payload: ExportPayload): Promise<SubmitResult[]> {
  const response = await fetch("/api/export/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let message = `Failed to submit to media (HTTP ${response.status})`;
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }
  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

// ブラウザでCSVファイルをダウンロードさせるユーティリティ。
// content は BOM 込みでサーバーから来るので、そのまま Blob 化する。
export function downloadExportFile(file: ExportFile): void {
  const blob = new Blob([file.content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // revoke は次フレームに遅延（Chromeで即時revokeするとダウンロードが破棄される）
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
