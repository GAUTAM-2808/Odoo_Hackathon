import { config } from '../config';

export async function extractTextFromImage(filePath: string): Promise<string> {
  // Lazy import tesseract.js to avoid heavy load when unused
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(config.ocrLang);
  try {
    const { data } = await worker.recognize(filePath);
    return data.text || '';
  } finally {
    await worker.terminate();
  }
}

export function parseOcrForExpense(ocrText: string): { amount?: number; date?: string; vendor?: string } {
  // Extremely naive parsing: find first currency-like amount and a date-like string
  const amountMatch = ocrText.match(/([0-9]+(?:\.[0-9]{2})?)/);
  const dateMatch = ocrText.match(/(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4})/);
  const lines = ocrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const vendor = lines.length ? lines[0] : undefined;
  const amount = amountMatch ? Number(amountMatch[1]) : undefined;
  const date = dateMatch ? dateMatch[1] : undefined;
  return { amount, date, vendor };
}
