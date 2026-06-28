/**
 * Image optimization script
 * Run: node scripts/optimize-images.mjs
 *
 * Converts all PNG/JPG files in public/ to WebP format.
 * Originals are kept as fallbacks for older browsers.
 * WebP files are typically 60-80% smaller than PNGs.
 */
import sharp from "sharp";
import { readdirSync, statSync } from "fs";
import { join, extname, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, "..", "public");

const SUPPORTED = [".png", ".jpg", ".jpeg"];
const WEBP_QUALITY = 82; // 82% is near-lossless for product photos

async function optimizeFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED.includes(ext)) return;

  const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, ".webp");
  const fileName = basename(filePath);

  try {
    const originalSize = statSync(filePath).size;
    
    await sharp(filePath)
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toFile(webpPath);

    const webpSize = statSync(webpPath).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);
    const origKB = (originalSize / 1024).toFixed(0);
    const webpKB = (webpSize / 1024).toFixed(0);

    console.log(`✅ ${fileName}: ${origKB}KB → ${webpKB}KB (saved ${savings}%)`);
  } catch (err) {
    console.error(`❌ Failed to convert ${fileName}:`, err.message);
  }
}

async function processDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      await processDir(fullPath);
    } else {
      await optimizeFile(fullPath);
    }
  }
}

console.log("🖼️  Converting images to WebP...\n");
await processDir(PUBLIC_DIR);
console.log("\n✨ Done! WebP versions created alongside originals.");
console.log("   Update your <img> tags to use .webp files or use the <picture> element.");
