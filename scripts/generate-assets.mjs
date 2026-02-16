import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

// Bloom color palette
const TERRACOTTA = '#C4725A';
const TERRACOTTA_DARK = '#A85D48';
const TERRACOTTA_LIGHT = '#D4937E';
const CREAM = '#FAF6F0';
const SAGE = '#8BA888';
const SAGE_DARK = '#6E8E6A';
const GOLDEN = '#E8A948';
const GOLDEN_LIGHT = '#F0C478';

// Cherry blossom pinks
const SAKURA = '#F4A7B9';
const SAKURA_LIGHT = '#FADCE6';
const SAKURA_DARK = '#E08DA0';
const SAKURA_DEEP = '#D47A8E';
const PETAL_WHITE = '#FFF0F3';

// Helper: create a petal path at angle from center
function petal(cx, cy, angle, rx, ry, fill, opacity = 0.9) {
  return `<ellipse cx="${cx}" cy="${cy - ry * 0.6}" rx="${rx}" ry="${ry}" transform="rotate(${angle}, ${cx}, ${cy})" fill="${fill}" opacity="${opacity}"/>`;
}

// ============ APP ICON (1024x1024) ============
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${SAKURA_LIGHT}"/>
      <stop offset="50%" stop-color="${SAKURA}"/>
      <stop offset="100%" stop-color="${SAKURA_DARK}"/>
    </linearGradient>
    <linearGradient id="petalG1" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="${PETAL_WHITE}"/>
    </linearGradient>
    <linearGradient id="petalG2" x1="0.5" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PETAL_WHITE}"/>
      <stop offset="100%" stop-color="${SAKURA_LIGHT}"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="228" fill="url(#bg)"/>

  <!-- Subtle texture circles -->
  <circle cx="300" cy="300" r="200" fill="#FFFFFF" opacity="0.04"/>
  <circle cx="750" cy="700" r="180" fill="#FFFFFF" opacity="0.03"/>

  <!-- Cherry blossom flower -->
  <g transform="translate(512, 480)">
    <!-- Petals (5 petals in a circle, heart-shaped tips) -->
    <!-- Petal 1 - top -->
    <path d="M0,-60 C-30,-130 -50,-170 -15,-200 C0,-210 0,-210 15,-200 C50,-170 30,-130 0,-60Z" fill="url(#petalG1)" opacity="0.95" transform="rotate(0, 0, 0)"/>
    <!-- Petal 2 - top right -->
    <path d="M0,-60 C-30,-130 -50,-170 -15,-200 C0,-210 0,-210 15,-200 C50,-170 30,-130 0,-60Z" fill="url(#petalG2)" opacity="0.9" transform="rotate(72, 0, 0)"/>
    <!-- Petal 3 - bottom right -->
    <path d="M0,-60 C-30,-130 -50,-170 -15,-200 C0,-210 0,-210 15,-200 C50,-170 30,-130 0,-60Z" fill="url(#petalG1)" opacity="0.85" transform="rotate(144, 0, 0)"/>
    <!-- Petal 4 - bottom left -->
    <path d="M0,-60 C-30,-130 -50,-170 -15,-200 C0,-210 0,-210 15,-200 C50,-170 30,-130 0,-60Z" fill="url(#petalG2)" opacity="0.88" transform="rotate(216, 0, 0)"/>
    <!-- Petal 5 - top left -->
    <path d="M0,-60 C-30,-130 -50,-170 -15,-200 C0,-210 0,-210 15,-200 C50,-170 30,-130 0,-60Z" fill="url(#petalG1)" opacity="0.92" transform="rotate(288, 0, 0)"/>

    <!-- Center -->
    <circle cx="0" cy="0" r="28" fill="${GOLDEN_LIGHT}" opacity="0.9"/>
    <circle cx="0" cy="0" r="18" fill="${GOLDEN}" opacity="0.8"/>

    <!-- Stamens -->
    <g opacity="0.6">
      <line x1="0" y1="0" x2="-18" y2="-22" stroke="${GOLDEN}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="-18" cy="-22" r="4" fill="${GOLDEN}"/>
      <line x1="0" y1="0" x2="20" y2="-16" stroke="${GOLDEN}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="20" cy="-16" r="4" fill="${GOLDEN}"/>
      <line x1="0" y1="0" x2="8" y2="22" stroke="${GOLDEN}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="8" cy="22" r="4" fill="${GOLDEN}"/>
      <line x1="0" y1="0" x2="-14" y2="18" stroke="${GOLDEN}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="-14" cy="18" r="4" fill="${GOLDEN}"/>
    </g>
  </g>

  <!-- Small branch hint -->
  <g transform="translate(512, 480)">
    <path d="M0,30 C10,80 5,130 -10,180" stroke="${TERRACOTTA_DARK}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>
    <!-- Small leaf on branch -->
    <ellipse cx="-18" cy="155" rx="18" ry="35" transform="rotate(-30, -18, 155)" fill="${SAGE}" opacity="0.5"/>
    <ellipse cx="8" cy="120" rx="14" ry="28" transform="rotate(20, 8, 120)" fill="${SAGE}" opacity="0.4"/>
  </g>

  <!-- Falling petal accents -->
  <ellipse cx="700" cy="750" rx="18" ry="28" transform="rotate(45, 700, 750)" fill="#FFFFFF" opacity="0.2"/>
  <ellipse cx="340" cy="800" rx="12" ry="20" transform="rotate(-30, 340, 800)" fill="#FFFFFF" opacity="0.15"/>
