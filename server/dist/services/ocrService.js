"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromImage = extractTextFromImage;
exports.parseOcrForExpense = parseOcrForExpense;
const config_1 = require("../config");
async function extractTextFromImage(filePath) {
    // Lazy import tesseract.js to avoid heavy load when unused
    const { createWorker } = await Promise.resolve().then(() => __importStar(require('tesseract.js')));
    const worker = await createWorker(config_1.config.ocrLang);
    try {
        const { data } = await worker.recognize(filePath);
        return data.text || '';
    }
    finally {
        await worker.terminate();
    }
}
function parseOcrForExpense(ocrText) {
    // Extremely naive parsing: find first currency-like amount and a date-like string
    const amountMatch = ocrText.match(/([0-9]+(?:\.[0-9]{2})?)/);
    const dateMatch = ocrText.match(/(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4})/);
    const lines = ocrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const vendor = lines.length ? lines[0] : undefined;
    const amount = amountMatch ? Number(amountMatch[1]) : undefined;
    const date = dateMatch ? dateMatch[1] : undefined;
    return { amount, date, vendor };
}
