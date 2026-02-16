#!/usr/bin/env node

/**
 * Generate app icons and splash screen for Bloom (emotional wellness calendar)
 *
 * Design identity: "botanical warm"
 *   Primary:    Terracotta  #C4725A
 *   Secondary:  Sage green  #8BA888
 *   Accent:     Golden amber #E8A948
 *   Background: Warm cream   #FAF6F0
 *   Symbol:     Stylized leaf / plant
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// ─── Colors ───────────────────────────────────────────────────────────
const TERRACOTTA = '#C4725A';
const SAGE = '#8BA888';
const AMBER = '#E8A948';
const CREAM = '#FAF6F0';

// ─── SVG helpers ──────────────────────────────────────────────────────

/**
 * Builds a stylized leaf / sprout motif.
 * Three leaves growing from a central stem, rendered in cream on terracotta.
 * Designed for a 1024x1024 canvas but centered within the safe area.
 */
function buildLeafGroup(scale = 1, cx = 512, cy = 512, color = CREAM) {
  // The leaf is designed around a 0,0 origin and then translated.
  // We'll create a graceful three-leaf sprout with a gentle stem.
  const s = scale;

  return `
    <g transform="translate(${cx}, ${cy}) scale(${s})">
      <!-- Stem -->
      <path d="M 0 160 Q 0 60, 0 -40"
            stroke="${color}" stroke-width="18" fill="none"
            stroke-linecap="round"/>

      <!-- Central large leaf (pointing up-right) -->
      <path d="M 0 -40
               Q -20 -180, 40 -280
               Q 80 -320, 120 -280
               Q 160 -220, 100 -140
               Q 60 -80, 0 -40 Z"
            fill="${color}" opacity="0.95"/>
      <!-- Central leaf vein -->
      <path d="M 10 -60 Q 50 -160, 70 -240"
            stroke="${TERRACOTTA}" stroke-width="5" fill="none"
            stroke-linecap="round" opacity="0.35"/>

      <!-- Left leaf (pointing up-left) -->
      <path d="M -5 20
               Q -60 -60, -140 -120
               Q -180 -150, -170 -100
               Q -155 -40, -100 0
               Q -50 30, -5 20 Z"
            fill="${color}" opacity="0.85"/>
      <!-- Left leaf vein -->
      <path d="M -15 10 Q -70 -30, -130 -80"
            stroke="${TERRACOTTA}" stroke-width="4" fill="none"
            stroke-linecap="round" opacity="0.3"/>

      <!-- Right leaf (pointing right, slightly down) -->
      <path d="M 5 30
               Q 70 -20, 150 -40
               Q 190 -50, 175 -10
               Q 155 40, 100 55
               Q 50 60, 5 30 Z"
            fill="${color}" opacity="0.85"/>
      <!-- Right leaf vein -->
      <path d="M 15 20 Q 80 0, 140 -20"
            stroke="${TERRACOTTA}" stroke-width="4" fill="none"
            stroke-linecap="round" opacity="0.3"/>

      <!-- Small accent dot / bud at the tip of the stem -->
      <circle cx="0" cy="170" r="12" fill="${AMBER}" opacity="0.7"/>
    </g>
  `;
}

/**
 * Main app icon (1024x1024):
 * Terracotta rounded square with a cream leaf sprout in the center.
 */
function generateIconSVG(size = 1024) {
  const r = Math.round(size * 0.22); // corner radius (~225px)
  const padding = Math.round(size * 0.02);
  const leafScale = size / 1024;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Subtle radial gradient for depth -->
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#D08068"/>
      <stop offset="100%" stop-color="${TERRACOTTA}"/>
    </radialGradient>
    <!-- Soft inner shadow -->
    <filter id="innerGlow">
      <feGaussianBlur stdDeviation="30" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background rounded rectangle -->
  <rect x="${padding}" y="${padding}"
        width="${size - padding * 2}" height="${size - padding * 2}"
        rx="${r}" ry="${r}"
        fill="url(#bg)"/>

  <!-- Subtle border highlight -->
  <rect x="${padding}" y="${padding}"
        width="${size - padding * 2}" height="${size - padding * 2}"
        rx="${r}" ry="${r}"
        fill="none" stroke="${CREAM}" stroke-width="3" opacity="0.15"/>

  <!-- Leaf motif -->
  ${buildLeafGroup(leafScale, size / 2, size * 0.52, CREAM)}
</svg>`.trim();
}

/**
 * Adaptive icon foreground (1024x1024):
 * Android adaptive icons use a 108dp canvas with a 72dp safe zone (66.67%).
 * We render the leaf centered in the safe zone, with transparent padding.
 */
function generateAdaptiveIconSVG(size = 1024) {
  const leafScale = (size / 1024) * 0.72; // Scale down to fit safe zone

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="abg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#D08068"/>
      <stop offset="100%" stop-color="${TERRACOTTA}"/>
    </radialGradient>
  </defs>

  <!-- Full bleed background for adaptive icon -->
  <rect x="0" y="0" width="${size}" height="${size}" fill="url(#abg)"/>

  <!-- Leaf motif (slightly smaller to stay in safe zone) -->
  ${buildLeafGroup(leafScale, size / 2, size * 0.52, CREAM)}
</svg>`.trim();
}

