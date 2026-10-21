/**
 * ReliefSphere — AI Donation Description Understanding Service
 * =============================================================
 * Interprets free-text donation descriptions and extracts structured information:
 *   - Category (food, clothes, books, medicine, essentials)
 *   - Items list
 *   - Quantity & Unit
 *   - Beneficiary context
 *   - Suggested urgency
 *
 * Integrates with optional external AI (Gemini or OpenAI via environment variables),
 * and provides a robust, zero-dependency local rule-based NLP parser fallback
 * so the application ALWAYS works reliably offline or without external credentials.
 */

const axios = require("axios");

const ALLOWED_CATEGORIES = ["food", "clothes", "books", "medicine", "essentials"];
const ALLOWED_UNITS = ["Packets", "Kg", "Pieces", "Boxes", "Sets", "Liters", "Kits"];

// ─── Local Rule-Based NLP Extraction Fallback ───
function parseDescriptionLocal(text) {
  if (!text || typeof text !== "string") {
    return {
      category: "food",
      donationName: "Relief Donation",
      quantity: 1,
      unit: "Packets",
      items: [],
      beneficiaryContext: "",
      suggestedUrgency: "medium",
      confidence: 0.5,
      source: "rule-based-nlp-fallback",
    };
  }

  const cleanText = text.trim();
  const lower = cleanText.toLowerCase();

  // 1. Quantity Extraction (Look for leading numbers or phrases like "30 grocery kits", "25 kg rice")
  let quantity = 1;
  const numMatch = lower.match(/\b(\d+)\s*(kg|kgs|kilogram|kilograms|packets?|boxes?|pieces?|sets?|liters?|kits?|items?|cartons?)\b/i) ||
                   lower.match(/\b(\d+)\b/);
  if (numMatch) {
    const parsed = parseInt(numMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
      quantity = parsed;
    }
  }

  // 2. Unit Extraction
  let unit = "Packets";
  if (/\b(kg|kgs|kilogram|kilograms)\b/i.test(lower)) {
    unit = "Kg";
  } else if (/\b(kits?|grocery kits?|relief kits?)\b/i.test(lower)) {
    unit = "Boxes";
  } else if (/\b(boxes?|cartons?)\b/i.test(lower)) {
    unit = "Boxes";
  } else if (/\b(pieces?|pcs)\b/i.test(lower)) {
    unit = "Pieces";
  } else if (/\b(sets?|pairs?)\b/i.test(lower)) {
    unit = "Sets";
  } else if (/\b(liters?|litres?|l)\b/i.test(lower)) {
    unit = "Liters";
  } else if (/\b(packets?|packs?|pouches?)\b/i.test(lower)) {
    unit = "Packets";
  }

  // 3. Category & Items Identification
  const categoryKeywords = {
    food: [
      "rice", "pulses", "oil", "cooking oil", "ration", "grocery", "groceries",
      "meal", "meals", "wheat", "flour", "atta", "dal", "canned", "biscuits",
      "bread", "milk", "baby food", "water", "food",
    ],
    clothes: [
      "clothes", "clothing", "shirts", "pants", "jackets", "sweaters",
      "blankets", "shawls", "sarees", "footwear", "shoes", "slippers",
      "warm wear", "winter wear",
    ],
    medicine: [
      "medicine", "medicines", "medical", "first aid", "bandages", "antiseptic",
      "paracetamol", "ointments", "syrup", "sanitizer", "gloves", "masks",
      "tablets", "pharma",
    ],
    books: [
      "books", "textbooks", "notebooks", "stationery", "pencils", "pens",
      "school bags", "bags", "educational", "geometry box",
    ],
    essentials: [
      "tents", "tarpaulin", "hygiene kits", "soap", "toothpaste", "toiletries",
      "sanitary pads", "torches", "flashlights", "mats", "mosquito nets",
      "utensils", "essentials",
    ],
  };

  const detectedItems = [];
  const categoryScores = { food: 0, clothes: 0, medicine: 0, books: 0, essentials: 0 };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        categoryScores[cat] += kw.length > 4 ? 2 : 1;
        if (!detectedItems.includes(kw)) {
          detectedItems.push(kw.charAt(0).toUpperCase() + kw.slice(1));
        }
      }
    }
  }

  // Determine top scoring category
  let topCategory = "food";
  let maxScore = -1;
  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      topCategory = cat;
    }
  }

  // 4. Beneficiary Context Extraction
  let beneficiaryContext = "";
  const beneficiaryPatterns = [
    /for\s+([a-zA-Z\s\-]+?)(?:\.|$|,)/i,
    /(flood-affected\s+families|disaster\s+victims|orphanage\s+children|homeless\s+people|elderly\s+residents|slum\s+dwellers|school\s+children)/i,
  ];

  for (const pattern of beneficiaryPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 3 && candidate.length < 60) {
        beneficiaryContext = candidate;
        break;
      }
    }
  }

  // 5. Suggested Urgency
  let suggestedUrgency = "medium";
  if (/\b(flood|disaster|emergency|critical|urgent|urgently|immediate|landslide|cyclone|crisis)\b/i.test(lower)) {
    suggestedUrgency = "high";
  } else if (/\b(low priority|when possible|flexible)\b/i.test(lower)) {
    suggestedUrgency = "low";
  }

  // 6. Suggest Donation Name
  let donationName = "";
  if (detectedItems.length > 0) {
    donationName = `${quantity} ${unit} of ${detectedItems.slice(0, 3).join(", ")}`;
  } else {
    donationName = `${quantity} ${unit} of ${topCategory.charAt(0).toUpperCase() + topCategory.slice(1)} Supplies`;
  }

  return {
    category: topCategory,
    donationName,
    quantity,
    unit,
    items: detectedItems,
    beneficiaryContext: beneficiaryContext || "Community in need",
    suggestedUrgency,
    confidence: maxScore > 2 ? 0.85 : 0.65,
    source: "rule-based-nlp-fallback",
  };
}

