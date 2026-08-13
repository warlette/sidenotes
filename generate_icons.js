const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Utility to calculate CRC32 for PNG chunks
function crc32(buf) {
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

function generatePNG(size, primaryColor, accentColor) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw RGBA pixels with scanline filter 0
  const rawBytes = [];
  const radius = size / 2;
  const cornerRadius = size * 0.2;

  for (let y = 0; y < size; y++) {
    rawBytes.push(0); // scanline filter type 0
    for (let x = 0; x < size; x++) {
      // Rounded rectangle test
      const dx = Math.abs(x - size / 2 + 0.5) - (size / 2 - cornerRadius);
      const dy = Math.abs(y - size / 2 + 0.5) - (size / 2 - cornerRadius);
      const dist = Math.sqrt(Math.max(0, dx) ** 2 + Math.max(0, dy) ** 2);
      const isInsideCard = dist <= cornerRadius;

      // Draw a notebook / pen icon motif inside
      const notePadding = size * 0.2;
      const isNoteArea = x >= notePadding && x <= size - notePadding && y >= notePadding && y <= size - notePadding;
      
      // Horizontal note lines motif
      const lineSpacing = Math.max(2, Math.floor(size / 6));
      const isNoteLine = isNoteArea && (y % lineSpacing === 0) && x >= notePadding + 2 && x <= size - notePadding - 4;

      if (!isInsideCard) {
        // Transparent outer border
        rawBytes.push(0, 0, 0, 0);
      } else if (isNoteLine) {
        // Line color (light vibrant cyan)
        rawBytes.push(56, 189, 248, 255);
      } else {
        // Gradient background from indigo to violet
        const t = (x + y) / (2 * size);
        const r = Math.round(99 + (139 - 99) * t);
        const g = Math.round(102 + (92 - 102) * t);
        const b = Math.round(241 + (246 - 241) * t);
        rawBytes.push(r, g, b, 255);
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
  const pngBuf = generatePNG(size);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Generated ${filePath} (${pngBuf.length} bytes)`);
});
