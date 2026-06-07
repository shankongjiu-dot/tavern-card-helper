/**
 * PNG Service - Embed and extract JSON character data in PNG images.
 *
 * SillyTavern standard: Character card data is stored in PNG tEXt chunks
 * with keyword "chara" and the value being base64-encoded JSON.
 *
 * PNG tEXt chunk structure:
 *   - 4 bytes: data length
 *   - 4 bytes: chunk type ("tEXt")
 *   - N bytes: keyword + null byte + text
 *   - 4 bytes: CRC32 (over type + data)
 *
 * Reference: https://www.w3.org/TR/PNG/#11tEXt
 */

// ─── CRC32 ────────────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── PNG Signature ────────────────────────────────────────────────────────────
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

// ─── Create a minimal valid PNG (1x1 pixel, RGBA) ─────────────────────────────
function createMinimalPng(): Uint8Array {
  // 1x1 white pixel RGBA, uncompressed via deflate
  // IDAT data: filter byte (0) + 4 bytes RGBA = 5 bytes per row
  const rawData = new Uint8Array([0, 255, 255, 255, 255]); // filter=none, R=255, G=255, B=255, A=255

  // Use raw deflate (no zlib header for PNG)
  const deflated = deflateRaw(rawData);

  const chunks: Uint8Array[] = [];

  // PNG signature
  chunks.push(PNG_SIGNATURE);

  // IHDR chunk: width=1, height=1, bit_depth=8, color_type=6 (RGBA)
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, 1); // width
  ihdrView.setUint32(4, 1); // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  chunks.push(makeChunk('IHDR', ihdrData));

  // IDAT chunk
  chunks.push(makeChunk('IDAT', deflated));

  // IEND chunk
  chunks.push(makeChunk('IEND', new Uint8Array(0)));

  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// ─── Simple deflate (store only, no compression) ──────────────────────────────
function deflateRaw(data: Uint8Array): Uint8Array {
  // Use zlib deflate with zlib header for PNG
  // For simplicity, use stored blocks (no compression)
  // This is valid DEFLATE and PNG-compatible

  const blocks: Uint8Array[] = [];
  const maxBlockSize = 65535;
  let offset = 0;

  while (offset < data.length) {
    const remaining = data.length - offset;
    const blockSize = Math.min(remaining, maxBlockSize);
    const isLast = offset + blockSize >= data.length;

    const block = new Uint8Array(5 + blockSize);
    block[0] = isLast ? 1 : 0; // BFINAL=1 if last block, BTYPE=00 (stored)
    block[1] = blockSize & 0xff;
    block[2] = (blockSize >> 8) & 0xff;
    block[3] = ~blockSize & 0xff;
    block[4] = (~blockSize >> 8) & 0xff;
    block.set(data.subarray(offset, offset + blockSize), 5);
    blocks.push(block);
    offset += blockSize;
  }

  // Add zlib header (CMF=0x78, FLG=0x01 for no compression)
  const result: number[] = [0x78, 0x01];
  for (const block of blocks) {
    for (let i = 0; i < block.length; i++) {
      result.push(block[i]);
    }
  }

  // Adler32 checksum
  const adler = adler32(data);
  result.push((adler >> 24) & 0xff);
  result.push((adler >> 16) & 0xff);
  result.push((adler >> 8) & 0xff);
  result.push(adler & 0xff);

  return new Uint8Array(result);
}

function adler32(data: Uint8Array): number {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

// ─── Make a PNG chunk ─────────────────────────────────────────────────────────
function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const length = data.length;

  const chunk = new Uint8Array(4 + 4 + length + 4);
  const view = new DataView(chunk.buffer);

  // Length
  view.setUint32(0, length);

  // Type
  chunk.set(typeBytes, 4);

  // Data
  chunk.set(data, 8);

  // CRC (over type + data)
  const crcInput = new Uint8Array(4 + length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, 4);
  view.setUint32(8 + length, crc32(crcInput));

  return chunk;
}

// ─── Read PNG chunks ──────────────────────────────────────────────────────────
interface PngChunk {
  type: string;
  data: Uint8Array;
  offset: number;
}

