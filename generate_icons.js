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

// Generate Premium Anti-Aliased Kin-paku Gold Extension Icon (32-bit RGBA PNG)
function generatePremiumIcon(size) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawBytes = [];
  const radius = size / 2;
  const cornerRadius = size * 0.24;

  for (let y = 0; y < size; y++) {
    rawBytes.push(0); // scanline filter 0
    for (let x = 0; x < size; x++) {
      // Rounded squircle math with smooth anti-aliased edge
      const dx = Math.abs(x - size / 2 + 0.5) - (size / 2 - cornerRadius);
      const dy = Math.abs(y - size / 2 + 0.5) - (size / 2 - cornerRadius);
      const dist = Math.sqrt(Math.max(0, dx) ** 2 + Math.max(0, dy) ** 2);
      
      // Anti-aliasing factor (0.0 to 1.0)
      const edgeDist = cornerRadius - dist;
      let alpha = 1.0;
      if (edgeDist < 0) alpha = 0.0;
      else if (edgeDist < 1.0) alpha = edgeDist;

      if (alpha <= 0) {
        rawBytes.push(0, 0, 0, 0);
        continue;
      }

      // Outer Kin-paku Metallic Gold Bevel Border (1.5px to 3px)
      const borderThickness = Math.max(1.2, size * 0.06);
      const isOuterBevel = dist >= cornerRadius - borderThickness;

      // Inside Split-Browser / Notebook Emblem Motif
      const pad = size * 0.22;
      const isNotebookBody = x >= pad && x <= size - pad && y >= pad && y <= size - pad;
      
      // Vertical Split line (representing SidePanel split)
      const splitX = Math.floor(size * 0.46);
      const isSplitLine = isNotebookBody && (x === splitX || x === splitX + 1);

      // Gold Note lines on right pane of emblem
      const lineSpacing = Math.max(2, Math.floor(size / 5));
      const isGoldNoteLine = isNotebookBody && x > splitX + 2 && (y % lineSpacing === 0) && y >= pad + 2 && y <= size - pad - 2;

      // Metallic Gold Foil Color Gradient (diagonal light sheen)
      const sheenT = ((x + y) / (2 * size));
      // Shiny Gold: #FFDF73 -> #D4AF37 -> #AA771C
      const goldR = Math.round(255 - sheenT * 85);
      const goldG = Math.round(223 - sheenT * 85);
      const goldB = Math.round(115 - sheenT * 85);

      if (isOuterBevel) {
        // Shimmering Gold Foil Rim
        rawBytes.push(goldR, goldG, goldB, Math.round(alpha * 255));
      } else if (isGoldNoteLine || isSplitLine) {
        // Bright Kin-paku Highlight Emblem
        rawBytes.push(255, 230, 130, Math.round(alpha * 255));
      } else if (isNotebookBody) {
        if (x < splitX) {
          // Left web browser pane inside emblem (dark muted obsidian)
          rawBytes.push(28, 24, 20, Math.round(alpha * 255));
        } else {
          // Right SideNotes pane inside emblem (rich lacquer black)
          rawBytes.push(16, 14, 11, Math.round(alpha * 255));
        }
      } else {
        // Deep Obsidian Lacquer Background Gradient (#080705 to #181410)
        const bgR = Math.round(8 + sheenT * 20);
        const bgG = Math.round(7 + sheenT * 16);
        const bgB = Math.round(5 + sheenT * 12);
        rawBytes.push(bgR, bgG, bgB, Math.round(alpha * 255));
      }
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(rawBytes));
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuf = generatePremiumIcon(size);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`✨ Generated Premium Kin-paku Icon: ${filePath} (${pngBuf.length} bytes)`);
});
