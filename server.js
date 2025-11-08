import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPG/PNG/WEBP allowed"), ok);
  },
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Base prompt template
const BASE_PROMPT = `
Task: Transform the provided dog photo into a historically-inspired portrait.

Keep identity: Preserve the dog's unique face shape, markings, fur color, and eye color EXACTLY as shown in the photo.

Quality: Ultra-detailed textures (fur, fabric, armor, ornaments), museum-quality finish, no artifacts, no text overlays.
Pose & composition: Camera at eye-level or slight 3/4 view; centered composition with appropriate background.
Lighting: Cinematic lighting with dramatic contrast and warm tones where appropriate.
Constraints: No humans. No extra limbs. Keep anatomical correctness for the dog. No watermarks. No frames.

VERY IMPORTANT: 
- Use the first image (the dog's photo) as the SUBJECT to transform - preserve its exact appearance.
- Use the second image (style reference) ONLY for color palette, composition, and artistic treatment—do not copy its subject.
- Output a vertical portrait aspect ratio (4:5) suitable for printing (at least ~1024px on the short side).
`;

// Style-specific prompts
const STYLE_PROMPTS = {
  'egyptian-pharaoh': {
    stylePrompt: `
Style: Ancient Egyptian Pharaoh portrait with divine royal regalia.
Attire & Props: Golden ceremonial headdress (nemes) with cobra insignia (uraeus), ornate broad collar (usekh) with precious stones and gold, golden arm bands, flowing white and gold robes, holding ceremonial ankh staff.
Background: Pyramid and sphinx silhouettes at sunset, golden desert sands, hieroglyphic decorations on walls.
Lighting: Warm golden sunlight, creating a divine, majestic atmosphere.`,
    reference: 'style/egyptian-pharaoh-reference.png'
  },
  'roman-gladiator': {
    stylePrompt: `
Style: Roman gladiator warrior portrait with arena champion aesthetics.
Attire & Props: Detailed bronze armor with ornate breastplate featuring eagle insignia, red leather pteruges (military skirt), crimson cape, gladius sword, decorated shield with Roman emblems.
Background: Roman Colosseum arena with sand floor, architectural columns, warm afternoon light.
Lighting: Warm golden sunlight with dramatic shadows, cinematic heroic lighting.`,
    reference: 'style/roman-gladiator-reference.png'
  },
  'duke-style': {
    stylePrompt: `
Style: Classic Late-Renaissance / Baroque royal portrait with luxurious noble elegance.
Attire & Props: Deep burgundy velvet robe with dense gold embroidery, white ermine collar, blue velvet mantle, jeweled pendant and chain, ornate gold crown with red velvet cap, golden scepter.
Background: Palace interior with rich tapestries, carved wooden throne, warm palatial setting.
Lighting: Warm Rembrandt-style key light with gentle falloff, soft shadows.`,
    reference: 'style/duke-style-reference.jpg'
  },
  'renaissance-noble': {
    stylePrompt: `
Style: Italian Renaissance noble scholar portrait in the style of Leonardo da Vinci or Raphael.
Attire & Props: Rich silk doublet in deep emerald or burgundy, ornate gold chain of office, leather gloves, scholarly accessories.
Background: Renaissance study with leather-bound books, astronomical instruments, rolled parchments, classical architecture.
Lighting: Soft window light creating gentle chiaroscuro effect, warm and contemplative atmosphere.`,
    reference: 'style/renaissance-noble-reference.png'
  }
};

// Gender-specific attire hints (respectful and optional guidance)
function getGenderHint(gender) {
  if (gender === 'male') {
    return '\nAttire note: Use traditionally masculine styling in pose and garment details.';
  } else if (gender === 'female') {
    return '\nAttire note: Use traditionally feminine styling in pose and garment details.';
  }
  return '';
}

app.post("/api/transform", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded." });

    // Get gender and styleId from form data
    const { gender, styleId } = req.body;
    
    console.log(`📝 Transform request: gender=${gender}, styleId=${styleId}`);

    // Get style configuration (default to duke-style if not found)
    const styleConfig = STYLE_PROMPTS[styleId] || STYLE_PROMPTS['duke-style'];
    
    // Build dynamic prompt
    const fullPrompt = BASE_PROMPT + styleConfig.stylePrompt + getGenderHint(gender);

    // User upload
    const userImageBase64 = req.file.buffer.toString("base64");

    // Load style reference image
    const stylePath = path.join(process.cwd(), "public", styleConfig.reference);
    let styleBase64 = null;
    let styleMimeType = 'image/jpeg';
    
    try { 
      styleBase64 = fs.readFileSync(stylePath).toString("base64");
      // Detect mime type from file extension
      if (stylePath.endsWith('.png')) styleMimeType = 'image/png';
      else if (stylePath.endsWith('.webp')) styleMimeType = 'image/webp';
      
      console.log(`✅ Style reference loaded: ${styleConfig.reference}`);
    }
    catch (err) { 
      console.warn("⚠️ Style reference not found at:", stylePath); 
    }

    // Build request parts
    const parts = [
      { text: fullPrompt },
      { inlineData: { mimeType: req.file.mimetype, data: userImageBase64 } },
    ];
    
    if (styleBase64) {
      parts.push({ text: "Style reference image (do NOT copy subject):" });
      parts.push({ inlineData: { mimeType: styleMimeType, data: styleBase64 } });
    }

    console.log('🚀 Calling Gemini API...');

    // Call Gemini image model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: parts,
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "4:5" }
      },
    });

    // Find the image bytes
    const candidates = response?.candidates ?? [];
    const imagePart = candidates.flatMap(c => c.content?.parts ?? [])
                                .find(p => p.inlineData?.data);

    if (!imagePart) {
      console.error('❌ No image in response:', response?.text);
      return res.status(502).json({
        error: "Model did not return an image.",
        details: response?.text ?? "No image data in response."
      });
    }

    console.log('✅ Portrait generated successfully!');
    res.json({ ok: true, imageBase64: imagePart.inlineData.data });

  } catch (err) {
    console.error('❌ Transform error:', err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
  }
});

app.get("/", (_, res) =>
  res.sendFile(path.join(process.cwd(), "public", "index.html"))
);

app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
