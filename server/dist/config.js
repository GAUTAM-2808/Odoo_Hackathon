"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.ensureEnv = ensureEnv;
exports.resolveUploadPath = resolveUploadPath;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
    port: Number(process.env.PORT || 4000),
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    ocrLang: process.env.OCR_LANG || 'eng',
};
function ensureEnv() {
    const required = ['JWT_SECRET'];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
        // Not throwing to keep DX friendly in ephemeral envs
        console.warn(`Warning: Missing env vars: ${missing.join(', ')}`);
    }
}
function resolveUploadPath(...segments) {
    return path_1.default.join(process.cwd(), exports.config.uploadDir, ...segments);
}