function readPngChunks(buffer: ArrayBufferLike): PngChunk[] {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Verify PNG signature
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      throw new Error('不是有效的 PNG 文件');
    }
  }

  const chunks: PngChunk[] = [];
  let offset = 8;

  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) break;

    const length = view.getUint32(offset);
    const typeBytes = bytes.subarray(offset + 4, offset + 8);
    const type = new TextDecoder().decode(typeBytes);
    const data = bytes.subarray(offset + 8, offset + 8 + length);

    chunks.push({ type, data, offset });
    offset += 8 + length + 4; // length + type + data + crc
  }

  return chunks;
}

// ─── Embed JSON into PNG ─────────────────────────────────────────────────────
/**
 * Embed character card JSON into a PNG image as a tEXt chunk.
 * SillyTavern format: keyword="chara", value=base64(JSON)
 *
 * @param pngBuffer - Original PNG file buffer (or null for auto-generated minimal PNG)
 * @param cardJson - The character card data object
 * @returns New PNG buffer with embedded tEXt chunk
 */
export function embedJsonInPng(
  pngBuffer: ArrayBufferLike | null,
  cardJson: Record<string, unknown>,
): Uint8Array {
  const jsonString = JSON.stringify(cardJson);
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));

  // Build tEXt chunk data: keyword + null + text
  const keyword = 'chara';
  const textData = new TextEncoder().encode(keyword + '\0' + base64);

  if (!pngBuffer) {
    // Create minimal PNG and insert tEXt before IEND
    const minimalPng = createMinimalPng();
    const chunks = readPngChunks(minimalPng.buffer);

    const result: Uint8Array[] = [PNG_SIGNATURE];
    for (const chunk of chunks) {
      if (chunk.type === 'IEND') {
        // Insert tEXt before IEND
        result.push(makeChunk('tEXt', textData));
      }
      result.push(makeChunk(chunk.type, chunk.data));
    }

    const totalLength = result.reduce((sum, c) => sum + c.length, 0);
    const output = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of result) {
      output.set(part, offset);
      offset += part.length;
    }
    return output;
  }

  // Parse existing PNG and insert tEXt chunk before IEND
  const chunks = readPngChunks(pngBuffer);
  const result: Uint8Array[] = [PNG_SIGNATURE];
  let textInserted = false;

  for (const chunk of chunks) {
    if (chunk.type === 'IEND' && !textInserted) {
      result.push(makeChunk('tEXt', textData));
      textInserted = true;
    }
    result.push(makeChunk(chunk.type, chunk.data));
  }

  if (!textInserted) {
    // Append at end if no IEND found (malformed PNG)
    result.push(makeChunk('tEXt', textData));
  }

  const totalLength = result.reduce((sum, c) => sum + c.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of result) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

// ─── Extract JSON from PNG ────────────────────────────────────────────────────
/**
 * Extract character card JSON from a SillyTavern-format PNG.
 * Looks for tEXt chunk with keyword "chara" and decodes base64 → JSON.
 *
 * @param pngBuffer - PNG file buffer
 * @returns Parsed character card object, or null if no data found
 */
export function extractJsonFromPng(
  pngBuffer: ArrayBufferLike,
): Record<string, unknown> | null {
  const chunks = readPngChunks(pngBuffer);

  for (const chunk of chunks) {
    if (chunk.type === 'tEXt') {
      const text = new TextDecoder().decode(chunk.data);
      const nullIndex = text.indexOf('\0');
      if (nullIndex === -1) continue;

      const keyword = text.substring(0, nullIndex);
      const value = text.substring(nullIndex + 1);

      if (keyword === 'chara') {
        try {
          const jsonString = decodeURIComponent(escape(atob(value)));
          return JSON.parse(jsonString);
        } catch {
          throw new Error('PNG 中的 chara 数据解析失败（base64/JSON 格式无效）');
        }
      }
    }
  }

  return null;
}

// ─── Download helpers ─────────────────────────────────────────────────────────
/**
 * Download a PNG buffer as a file.
 */
export function downloadPng(pngData: Uint8Array, filename: string) {
  const blob = new Blob([pngData as BlobPart], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