</svg>`;

// ============ ADAPTIVE ICON FOREGROUND (1024x1024) ============
const adaptiveIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="petalG1" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="${PETAL_WHITE}"/>
    </linearGradient>
    <linearGradient id="petalG2" x1="0.5" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PETAL_WHITE}"/>
      <stop offset="100%" stop-color="${SAKURA_LIGHT}"/>
    </linearGradient>
  </defs>

  <!-- Cherry blossom (safe zone centered) -->
  <g transform="translate(512, 470)">
    <path d="M0,-55 C-28,-120 -45,-158 -14,-185 C0,-195 0,-195 14,-185 C45,-158 28,-120 0,-55Z" fill="url(#petalG1)" opacity="0.95" transform="rotate(0, 0, 0)"/>
    <path d="M0,-55 C-28,-120 -45,-158 -14,-185 C0,-195 0,-195 14,-185 C45,-158 28,-120 0,-55Z" fill="url(#petalG2)" opacity="0.9" transform="rotate(72, 0, 0)"/>
    <path d="M0,-55 C-28,-120 -45,-158 -14,-185 C0,-195 0,-195 14,-185 C45,-158 28,-120 0,-55Z" fill="url(#petalG1)" opacity="0.85" transform="rotate(144, 0, 0)"/>
    <path d="M0,-55 C-28,-120 -45,-158 -14,-185 C0,-195 0,-195 14,-185 C45,-158 28,-120 0,-55Z" fill="url(#petalG2)" opacity="0.88" transform="rotate(216, 0, 0)"/>
    <path d="M0,-55 C-28,-120 -45,-158 -14,-185 C0,-195 0,-195 14,-185 C45,-158 28,-120 0,-55Z" fill="url(#petalG1)" opacity="0.92" transform="rotate(288, 0, 0)"/>

    <circle cx="0" cy="0" r="26" fill="${GOLDEN_LIGHT}" opacity="0.9"/>
    <circle cx="0" cy="0" r="16" fill="${GOLDEN}" opacity="0.8"/>

    <g opacity="0.55">
      <line x1="0" y1="0" x2="-16" y2="-20" stroke="${GOLDEN}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="-16" cy="-20" r="3.5" fill="${GOLDEN}"/>
      <line x1="0" y1="0" x2="18" y2="-14" stroke="${GOLDEN}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="18" cy="-14" r="3.5" fill="${GOLDEN}"/>
      <line x1="0" y1="0" x2="7" y2="20" stroke="${GOLDEN}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="7" cy="20" r="3.5" fill="${GOLDEN}"/>
    </g>

    <!-- Branch -->
    <path d="M0,28 C8,70 4,115 -8,165" stroke="${TERRACOTTA_DARK}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.45"/>
    <ellipse cx="-14" cy="140" rx="15" ry="30" transform="rotate(-30, -14, 140)" fill="${SAGE}" opacity="0.45"/>
  </g>
</svg>`;

