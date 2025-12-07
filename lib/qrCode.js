// lib/qrCode.js
// QR Code generation utility (V1.0 Spec)

/**
 * Generate QR code URL with storeId embedded
 * V1.0 Spec: QR for Lens Advisor with storeId embedded
 */
export function generateStoreQRCode(storeId, baseUrl = null) {
  // Use baseUrl from environment or default to current origin
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || '');
  
  // V1.0 Spec: QR code URL with storeId embedded
  // Format: {baseUrl}/?storeId={storeId}&mode=SELF_SERVICE
  const qrUrl = `${base}/?storeId=${storeId}&mode=SELF_SERVICE`;
  
  return qrUrl;
}

/**
 * Generate QR code data URL for display
 * This can be used with a QR code library like qrcode.react
 */
export function generateQRCodeDataURL(text) {
  // This would typically use a QR code library
  // For now, return the text that can be used with a QR code generator
  return text;
}

/**
 * Parse storeId from QR code URL
 */
export function parseStoreIdFromQR(qrUrl) {
  try {
    const url = new URL(qrUrl);
    return url.searchParams.get('storeId');
  } catch (error) {
    // If not a full URL, try to extract from query string
    const match = qrUrl.match(/storeId=([^&]+)/);
    return match ? match[1] : null;
  }
}

