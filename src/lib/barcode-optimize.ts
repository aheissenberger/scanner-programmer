import { BinaryBitmap, GlobalHistogramBinarizer, HybridBinarizer, RGBLuminanceSource } from "@zxing/library";

// Load an Image/Blob/HTMLImageElement into a canvas
async function loadToCanvas(src) {
  const img = await (async () => {
    if (src instanceof HTMLImageElement) return src;
    const url = src instanceof Blob ? URL.createObjectURL(src) : src;
    const im = new Image(); im.decoding = 'async'; im.src = url;
    await im.decode(); if (src instanceof Blob) URL.revokeObjectURL(url);
    return im;
  })();

  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return c;
}

// Detect the tight bounding box (non-white / non-transparent)
function autoCrop(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width:w, height:h } = canvas;
  const { data } = ctx.getImageData(0,0,w,h);
  const isInk = (i)=> {
    const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
    if (a < 10) return false;                  // transparent
    const y = 0.2126*r + 0.7152*g + 0.0722*b;  // luma
    return y < 250;                             // not near-white
  };
  let minX=w, minY=h, maxX=0, maxY=0, found=false;
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    const i = (y*w + x)*4;
    if (isInk(i)) { found=true; if (x<minX)minX=x; if (y<minY)minY=y;
      if (x>maxX)maxX=x; if (y>maxY)maxY=y; }
  }
  if (!found) return canvas;
  const cw = maxX-minX+1, ch = maxY-minY+1;
  const out = document.createElement('canvas');
  out.width=cw; out.height=ch;
  out.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
  return out;
}

// Nearest-neighbor upscale to make bars ≥2 px
function upscaleNearest(canvas:HTMLCanvasElement, minHeight=180) {
  const s = Math.max(2, Math.ceil(minHeight / canvas.height)); // scale factor
  const out = document.createElement('canvas');
  out.width = canvas.width * s;
  out.height = canvas.height * s;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false; // critical for sharp bars
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

// Otsu binarization
function binarizeOtsu(canvas:HTMLCanvasElement) {
  const { width:w, height:h } = canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0,0,w,h);
  const d = img.data;

  // grayscale + histogram
  const hist = new Uint32Array(256);
  const gray = new Uint8ClampedArray(w*h);
  for (let i=0, p=0; i<d.length; i+=4, p++) {
    const y = Math.round(0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]);
    gray[p]=y; hist[y]++; 
  }
  // Otsu threshold
  let sum=0, sumB=0, wB=0, wF=0, mB=0, mF=0, max=0, thr=127;
  const total = w*h;
  for (let t=0; t<256; t++) sum += t * hist[t];
  for (let t=0; t<256; t++) {
    wB += hist[t]; if (wB === 0) continue;
    wF = total - wB; if (wF === 0) break;
    sumB += t * hist[t];
    mB = sumB / wB; mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > max) { max = between; thr = t; }
  }
  // apply threshold → pure black/white
  for (let p=0, i=0; p<gray.length; p++, i+=4) {
    const v = gray[p] <= thr ? 0 : 255;
    d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  return canvas;
}

// Optional: 1×3 vertical median to kill salt-and-pepper without blurring bars
function median1x3(canvas:HTMLCanvasElement) {
  const { width:w, height:h } = canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0,0,w,h);
  const d = img.data;
  const out = new Uint8ClampedArray(d.length);
  out.set(d);
  for (let y=1; y<h-1; y++) {
    for (let x=0; x<w; x++) {
      const i = (y*w + x)*4;
      const a = d[i-4*w], b = d[i], c = d[i+4*w]; // red channel is enough (bw image)
      const arr = [a, b, c].sort((u,v)=>u-v);
      out[i]=out[i+1]=out[i+2]=arr[1]; out[i+3]=255;
    }
  }
  img.data.set(out); ctx.putImageData(img,0,0);
  return canvas;
}

// Add quiet zone (white padding) around the code
function addQuietZone(canvas:HTMLCanvasElement, pad=24) {
  const out = document.createElement('canvas');
  out.width = canvas.width + pad*2;
  out.height = canvas.height + pad*2;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,out.width,out.height);
  ctx.drawImage(canvas, pad, pad);
  return out;
}

export function binaryBitmapFromCanvas(canvas, useGlobal = false) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const source = new RGBLuminanceSource(img.data, width, height);
  const binarizer = useGlobal ? new GlobalHistogramBinarizer(source)
                              : new HybridBinarizer(source);
  return new BinaryBitmap(binarizer);
}

// Full pipeline
async function prepForZXingImage(src) {
  let c = await loadToCanvas(src);
  c = autoCrop(c);
  c = upscaleNearest(c, 200);   // try 200–300 px tall
  c = binarizeOtsu(c);
  c = median1x3(c);              // optional
  c = addQuietZone(c, 32);
  return c;
}

export  function prepForZXing(c: HTMLCanvasElement) {
  c = autoCrop(c);
  c = upscaleNearest(c, 200);   // try 200–300 px tall
  c = binarizeOtsu(c);
  c = median1x3(c);              // optional
  c = addQuietZone(c, 32);
  return c;
}