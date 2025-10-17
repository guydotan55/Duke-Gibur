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

const DUKE_STYLE_PROMPT = `
Task: Transform the provided dog photo into a classic "Duke-style" royal portrait.

Keep identity: Preserve the dog's unique face shape, markings, fur color, and eye color.

Style: Late-Renaissance / Baroque royal portrait. Luxurious details. Warm, painterly, museum-grade finish. 
Wardrobe & props: Deep burgundy velvet robe with dense gold embroidery; white ermine collar; blue velvet mantle;
jeweled pendant and chain; ornate gold crown with red velvet cap; golden scepter in one paw.
Pose & composition: Dog seated on a carved wooden throne; camera ~eye-level or slight 3/4 view; centered composition.
Background: Palace interior with rich tapestries; soft, shallow depth of field to keep focus on the dog.
Lighting: Warm Rembrandt-style key light with gentle falloff. Cinematic contrast.
Quality: Ultra-detailed textures (fur, velvet, embroidery, gems), no artifacts, no text overlays.
Constraints: No humans. No extra limbs. Keep anatomical correctness for the dog. No watermarks. No frames.

VERY IMPORTANT: 
- Use the first image (the dog's photo) as the SUBJECT to transform.
- Use the second image (style reference) ONLY for color palette, composition, and painterly treatment—do not copy its dog.
- Output a vertical portrait aspect ratio (4:5) suitable for printing (at least ~1024px on the short side).
`;

app.post("/api/transform", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded." });

    // user upload
    const userImageBase64 = req.file.buffer.toString("base64");

    // optional style reference (improves consistency)
    const stylePath = path.join(process.cwd(), "public", "style", "duke-style-reference.jpg");
    let styleBase64 = null;
    try { styleBase64 = fs.readFileSync(stylePath).toString("base64"); }
    catch { console.warn("Style reference not found at:", stylePath); }

    // build request parts
    const parts = [
      { text: DUKE_STYLE_PROMPT },
      { inlineData: { mimeType: req.file.mimetype, data: userImageBase64 } },
    ];
    if (styleBase64) {
      parts.push({ text: "Style reference image (do NOT copy subject):" });
      parts.push({ inlineData: { mimeType: "image/jpeg", data: styleBase64 } });
    }

    // call Gemini image model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: parts,
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "4:5" }
      },
    });

    // find the image bytes
    const candidates = response?.candidates ?? [];
    const imagePart = candidates.flatMap(c => c.content?.parts ?? [])
                                .find(p => p.inlineData?.data);

    if (!imagePart) {
      return res.status(502).json({
        error: "Model did not return an image.",
        details: response?.text ?? "No image data in response."
      });
    }

    res.json({ ok: true, imageBase64: imagePart.inlineData.data });

  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
  }
});

app.get("/", (_, res) =>
  res.sendFile(path.join(process.cwd(), "public", "index.html"))
);

app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