// ─── External AI Provider Integration (Gemini / OpenAI) ───
async function parseDescriptionWithExternalAi(descriptionText) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const prompt = `You are an AI assistant for ReliefSphere, a disaster relief and donation sharing platform.
Extract structured fields from the following donation description:
"${descriptionText}"

Respond ONLY with a valid JSON object with these keys:
{
  "category": "one of: food, clothes, books, medicine, essentials",
  "donationName": "concise, human-readable donation title (e.g. '30 Grocery Kits')",
  "quantity": positive integer number,
  "unit": "one of: Packets, Kg, Pieces, Boxes, Sets, Liters, Kits",
  "items": ["list", "of", "items", "extracted"],
  "beneficiaryContext": "e.g. flood-affected families, or general community",
  "suggestedUrgency": "one of: low, medium, high, critical"
}`;

  // Try Google Gemini if key configured
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        },
        { timeout: 7000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return sanitizeAndValidate(parsed, "gemini-api");
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local NLP:", err.message);
    }
  }

  // Try OpenAI if key configured
  if (openAiKey) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        },
        {
          headers: { Authorization: `Bearer ${openAiKey}` },
          timeout: 7000,
        }
      );

      const rawContent = response.data?.choices?.[0]?.message?.content || "";
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return sanitizeAndValidate(parsed, "openai-api");
      }
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to local NLP:", err.message);
    }
  }

  return null;
}

// ─── Sanitize and Validate AI Output ───
function sanitizeAndValidate(data, source = "ai") {
  let category = (data.category || "").toLowerCase().trim();
  if (!ALLOWED_CATEGORIES.includes(category)) {
    category = "food";
  }

  let quantity = Number(data.quantity);
  if (isNaN(quantity) || quantity <= 0) {
    quantity = 1;
  }

  let unit = data.unit || "Packets";
  if (!ALLOWED_UNITS.map((u) => u.toLowerCase()).includes(unit.toLowerCase())) {
    unit = "Packets";
  }

  let donationName = (data.donationName || "").trim().slice(0, 100);
  if (!donationName) {
    donationName = `${quantity} ${unit} of ${category}`;
  }

  const items = Array.isArray(data.items)
    ? data.items.map((i) => String(i).trim().slice(0, 50)).filter(Boolean)
    : [];

  const beneficiaryContext = String(data.beneficiaryContext || "").trim().slice(0, 120);

  let suggestedUrgency = (data.suggestedUrgency || "medium").toLowerCase();
  if (!["low", "medium", "high", "critical"].includes(suggestedUrgency)) {
    suggestedUrgency = "medium";
  }

  return {
    category,
    donationName,
    quantity,
    unit,
    items,
    beneficiaryContext,
    suggestedUrgency,
    confidence: 0.95,
    source,
  };
}

// ─── Main Exported Function ───
/**
 * Processes free text donation description.
 * Always returns a validated structure, whether via external AI or local NLP fallback.
 */
async function interpretDonationDescription(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return {
      success: false,
      message: "Description text is required.",
    };
  }

  // Attempt external AI if configured
  const aiResult = await parseDescriptionWithExternalAi(text);
  if (aiResult) {
    return {
      success: true,
      isAiPowered: true,
      suggestions: aiResult,
    };
  }

  // Fallback to local rule-based NLP parser
  const localResult = parseDescriptionLocal(text);
  return {
    success: true,
    isAiPowered: false,
    suggestions: localResult,
  };
}

module.exports = {
  interpretDonationDescription,
  parseDescriptionLocal,
  sanitizeAndValidate,
};
