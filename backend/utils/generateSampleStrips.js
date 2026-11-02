import { Jimp } from 'jimp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Destination folders
const backendUploadsDir = path.resolve(__dirname, '..', 'uploads');
const frontendSamplesDir = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'samples');

[backendUploadsDir, frontendSamplesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Profile pad color definitions [R, G, B] matching colorimetryEngine.js
const PROFILES = {
  normal: [
    [130, 185, 50],   // GLU: 18.4 (Normal)
    [220, 215, 95],   // PRO: 8.2 (Normal)
    [238, 218, 162],  // BIL: 0.12 (Normal)
    [245, 196, 184],  // URO: 0.45 (Normal)
    [214, 152, 56],   // pH: 6.20 (Normal)
    [94, 155, 72],    // SG: 1.018 (Normal)
    [232, 176, 48],   // BLD: 0.0 (Normal)
    [236, 216, 184],  // KET: 1.2 (Normal)
    [248, 248, 245],  // NIT: Negative (Normal)
    [248, 232, 168],  // LEU: 8.5 (Normal)
  ],
  uti: [
    [130, 185, 50],   // GLU: 18.4 (Normal)
    [120, 185, 105],  // PRO: 34.8 (Warning)
    [238, 218, 162],  // BIL: 0.12 (Normal)
    [235, 158, 148],  // URO: 1.20 (Warning)
    [66, 126, 88],    // pH: 7.85 (Warning)
    [40, 122, 88],    // SG: 1.012 (Normal)
    [30, 74, 56],     // BLD: 54.2 (Abnormal)
    [236, 216, 184],  // KET: 1.2 (Normal)
    [244, 114, 182],  // NIT: Positive (Abnormal)
    [107, 64, 136],   // LEU: 128.4 (Abnormal)
  ],
  diabetes: [
    [140, 90, 30],    // GLU: 185.4 (Abnormal)
    [220, 215, 95],   // PRO: 8.2 (Normal)
    [238, 218, 162],  // BIL: 0.12 (Normal)
    [245, 196, 184],  // URO: 0.45 (Normal)
    [226, 125, 59],   // pH: 5.20 (Normal)
    [155, 154, 56],   // SG: 1.025 (Normal)
    [232, 176, 48],   // BLD: 0.0 (Normal)
    [184, 96, 136],   // KET: 16.8 (Warning)
    [248, 248, 245],  // NIT: Negative (Normal)
    [248, 232, 168],  // LEU: 8.5 (Normal)
  ],
  renal: [
    [130, 185, 50],   // GLU: 18.4 (Normal)
    [70, 155, 95],    // PRO: 88.5 (Abnormal)
    [238, 218, 162],  // BIL: 0.12 (Normal)
    [245, 196, 184],  // URO: 0.45 (Normal)
    [214, 152, 56],   // pH: 6.20 (Normal)
    [184, 146, 48],   // SG: 1.032 (Warning)
    [72, 128, 80],    // BLD: 28.4 (Abnormal)
    [236, 216, 184],  // KET: 1.2 (Normal)
    [248, 248, 245],  // NIT: Negative (Normal)
    [212, 184, 184],  // LEU: 35.0 (Warning)
  ],
};

function rgbaInt(r, g, b, a = 255) {
  return (((Math.max(0, Math.min(255, r)) * 256 + Math.max(0, Math.min(255, g))) * 256 + Math.max(0, Math.min(255, b))) * 256 + Math.max(0, Math.min(255, a))) >>> 0;
}

export async function generateStripImages() {
  const width = 720;
  const height = 110;
  const totalPads = 10;
  const stepW = width / (totalPads + 1);
  const boxW = Math.round(stepW * 0.55);
  const boxH = Math.round(height * 0.5);
  const padY = Math.round((height - boxH) / 2);

  for (const [key, padColors] of Object.entries(PROFILES)) {
    // 1. Create base plastic strip
    const img = new Jimp({ width, height, color: rgbaInt(248, 250, 252) });

    // 2. Draw border frame around strip
    for (let x = 0; x < width; x++) {
      img.setPixelColor(rgbaInt(203, 213, 225), x, 0);
      img.setPixelColor(rgbaInt(203, 213, 225), x, 1);
      img.setPixelColor(rgbaInt(203, 213, 225), x, height - 1);
      img.setPixelColor(rgbaInt(203, 213, 225), x, height - 2);
    }
    for (let y = 0; y < height; y++) {
      img.setPixelColor(rgbaInt(203, 213, 225), 0, y);
      img.setPixelColor(rgbaInt(203, 213, 225), 1, y);
      img.setPixelColor(rgbaInt(203, 213, 225), width - 1, y);
      img.setPixelColor(rgbaInt(203, 213, 225), width - 2, y);
    }

    // 3. Draw handle texture on far right
    for (let x = width - 25; x < width - 10; x += 3) {
      for (let y = 15; y < height - 15; y++) {
        img.setPixelColor(rgbaInt(226, 232, 240), x, y);
      }
    }

    // 4. Draw each of the 10 chemical reagent pads
    for (let i = 0; i < totalPads; i++) {
      const padX = Math.round(stepW * (i + 0.6));
      const rgb = padColors[i];

      // Fill pad region
      for (let py = padY; py < padY + boxH; py++) {
        for (let px = padX; px < padX + boxW; px++) {
          img.setPixelColor(rgbaInt(rgb[0], rgb[1], rgb[2]), px, py);
        }
      }

      // Add subtle reagent pad border
      for (let px = padX; px < padX + boxW; px++) {
        img.setPixelColor(rgbaInt(148, 163, 184, 180), px, padY);
        img.setPixelColor(rgbaInt(148, 163, 184, 180), px, padY + boxH - 1);
      }
      for (let py = padY; py < padY + boxH; py++) {
        img.setPixelColor(rgbaInt(148, 163, 184, 180), padX, py);
        img.setPixelColor(rgbaInt(148, 163, 184, 180), padX + boxW - 1, py);
      }
    }

    // Save to backend/uploads and frontend/public/samples
    const backendPath = path.join(backendUploadsDir, `strip-${key}.png`);
    const frontendPath = path.join(frontendSamplesDir, `strip-${key}.png`);

    await img.write(backendPath);
    await img.write(frontendPath);
    console.log(`[GENERATED] ${key} strip saved:`, backendPath);
  }
}

// Execute immediately if run directly
if (process.argv[1] && process.argv[1].endsWith('generateSampleStrips.js')) {
  generateStripImages().then(() => console.log('Sample strips generated successfully!'));
}
