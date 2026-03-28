// Generates simple PNG icons using Node built-ins only
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBytes = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeBytes, data]);
  const crcVal = crc32(combined);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBytes, data, crc]);
}

function makePNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Build raw scanlines with filter byte 0
  const rowSize = size * 3;
  const rawData = Buffer.alloc(size * (rowSize + 1));
  for (let y = 0; y < size; y++) {
    rawData[y * (rowSize + 1)] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const offset = y * (rowSize + 1) + 1 + x * 3;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Orange: #f97316 = rgb(249, 115, 22)
const r = 249, g = 115, b = 22;

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-192.png'), makePNG(192, r, g, b));
console.log('✓ icon-192.png generated');

fs.writeFileSync(path.join(outDir, 'icon-512.png'), makePNG(512, r, g, b));
console.log('✓ icon-512.png generated');
