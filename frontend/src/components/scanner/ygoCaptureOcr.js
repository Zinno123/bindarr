import { recognizeCardText } from '../../utils/nativeDetector.js';
import { combineYgoEvidence, ygoCodes } from '../../utils/ygoScanOcr.js';

// Each region is cropped from the original, high-resolution camera capture.
// Never use the square 448px artwork embedding as the OCR input.
function region(source, x, y, w, h) {
  const canvas = document.createElement('canvas');
  const sw = Math.max(1, Math.floor(source.width * w));
  const sh = Math.max(1, Math.floor(source.height * h));
  const scale = Math.min(2, 1200 / sw);
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  canvas.getContext('2d').drawImage(source, Math.floor(source.width*x), Math.floor(source.height*y), sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}
export async function recognizeYgoEvidence(canvas) {
  const texts = [await recognizeCardText(canvas)];
  // Standard card codes sit near the artwork's lower edge; Pendulum and some
  // older layouts use a different position. Retain the full-frame evidence.
  texts.push(await recognizeCardText(region(canvas, 0.22, 0.42, 0.78, 0.32)));
  if (!texts.some(t => ygoCodes(t).length)) {
    texts.push(await recognizeCardText(region(canvas, 0, 0.65, 1, 0.35)));
  }
  return combineYgoEvidence(texts);
}