// ============ SPLASH SCREEN (1284x2778) ============
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <defs>
    <linearGradient id="splashBg" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${CREAM}"/>
      <stop offset="60%" stop-color="#FDF5EE"/>
      <stop offset="100%" stop-color="#F8EDE2"/>
    </linearGradient>
    <linearGradient id="sp1" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${SAKURA_LIGHT}"/>
      <stop offset="100%" stop-color="${SAKURA}"/>
    </linearGradient>
    <linearGradient id="sp2" x1="0.5" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${SAKURA}"/>
      <stop offset="100%" stop-color="${SAKURA_DARK}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1284" height="2778" fill="url(#splashBg)"/>

  <!-- Subtle decorative blurs -->
  <circle cx="250" cy="500" r="250" fill="${SAKURA}" opacity="0.04"/>
  <circle cx="1050" cy="2300" r="200" fill="${SAKURA}" opacity="0.03"/>
  <circle cx="900" cy="400" r="150" fill="${GOLDEN_LIGHT}" opacity="0.03"/>

  <!-- Main cherry blossom -->
  <g transform="translate(642, 1150)">
    <!-- Branch -->
    <path d="M0,55 C15,120 10,200 -15,300" stroke="${TERRACOTTA_DARK}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.45"/>
    <!-- Leaves on branch -->
    <ellipse cx="-28" cy="245" rx="24" ry="48" transform="rotate(-30, -28, 245)" fill="${SAGE}" opacity="0.5"/>
    <ellipse cx="12" cy="185" rx="20" ry="40" transform="rotate(20, 12, 185)" fill="${SAGE}" opacity="0.4"/>
    <ellipse cx="-8" cy="135" rx="15" ry="30" transform="rotate(-15, -8, 135)" fill="${SAGE}" opacity="0.35"/>

    <!-- Petals -->
    <path d="M0,-80 C-40,-175 -68,-230 -20,-275 C0,-290 0,-290 20,-275 C68,-230 40,-175 0,-80Z" fill="url(#sp1)" opacity="0.9" transform="rotate(0, 0, 0)"/>
    <path d="M0,-80 C-40,-175 -68,-230 -20,-275 C0,-290 0,-290 20,-275 C68,-230 40,-175 0,-80Z" fill="url(#sp2)" opacity="0.82" transform="rotate(72, 0, 0)"/>
    <path d="M0,-80 C-40,-175 -68,-230 -20,-275 C0,-290 0,-290 20,-275 C68,-230 40,-175 0,-80Z" fill="url(#sp1)" opacity="0.78" transform="rotate(144, 0, 0)"/>
    <path d="M0,-80 C-40,-175 -68,-230 -20,-275 C0,-290 0,-290 20,-275 C68,-230 40,-175 0,-80Z" fill="url(#sp2)" opacity="0.85" transform="rotate(216, 0, 0)"/>
    <path d="M0,-80 C-40,-175 -68,-230 -20,-275 C0,-290 0,-290 20,-275 C68,-230 40,-175 0,-80Z" fill="url(#sp1)" opacity="0.88" transform="rotate(288, 0, 0)"/>

    <!-- Center -->
    <circle cx="0" cy="0" r="38" fill="${GOLDEN_LIGHT}" opacity="0.85"/>
    <circle cx="0" cy="0" r="24" fill="${GOLDEN}" opacity="0.75"/>

    <!-- Stamens -->
    <g opacity="0.5">
      <line x1="0" y1="0" x2="-25" y2="-30" stroke="${GOLDEN}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="-25" cy="-30" r="5.5" fill="${GOLDEN}"/>
      <line x1="0" y1="0" x2="28" y2="-22" stroke="${GOLDEN}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="28" cy="-22" r="5.5" fill="${GOLDEN}"/>
      <line x1="0" y1="0" x2="12" y2="30" stroke="${GOLDEN}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="12" cy="30" r="5.5" fill="${GOLDEN}"/>
      <line x1="0" y1="0" x2="-20" y2="25" stroke="${GOLDEN}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="-20" cy="25" r="5.5" fill="${GOLDEN}"/>
    </g>
  </g>

  <!-- Falling petals -->
  <ellipse cx="350" cy="700" rx="20" ry="32" transform="rotate(35, 350, 700)" fill="${SAKURA_LIGHT}" opacity="0.3"/>
  <ellipse cx="900" cy="850" rx="16" ry="26" transform="rotate(-25, 900, 850)" fill="${SAKURA}" opacity="0.2"/>
  <ellipse cx="200" cy="1800" rx="14" ry="22" transform="rotate(50, 200, 1800)" fill="${SAKURA_LIGHT}" opacity="0.2"/>
  <ellipse cx="1000" cy="1600" rx="18" ry="28" transform="rotate(-40, 1000, 1600)" fill="${SAKURA}" opacity="0.15"/>
  <ellipse cx="500" cy="2100" rx="12" ry="20" transform="rotate(20, 500, 2100)" fill="${SAKURA_LIGHT}" opacity="0.18"/>

  <!-- App name -->
  <text x="642" y="1620" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="400" fill="${TERRACOTTA}" letter-spacing="8">Bloom</text>

  <!-- Tagline -->
  <text x="642" y="1695" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="${SAKURA_DARK}" letter-spacing="3" opacity="0.7">Tu jardín de bienestar</text>
