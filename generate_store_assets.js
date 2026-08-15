const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 helper
function crc32() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return function(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  };
}
const calcCrc32 = crc32();

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = calcCrc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Create 24-bit RGB PNG (No Alpha)
function create24BitRGBPNG(width, height, pixelFn) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 2; // Color type 2: RGB (NO ALPHA)
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const scanlineLength = 1 + width * 3;
  const rawBytes = Buffer.alloc(height * scanlineLength);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y, width, height);
      rawBytes[offset++] = r & 0xff;
      rawBytes[offset++] = g & 0xff;
      rawBytes[offset++] = b & 0xff;
    }
  }

  const compressedData = zlib.deflateSync(rawBytes, { level: 6 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const storeAssetsDir = path.join(__dirname, 'docs', 'store-assets');
if (!fs.existsSync(storeAssetsDir)) {
  fs.mkdirSync(storeAssetsDir, { recursive: true });
}

console.log('🎨 Generating Realistic Chrome Browser Screenshots & Promo Tiles (24-bit PNG)...');

// Palette Declarations
const CHROME_BG_DARK = [32, 33, 36];
const CHROME_TAB_ACTIVE = [45, 46, 50];
const CHROME_TAB_INACTIVE = [24, 25, 28];
const CHROME_ADDRESS_BAR = [20, 21, 24];
const CHROME_BORDER = [50, 52, 58];

const KINPAKU_GOLD = [212, 175, 55];
const KINPAKU_LIGHT = [229, 193, 88];
const LACQUER_BG = [7, 6, 4];
const SIDE_PANEL_BG = [18, 16, 13];
const SIDE_PANEL_DRAWER = [14, 12, 10];
const BORDER_DARK = [41, 36, 30];
const TEXT_WHITE = [245, 242, 235];
const TEXT_MUTED = [115, 107, 94];

const PARCHMENT_BG = [247, 244, 239];
const PARCHMENT_PANEL = [255, 255, 255];
const PARCHMENT_DRAWER = [240, 236, 228];
const PARCHMENT_GOLD = [184, 134, 11];
const PARCHMENT_BORDER = [227, 220, 209];

// 1. Screenshot 1: Overview (1280x800) - Realistic Chrome Window with Side Panel
const screenshot1 = create24BitRGBPNG(1280, 800, (x, y, w, h) => {
  if (y < 40) {
    if (x > 12 && x < 24 && y > 14 && y < 26) return [235, 87, 87];
    if (x > 32 && x < 44 && y > 14 && y < 26) return [242, 201, 76];
    if (x > 52 && x < 64 && y > 14 && y < 26) return [39, 174, 96];

    if (x >= 90 && x <= 310 && y >= 8) {
      if (x > 110 && x < 120 && y > 18 && y < 28) return KINPAKU_GOLD;
      return CHROME_TAB_ACTIVE;
    }
    if (x >= 315 && x <= 450 && y >= 12) return CHROME_TAB_INACTIVE;
    return CHROME_BG_DARK;
  }

  if (y >= 40 && y < 80) {
    if (x > 15 && x < 90 && y > 52 && y < 68) return [140, 145, 155];
    if (x >= 100 && x <= 1150 && y >= 48 && y <= 72) {
      if (x > 110 && x < 120 && y > 56 && y < 64) return [39, 174, 96];
      return CHROME_ADDRESS_BAR;
    }
    if (x >= 1180 && x <= 1210 && y >= 48 && y <= 72) return KINPAKU_GOLD;
    if (x >= 1220 && x <= 1250 && y >= 48 && y <= 72) return CHROME_TAB_ACTIVE;
    return CHROME_BG_DARK;
  }

  if (y >= 80 && y <= 81) return CHROME_BORDER;

  const isSidePanel = x >= 860;
  if (!isSidePanel) {
    if (x === 859) return BORDER_DARK;
    const isHeroImage = y > 120 && y < 300 && x > 40 && x < 820;
    const isArticleHeadline = y > 320 && y < 355 && x > 40 && x < 750;
    const isParagraphLine = (y > 380 && y < 388 && x > 40 && x < 800) ||
                           (y > 398 && y < 406 && x > 40 && x < 780) ||
                           (y > 416 && y < 424 && x > 40 && x < 810) ||
                           (y > 434 && y < 442 && x > 40 && x < 650);

    if (isHeroImage) return [25, 22, 18];
    if (isArticleHeadline) return [240, 235, 225];
    if (isParagraphLine) return [140, 132, 120];
    return [12, 10, 8];
  }

  const px = x - 860;
  const isTopBar = y >= 82 && y < 130;
  const isDrawer = px < 160;
  const isEditorHeader = !isTopBar && y < 200 && !isDrawer;

  if (isTopBar) {
    if (px > 10 && px < 35 && y > 95 && y < 118) return KINPAKU_GOLD;
    if (px > 310 && px < 365 && y > 95 && y < 115) return KINPAKU_GOLD;
    if (px > 375 && px < 415 && y > 95 && y < 115) return KINPAKU_GOLD;
    return SIDE_PANEL_BG;
  }

  if (isDrawer) {
    if (y > 200 && y < 260) {
      if (px < 4) return KINPAKU_GOLD;
      return [35, 28, 12];
    }
    if (y > 270 && y < 320) return [22, 19, 15];
    if (y > 330 && y < 380) return [22, 19, 15];
    return SIDE_PANEL_DRAWER;
  }

  if (isEditorHeader) {
    if (px > 180 && px < 380 && y > 140 && y < 165) return TEXT_WHITE;
    if (y > 175 && y < 195) return [30, 26, 20];
    return SIDE_PANEL_BG;
  }

  const isHeadingLine = y > 220 && y < 245 && px > 180 && px < 380;
  const isQuoteRail = px >= 180 && px <= 184 && y > 270 && y < 340;
  const isQuoteBox = px > 184 && px < 400 && y > 270 && y < 340;
  const isCodeBlock = px > 180 && px < 410 && y > 360 && y < 450;

  if (isHeadingLine) return KINPAKU_GOLD;
  if (isQuoteRail) return KINPAKU_GOLD;
  if (isQuoteBox) return [35, 28, 12];
  if (isCodeBlock) return SIDE_PANEL_BG;

  return LACQUER_BG;
});
fs.writeFileSync(path.join(storeAssetsDir, 'screenshot-1-overview.png'), screenshot1);
console.log('  ✓ Generated docs/store-assets/screenshot-1-overview.png (1280x800)');

// 2. Screenshot 2: Markdown Preview Mode (1280x800)
const screenshot2 = create24BitRGBPNG(1280, 800, (x, y, w, h) => {
  if (y < 40) return CHROME_BG_DARK;
  if (y >= 40 && y < 80) return CHROME_BG_DARK;
  if (y >= 80 && y <= 81) return CHROME_BORDER;

  const isSidePanel = x >= 860;
  if (!isSidePanel) return [10, 8, 6];

  const px = x - 860;
  const isTopBar = y >= 82 && y < 130;
  const isDrawer = px < 160;

  if (isTopBar) return SIDE_PANEL_BG;
  if (isDrawer) return SIDE_PANEL_DRAWER;

  const isPreviewToggleActive = px > 350 && px < 400 && y > 175 && y < 195;
  if (isPreviewToggleActive) return KINPAKU_GOLD;
  if (y < 200) return SIDE_PANEL_BG;

  const isH1 = y > 220 && y < 248 && px > 180 && px < 380;
  const isSubH2 = y > 260 && y < 280 && px > 180 && px < 320;
  const isChecklist = y > 300 && y < 350 && px > 180 && px < 360;
  const isCheckSquare = isChecklist && px > 180 && px < 192 && (y % 20 < 12);
  const isQuoteRail = px >= 180 && px <= 184 && y > 370 && y < 440;
  const isQuoteBody = px > 184 && px < 410 && y > 370 && y < 440;
  const isCodePre = px > 180 && px < 410 && y > 460 && y < 580;

  if (isH1) return KINPAKU_GOLD;
  if (isSubH2) return KINPAKU_LIGHT;
  if (isCheckSquare) return KINPAKU_GOLD;
  if (isQuoteRail) return KINPAKU_GOLD;
  if (isQuoteBody) return [35, 28, 12];
  if (isCodePre) return SIDE_PANEL_BG;

  return LACQUER_BG;
});
fs.writeFileSync(path.join(storeAssetsDir, 'screenshot-2-markdown-preview.png'), screenshot2);
console.log('  ✓ Generated docs/store-assets/screenshot-2-markdown-preview.png (1280x800)');

// 3. Screenshot 3: Web Capture & Context Menu (1280x800)
const screenshot3 = create24BitRGBPNG(1280, 800, (x, y, w, h) => {
  if (y < 80) return CHROME_BG_DARK;

  const isSidePanel = x >= 860;
  if (isSidePanel) {
    if (y < 130) return SIDE_PANEL_BG;
    return LACQUER_BG;
  }

  const isHighlightedSelection = x > 120 && x < 650 && y > 240 && y < 270;
  const isContextMenu = x > 420 && x < 720 && y > 260 && y < 420;
  const isContextItemHover = isContextMenu && y > 295 && y < 325;

  if (isContextMenu) {
    if (isContextItemHover) return [60, 48, 18];
    return [26, 23, 18];
  }
  if (isHighlightedSelection) return [80, 65, 20];

  return [10, 8, 6];
});
fs.writeFileSync(path.join(storeAssetsDir, 'screenshot-3-web-capture.png'), screenshot3);
console.log('  ✓ Generated docs/store-assets/screenshot-3-web-capture.png (1280x800)');

// 4. Screenshot 4: Sync & Settings Modal (1280x800)
const screenshot4 = create24BitRGBPNG(1280, 800, (x, y, w, h) => {
  if (y < 80) return CHROME_BG_DARK;

  const isModal = x > 400 && x < 880 && y > 140 && y < 660;
  const isModalHeader = isModal && y < 195;
  const isGistButton = isModal && y > 530 && y < 570 && x > 440 && x < 640;
  const isSaveButton = isModal && y > 605 && y < 640 && x > 750 && x < 850;

  if (isSaveButton) return KINPAKU_GOLD;
  if (isGistButton) return KINPAKU_GOLD;
  if (isModalHeader) return [30, 25, 18];
  if (isModal) return SIDE_PANEL_BG;

  return [4, 3, 2];
});
fs.writeFileSync(path.join(storeAssetsDir, 'screenshot-4-sync-settings.png'), screenshot4);
console.log('  ✓ Generated docs/store-assets/screenshot-4-sync-settings.png (1280x800)');

// 5. Screenshot 5: Japanese Parchment Light Mode (1280x800)
const screenshot5 = create24BitRGBPNG(1280, 800, (x, y, w, h) => {
  if (y < 40) return [220, 215, 205];
  if (y >= 40 && y < 80) return [235, 230, 220];
  if (y >= 80 && y <= 81) return PARCHMENT_BORDER;

  const isSidePanel = x >= 860;
  if (!isSidePanel) return [242, 238, 230];

  const px = x - 860;
  const isTopBar = y >= 82 && y < 130;
  const isDrawer = px < 160;

  if (isTopBar) return PARCHMENT_PANEL;
  if (isDrawer) return PARCHMENT_DRAWER;

  if (y < 200) return PARCHMENT_PANEL;
  if (px > 180 && px < 380 && y > 220 && y < 245) return PARCHMENT_GOLD;
  return PARCHMENT_BG;
});
fs.writeFileSync(path.join(storeAssetsDir, 'screenshot-5-light-mode.png'), screenshot5);
console.log('  ✓ Generated docs/store-assets/screenshot-5-light-mode.png (1280x800)');

// 6. Small Promo Tile (440x280)
const smallPromo = create24BitRGBPNG(440, 280, (x, y, w, h) => {
  const isBorder = x < 4 || x > w - 5 || y < 4 || y > h - 5;
  const isHeaderBadge = x > 30 && x < 150 && y > 30 && y < 55;
  const isTitleLine = x > 30 && x < 350 && y > 80 && y < 120;
  const isSubLine = x > 30 && x < 280 && y > 135 && y < 150;
  
  const isPanelFrame = x > 290 && x < 410 && y > 100 && y < 250;
  const isPanelHeader = isPanelFrame && y < 140;
  const isGoldCard = isPanelFrame && y > 155 && y < 195;

  if (isBorder) return KINPAKU_GOLD;
  if (isHeaderBadge) return KINPAKU_GOLD;
  if (isTitleLine) return TEXT_WHITE;
  if (isSubLine) return KINPAKU_LIGHT;
  if (isGoldCard) return KINPAKU_GOLD;
  if (isPanelHeader) return [30, 25, 18];
  if (isPanelFrame) return SIDE_PANEL_BG;

  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / Math.sqrt(cx ** 2 + cy ** 2);
  const r = Math.round(18 - dist * 10);
  const g = Math.round(16 - dist * 10);
  const b = Math.round(13 - dist * 9);
  return [r, g, b];
});
fs.writeFileSync(path.join(storeAssetsDir, 'small-promo-tile.png'), smallPromo);
console.log('  ✓ Generated docs/store-assets/small-promo-tile.png (440x280)');

// 7. Marquee Promo Tile (1400x560)
const marqueePromo = create24BitRGBPNG(1400, 560, (x, y, w, h) => {
  const isBorder = x < 6 || x > w - 7 || y < 6 || y > h - 7;
  const isBadge = x > 100 && x < 280 && y > 80 && y < 120;
  const isTitle = x > 100 && x < 900 && y > 160 && y < 240;
  const isSub = x > 100 && x < 800 && y > 270 && y < 310;

  const isMockupWindow = x > 900 && x < 1340 && y > 90 && y < 490;
  const isMockupChromeHeader = isMockupWindow && y < 135;
  const isMockupSidePanel = isMockupWindow && x > 1150;
  const isMockupGoldActiveCard = isMockupSidePanel && y > 180 && y < 240;

  if (isBorder) return KINPAKU_GOLD;
  if (isBadge) return KINPAKU_GOLD;
  if (isTitle) return TEXT_WHITE;
  if (isSub) return KINPAKU_LIGHT;
  if (isMockupGoldActiveCard) return KINPAKU_GOLD;
  if (isMockupSidePanel) return SIDE_PANEL_BG;
  if (isMockupChromeHeader) return CHROME_BG_DARK;
  if (isMockupWindow) return [12, 10, 8];

  const t = (x + y) / (w + h);
  const r = Math.round(7 + t * 15);
  const g = Math.round(6 + t * 12);
  const b = Math.round(4 + t * 8);
  return [r, g, b];
});
fs.writeFileSync(path.join(storeAssetsDir, 'marquee-promo-tile.png'), marqueePromo);
console.log('  ✓ Generated docs/store-assets/marquee-promo-tile.png (1400x560)');

console.log('\n✨ All Realistic Chrome Browser Screenshots & Promo Tiles Generated!');
