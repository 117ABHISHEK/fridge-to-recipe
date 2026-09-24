import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: './server/.env' });

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const recipeSchema = {
  type: "object",
  properties: {
    recipes: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          recipeName: { type: "string" },
          description: { type: "string" },
          baseServings: { type: "number" },
          caloriesPerServing: { type: "number" },
          prepTime: { type: "string" },
          cookTime: { type: "string" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                amount: { type: "number" },
                unit: { type: "string" },
                swaps: { type: "array", items: { type: "string" } }
              },
              required: ["name", "amount", "unit", "swaps"]
            }
          },
          steps: { type: "array", items: { type: "string" } }
        },
        required: ["recipeName", "description", "baseServings",
          "caloriesPerServing", "prepTime", "cookTime", "ingredients", "steps"]
      }
    }
  },
  required: ["recipes"]
};

app.post('/api/generate', async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || typeof ingredients !== 'string' || !ingredients.trim()) {
    return res.status(400).json({ error: 'ingredients text is required' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      },
    });

    const prompt = `You are a recipe assistant. Given a list of ingredients the
user has available, suggest 2-3 distinct recipes they could make using mostly
those ingredients (a few common pantry staples are fine).

For each recipe include realistic ingredient amounts with units, plausible
prep/cook times, an estimated calorie count per serving, and at least one
sensible swap for any less common ingredient. Steps should be short,
individually actionable instructions (one action per step).

Ingredients available: ${ingredients}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const result = await model.generateContent(prompt, { signal: controller.signal });
    clearTimeout(timeout);

    const text = result.response.text();
    res.json({ raw: text });
  } catch (err) {
    console.error('Gemini generation failed:', err.message);
    res.status(502).json({ error: 'AI generation failed', detail: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));