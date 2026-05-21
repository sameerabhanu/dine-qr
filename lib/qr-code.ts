import QRCode from 'qrcode';

/**
 * Generate QR code as Data URL (base64)
 */
export async function generateQRCodeImage(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(url: string): Promise<string> {
  try {
    const qrCodeSvg = await QRCode.toString(url, {
      type: 'svg',
      width: 400,
      margin: 2,
    });
    return qrCodeSvg;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}
