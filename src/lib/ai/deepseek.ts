// ============================================================
// DeepSeek API Wrapper — Pricing Recommendation Engine
// ============================================================

import type { AIRecommendationResponse } from '@/types';

interface RecommendationContext {
  date: string;
  roomType: string;
  currentPrice: number;
  occupancy: number;
  adr: number;
  availableRooms: number;
  bookedRooms: number;
  weatherCondition: string | null;
  highTemp: number | null;
  lowTemp: number | null;
  events: string[];
  competitorAvg: number | null;
}

const SYSTEM_PROMPT = `You are an expert hotel revenue manager AI. Analyze the provided data and recommend optimal room pricing in Indonesian Rupiah (IDR). Consider occupancy rates, competitor pricing, weather forecasts, local events, and historical patterns.

Return ONLY valid JSON with no markdown formatting or code blocks. Use this exact structure:
{
  "recommendedPrice": number,
  "confidenceScore": number (0-100),
  "reasoning": "string (max 3 sentences)",
  "keyFactors": ["string (max 3 factors)"]
}`;

function buildUserPrompt(context: RecommendationContext): string {
  return `Context for ${context.date} - ${context.roomType}:
  Current Price: Rp ${context.currentPrice.toLocaleString('id-ID')}
  Occupancy: ${context.occupancy}%
  ADR: Rp ${context.adr.toLocaleString('id-ID')}
  Available Rooms: ${context.availableRooms}
  Booked Rooms: ${context.bookedRooms}

External Factors:
  Weather: ${context.weatherCondition || 'N/A'}, ${context.highTemp ? `${Math.round(context.highTemp)}°C` : 'N/A'} / ${context.lowTemp ? `${Math.round(context.lowTemp)}°C` : 'N/A'}
  Events: ${context.events.length > 0 ? context.events.join(', ') : 'No local events'}
  Competitor Avg: ${context.competitorAvg ? `Rp ${context.competitorAvg.toLocaleString('id-ID')}` : 'N/A'}

Consider:
1. Price elasticity based on current occupancy
2. Weather impact on demand
3. Events driving demand surge
4. Competitor positioning
5. All prices are in Indonesian Rupiah (IDR)

Return JSON recommendation:`;
}

/**
 * Get a pricing recommendation from DeepSeek API.
 */
export async function getPricingRecommendation(
  context: RecommendationContext
): Promise<AIRecommendationResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  if (!apiKey) {
    console.warn('[DeepSeek] No API key configured, using fallback recommendation');
    return getFallbackRecommendation(context);
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(context) },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DeepSeek] API error ${response.status}: ${errorText}`);
      return getFallbackRecommendation(context);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('[DeepSeek] Empty response, using fallback');
      return getFallbackRecommendation(context);
    }

    // Parse JSON from response (handle potential markdown fences)
    const cleaned = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed: AIRecommendationResponse = JSON.parse(cleaned);

    // Validate response
    if (!parsed.recommendedPrice || !parsed.confidenceScore) {
      throw new Error('Invalid recommendation structure');
    }

    return parsed;
  } catch (error) {
    console.error('[DeepSeek] Error getting recommendation:', error);
    return getFallbackRecommendation(context);
  }
}

/**
 * Fallback recommendation when DeepSeek API is unavailable.
 * Uses simple business rules instead of AI.
 */
function getFallbackRecommendation(context: RecommendationContext): AIRecommendationResponse {
  const { currentPrice, occupancy, adr, competitorAvg, events } = context;
  const factors: string[] = [];
  let recPrice = currentPrice;

  // High occupancy → increase price
  if (occupancy > 85) {
    recPrice = Math.round(currentPrice * 1.15);
    factors.push(`High occupancy ${occupancy}%`);
  } else if (occupancy > 70) {
    recPrice = Math.round(currentPrice * 1.08);
    factors.push(`Moderate occupancy ${occupancy}%`);
  } else if (occupancy < 50) {
    recPrice = Math.round(currentPrice * 0.92);
    factors.push(`Low occupancy ${occupancy}%`);
  }

  // Events nearby → increase price
  if (events.length > 0) {
    recPrice = Math.round(recPrice * 1.12);
    factors.push(`${events.length} event(s) nearby`);
  }

  // Competitor pricing
  if (competitorAvg && currentPrice < competitorAvg * 0.9) {
    recPrice = Math.round(competitorAvg * 1.05);
    factors.push('Below competitor average');
  } else if (competitorAvg && currentPrice > competitorAvg * 1.2) {
    recPrice = Math.round(recPrice * 0.95);
    factors.push('Above competitor average');
  }

  // Compare with ADR
  if (adr && currentPrice < adr * 0.8) {
    recPrice = Math.max(recPrice, Math.round(adr * 0.9));
    factors.push('ADR-based adjustment');
  }

  // Ensure price doesn't exceed reasonable bounds
  const maxPrice = Math.round(currentPrice * 1.3);
  const minPrice = Math.round(currentPrice * 0.7);
  recPrice = Math.max(minPrice, Math.min(maxPrice, recPrice));

  // Round to nearest 1000 IDR
  recPrice = Math.round(recPrice / 1000) * 1000;

  return {
    recommendedPrice: recPrice,
    confidenceScore: 70,
    reasoning: `Based on ${occupancy}% occupancy ${events.length > 0 ? 'and upcoming events' : ''}, recommended price adjustment from Rp ${currentPrice.toLocaleString('id-ID')} to Rp ${recPrice.toLocaleString('id-ID')}.`,
    keyFactors: factors.slice(0, 3),
  };
}

/**
 * Get batch recommendations for multiple dates.
 */
export async function getBatchRecommendations(
  contexts: RecommendationContext[]
): Promise<AIRecommendationResponse[]> {
  // Process sequentially to avoid rate limiting
  const results: AIRecommendationResponse[] = [];
  for (const context of contexts) {
    const result = await getPricingRecommendation(context);
    results.push(result);
    // Small delay between calls
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return results;
}