</svg>`;

// ============ FAVICON (48x48) ============
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${SAKURA_LIGHT}"/>
      <stop offset="100%" stop-color="${SAKURA_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" fill="url(#fbg)"/>
  <g transform="translate(24, 22)">
    <!-- Simplified 5-petal sakura -->
    <ellipse cx="0" cy="-9" rx="4" ry="9" fill="#FFFFFF" opacity="0.95" transform="rotate(0, 0, 0)"/>
    <ellipse cx="0" cy="-9" rx="4" ry="9" fill="#FFFFFF" opacity="0.88" transform="rotate(72, 0, 0)"/>
    <ellipse cx="0" cy="-9" rx="4" ry="9" fill="#FFFFFF" opacity="0.82" transform="rotate(144, 0, 0)"/>
    <ellipse cx="0" cy="-9" rx="4" ry="9" fill="#FFFFFF" opacity="0.85" transform="rotate(216, 0, 0)"/>
    <ellipse cx="0" cy="-9" rx="4" ry="9" fill="#FFFFFF" opacity="0.9" transform="rotate(288, 0, 0)"/>
    <circle cx="0" cy="0" r="3" fill="${GOLDEN}" opacity="0.9"/>
  </g>
</svg>`;

async function generate() {
  console.log('Generating icon.png (1024x1024)...');
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(join(assetsDir, 'icon.png'));

  console.log('Generating adaptive-icon.png (1024x1024)...');
  await sharp(Buffer.from(adaptiveIconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(join(assetsDir, 'adaptive-icon.png'));

  console.log('Generating splash-icon.png (1284x2778)...');
  await sharp(Buffer.from(splashSvg))
    .resize(1284, 2778)
    .png()
    .toFile(join(assetsDir, 'splash-icon.png'));

  console.log('Generating favicon.png (48x48)...');
  await sharp(Buffer.from(faviconSvg))
    .resize(48, 48)
    .png()
    .toFile(join(assetsDir, 'favicon.png'));

  console.log('Done! All cherry blossom assets generated.');
}

generate().catch(console.error);
