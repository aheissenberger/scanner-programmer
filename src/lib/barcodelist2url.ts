import LZString from 'lz-string';

export function compressToUrl(obj: unknown): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(obj));
}

export function decompressFromUrl(str: string): unknown {
  console.debug('Attempting to decompress:', str.substring(0, 50) + '...');
  
  const decompressed = LZString.decompressFromEncodedURIComponent(str);
  
  if (decompressed === null || decompressed === undefined) {
    console.error('LZString decompression returned null/undefined for input:', str.substring(0, 50));
    throw new Error('Failed to decompress data from URL - invalid compressed string');
  }
  
  console.debug('Decompressed string:', decompressed.substring(0, 100) + '...');
  
  try {
    const parsed = JSON.parse(decompressed);
    console.debug('Successfully parsed JSON:', parsed);
    return parsed;
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Raw decompressed string:', decompressed);
    throw new Error(`Failed to parse decompressed JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract compressed data from URL path (e.g., /bcl/N4IgRgh...)
export function extractCompressedFromPath(pathname: string): string | null {
  console.debug('Extracting from pathname:', pathname);
  const bclMatch = pathname.match(/\/bcl\/(.+)$/);
  const result = bclMatch ? bclMatch[1] : null;
  console.debug('Extracted compressed data:', result);
  return result;
}

// Cache for loaded URL data to prevent multiple decompression attempts in dev mode
let urlDataCache: { url: string; data: unknown } | null = null;

// Load barcode list data from current URL
export function loadFromCurrentUrl(): unknown | null {
  const currentUrl = window.location.pathname;
  console.debug('Loading from current URL:', currentUrl);
  
  // Return cached data if we've already processed this URL
  if (urlDataCache && urlDataCache.url === currentUrl) {
    console.debug('Returning cached data for URL:', currentUrl);
    return urlDataCache.data;
  }
  
  try {
    const compressed = extractCompressedFromPath(currentUrl);
    if (!compressed) {
      console.debug('No compressed data found in URL');
      // Cache null result
      urlDataCache = { url: currentUrl, data: null };
      return null;
    }
    
    console.debug('Found compressed data, attempting to decompress...');
    const result = decompressFromUrl(compressed);
    console.debug('Successfully loaded data from URL:', result);
    
    // Cache successful result
    urlDataCache = { url: currentUrl, data: result };
    return result;
  } catch (error) {
    console.error('Failed to load data from URL:', error);
    // Cache null result on error
    urlDataCache = { url: currentUrl, data: null };
    return null;
  }
}

// Generate full URL with compressed data
export function generateBarcodeListUrl(obj: unknown, baseUrl: string = window.location.origin): string {
  const compressed = compressToUrl(obj);
  return `${baseUrl}/bcl/${compressed}`;
}

// Clear the URL data cache (useful when navigating to new URLs)
export function clearUrlCache(): void {
  urlDataCache = null;
}
