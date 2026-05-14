import { GoogleGenAI, Type } from "@google/genai";
import { AgentType, MarketingTask, IndustryType, StrategicPlan, AIAdvice, PlatformType, AdContent, PlanType, AdCensorshipResult, BannerDesignPreset, BannerType } from "../types";

// Gemini (Frontend)
// Initialized inside functions to ensure up-to-date API key
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[aiService] GEMINI_API_KEY is missing in environment variables');
    throw new Error('APIキーが設定されていません。システム管理者に確認してください。');
  }
  return new GoogleGenAI({ apiKey });
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

  // Use Claude for Standard/Pro plans with Gemini fallback
  if (plan === 'Standard' || plan === 'Pro') {
    try {
      const model = plan === 'Pro' ? "claude-3-opus-20240229" : "claude-3-5-sonnet-20241022";
      const result = await callClaude({
        model,
        system: "あなたはプロの広告運用エージェントです。JSON形式で回答してください。",
        messages: [{ role: 'user', content: prompt }]
      });
      
      const content = result.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content) as AdSuggestions;
    } catch (error) {
      console.warn("Claude API failed, falling back to Gemini:", error);
      // Continue to Gemini logic below
    }
  }

  // Gemini logic (Default or Fallback)
  const ai = getGenAI();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
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

  if (plan === 'Standard' || plan === 'Pro') {
    try {
      const model = plan === 'Pro' ? "claude-3-opus-20240229" : "claude-3-5-sonnet-20241022";
      const result = await callClaude({
        model,
        system: "あなたは広告診断の専門家です。JSON形式で回答してください。",
        messages: [{ role: 'user', content: prompt }]
      });
      const resContent = result.content[0].text;
      const jsonMatch = resContent.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : resContent) as AIAdvice;
    } catch (error) {
      console.warn("Claude API failed, falling back to Gemini:", error);
    }
  }

  const ai = getGenAI();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
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
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[aiService] GEMINI_API_KEY is missing in environment variables');
    throw new Error('APIキーが設定されていません。システム管理者に確認してください。');
  }

  const ai = new GoogleGenAI({ apiKey });

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

  if (plan === 'Standard' || plan === 'Pro') {
    try {
      const model = plan === 'Pro' ? "claude-3-opus-20240229" : "claude-3-5-sonnet-20241022";
      const result = await callClaude({
        model,
        system: "あなたはマーケティングの専門家です。JSON形式で回答してください。",
        messages: [{ role: 'user', content: prompt }]
      });
      const resContent = result.content[0].text;
      const jsonMatch = resContent.match(/\{[\s\S]*\}/);
      generatedData = JSON.parse(jsonMatch ? jsonMatch[0] : resContent);
    } catch (error) {
      console.warn("Claude API failed, falling back to Gemini:", error);
    }
  }

  if (!generatedData) {
    try {
      const model = "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model,
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
    if (plan === 'Standard' || plan === 'Pro') {
      const model = "claude-3-5-sonnet-20241022";
      const result = await callClaude({
        model,
        system: "あなたはコンテンツ検閲エンジンです。JSON形式で回答してください。",
        messages: [{ role: 'user', content: safetyCheckPrompt }]
      });
      const resContent = result.content[0].text;
      const jsonMatch = resContent.match(/\{[\s\S]*\}/);
      safetyData = JSON.parse(jsonMatch ? jsonMatch[0] : resContent);
    } else {
      const model = "gemini-3-flash-preview";
      const safetyResponse = await ai.models.generateContent({
        model,
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

  if (plan === 'Standard' || plan === 'Pro') {
    try {
      const model = plan === 'Pro' ? "claude-3-opus-20240229" : "claude-3-5-sonnet-20241022";
      const result = await callClaude({
        model,
        system: "あなたは戦略立案の専門家です。JSON形式で回答してください。",
        messages: [{ role: 'user', content: prompt }]
      });
      const resContent = result.content[0].text;
      const jsonMatch = resContent.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : resContent) as StrategicPlan;
    } catch (error) {
      console.warn("Claude API failed, falling back to Gemini:", error);
    }
  }

  const ai = getGenAI();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
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

  if (plan === 'Standard' || plan === 'Pro') {
    try {
      const model = plan === 'Pro' ? "claude-3-opus-20240229" : "claude-3-5-sonnet-20241022";
      const result = await callClaude({
        model,
        system: systemInstruction,
        messages: [{ role: 'user', content: query }]
      });
      return result.content[0].text;
    } catch (error) {
      console.warn("Claude API failed, falling back to Gemini:", error);
    }
  }

  const ai = getGenAI();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
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
        const model = plan === 'Pro' ? "claude-3-opus-20240229" : "claude-3-5-sonnet-20241022";
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

    const ai = getGenAI();
    const model = "gemini-3-flash-preview";
    const response = await ai.models.generateContent({
      model,
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
        model: "claude-3-5-sonnet-20241022",
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

  const ai = getGenAI();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
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

export interface BannerSuggestion {
  backgroundPrompt: string;
  preset: BannerDesignPreset;
  explanation: string;
}

export async function generateBannerSuggestions(
  industry: string,
  headline: string,
  description: string,
  plan: PlanType = 'Free'
): Promise<BannerSuggestion[]> {
  const prompt = `
    AMAS バナーデザイン・プランナー
    業種: ${industry}
    キャッチコピー: ${headline}
    説明文: ${description}
    
    上記の内容に基づき、成約率の高いバナー広告の背景画像プロンプトと、テキスト配置プリセットを3案提案してください。
    
    デザイン・プリセットの種類:
    - impact: 文字を中央に大きく配置。インパクト重視。
    - catalog: 文字を右側に配置。左側に商品やサービス画像を配置するカタログ風。
    - minimal: 文字を下部に控えめに配置。背景画像の美しさを活かす。
    
    背景画像プロンプトの指針:
    - 文字を含まないこと（重要）。
    - 具体的で高品質な描写。
    - 業種とキャッチコピーの文脈に合致すること。
    
    回答は以下のJSON形式で厳密に出力してください:
    {
      "suggestions": [
        { "backgroundPrompt": "プロンプト（英語）", "preset": "impact/catalog/minimal", "explanation": "この案の狙い（日本語）" },
        ...
      ]
    }
  `;

  const ai = getGenAI();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
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

export async function generateBannerImage(
  prompt: string,
  aspectRatio: BannerType,
  plan: PlanType = 'Free'
): Promise<string> {
  const ai = getGenAI();
  const model = "gemini-2.5-flash-image";
  
  const ratioMap: Record<BannerType, "1:1" | "16:9" | "9:16"> = {
    [BannerType.Square]: "1:1",
    [BannerType.Wide]: "16:9", // Approximate for 1.91:1
    [BannerType.Vertical]: "9:16"
  };

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: `High quality professional advertisement background, NO TEXT: ${prompt}` }]
    },
    config: {
      imageConfig: {
        aspectRatio: ratioMap[aspectRatio]
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("画像の生成に失敗しました。");
}