/**
 * Splash icon (200x200):
 * Clean, minimal leaf icon on transparent background.
 * Uses sage green + terracotta for a subtle two-tone look.
 */
function generateSplashIconSVG(size = 200) {
  const s = size / 1024;
  const cx = size / 2;
  const cy = size / 2;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="translate(${cx}, ${cy}) scale(${s * 1.8})">
    <!-- Stem -->
    <path d="M 0 160 Q 0 60, 0 -40"
          stroke="${TERRACOTTA}" stroke-width="20" fill="none"
          stroke-linecap="round"/>

    <!-- Central large leaf -->
    <path d="M 0 -40
             Q -20 -180, 40 -280
             Q 80 -320, 120 -280
             Q 160 -220, 100 -140
             Q 60 -80, 0 -40 Z"
          fill="${SAGE}" opacity="0.95"/>
    <!-- Central leaf vein -->
    <path d="M 10 -60 Q 50 -160, 70 -240"
          stroke="${CREAM}" stroke-width="6" fill="none"
          stroke-linecap="round" opacity="0.5"/>

    <!-- Left leaf -->
    <path d="M -5 20
             Q -60 -60, -140 -120
             Q -180 -150, -170 -100
             Q -155 -40, -100 0
             Q -50 30, -5 20 Z"
          fill="${TERRACOTTA}" opacity="0.85"/>
    <!-- Left leaf vein -->
    <path d="M -15 10 Q -70 -30, -130 -80"
          stroke="${CREAM}" stroke-width="5" fill="none"
          stroke-linecap="round" opacity="0.4"/>

    <!-- Right leaf -->
    <path d="M 5 30
             Q 70 -20, 150 -40
             Q 190 -50, 175 -10
             Q 155 40, 100 55
             Q 50 60, 5 30 Z"
          fill="${SAGE}" opacity="0.8"/>
    <!-- Right leaf vein -->
    <path d="M 15 20 Q 80 0, 140 -20"
          stroke="${CREAM}" stroke-width="5" fill="none"
          stroke-linecap="round" opacity="0.4"/>

    <!-- Accent dot at base -->
    <circle cx="0" cy="170" r="14" fill="${AMBER}" opacity="0.8"/>
  </g>
</svg>`.trim();
}

// ─── Generate PNGs ────────────────────────────────────────────────────

async function generate() {
  console.log('Generating Bloom app icons...\n');

  // 1) App icon (1024x1024)
  const iconSvg = generateIconSVG(1024);
  const iconPath = path.join(ASSETS_DIR, 'icon.png');
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(iconPath);
  console.log(`  [OK] icon.png (1024x1024) -> ${iconPath}`);

  // 2) Adaptive icon (1024x1024)
  const adaptiveSvg = generateAdaptiveIconSVG(1024);
  const adaptivePath = path.join(ASSETS_DIR, 'adaptive-icon.png');
  await sharp(Buffer.from(adaptiveSvg))
    .resize(1024, 1024)
    .png()
    .toFile(adaptivePath);
  console.log(`  [OK] adaptive-icon.png (1024x1024) -> ${adaptivePath}`);

  // 3) Splash icon (200x200)
  const splashSvg = generateSplashIconSVG(200);
  const splashPath = path.join(ASSETS_DIR, 'splash-icon.png');
  await sharp(Buffer.from(splashSvg))
    .resize(200, 200)
    .png()
    .toFile(splashPath);
  console.log(`  [OK] splash-icon.png (200x200) -> ${splashPath}`);

  // Also save SVGs for reference / future editing
  const svgDir = path.join(ASSETS_DIR, 'svg-sources');
  if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true });
  }
  fs.writeFileSync(path.join(svgDir, 'icon.svg'), iconSvg);
  fs.writeFileSync(path.join(svgDir, 'adaptive-icon.svg'), adaptiveSvg);
  fs.writeFileSync(path.join(svgDir, 'splash-icon.svg'), splashSvg);
  console.log(`\n  SVG sources saved to ${svgDir}/`);

  console.log('\nDone!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
