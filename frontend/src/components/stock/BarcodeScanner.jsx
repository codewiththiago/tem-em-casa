import { BarcodeScanner as NativeBarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { lookupBarcode } from '../../services/api';

export async function scanBarcode() {
  if (!Capacitor.isNativePlatform()) {
    const code = window.prompt('Simular barcode (dev): informe o código:');
    if (!code) return null;
    return { code, name: null, category: null };
  }

  const { barcodes } = await NativeBarcodeScanner.scan();
  if (!barcodes.length) return null;

  const code = barcodes[0].rawValue;
  try {
    const data = await lookupBarcode(code);
    return { code, name: data.name, category: data.category };
  } catch {
    return { code, name: null, category: null };
  }
}
