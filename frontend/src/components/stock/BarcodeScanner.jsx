import { Capacitor } from '@capacitor/core';
import { lookupBarcode } from '../../services/api';

export async function scanBarcode() {
  if (!Capacitor.isNativePlatform()) {
    const code = window.prompt('Simular barcode (dev): informe o código:');
    if (!code) return null;
    return { code, name: null, category: null };
  }

  const { BarcodeScanner: NativeBarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');

  const { barcodes } = await NativeBarcodeScanner.scan({
    formats: [
      BarcodeFormat.QrCode,
      BarcodeFormat.Ean13,
      BarcodeFormat.Ean8,
      BarcodeFormat.Code128,
      BarcodeFormat.Code39,
      BarcodeFormat.UpcA,
      BarcodeFormat.UpcE,
      BarcodeFormat.DataMatrix,
      BarcodeFormat.Itf,
    ],
  });
  if (!barcodes.length) return null;

  const code = barcodes[0].rawValue;
  try {
    const data = await lookupBarcode(code);
    return { code, name: data.name, category: data.category };
  } catch {
    return { code, name: null, category: null };
  }
}
