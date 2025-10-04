"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const config_1 = require("../config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
const signupSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2),
    countryCode: zod_1.z.string().min(2),
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
router.post('/signup', async (req, res) => {
    try {
        const input = signupSchema.parse(req.body);
        // Get company currency via restcountries
        const url = `https://restcountries.com/v3.1/alpha/${input.countryCode}?fields=currencies`;
        const { data } = await axios_1.default.get(url);
        const currencies = data?.[0]?.currencies || data?.currencies;
        const currencyCode = currencies ? Object.keys(currencies)[0] : undefined;
        if (!currencyCode)
            return res.status(400).json({ error: 'Could not determine currency for country' });
        const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        const company = await prisma_1.prisma.company.create({
            data: {
                name: input.companyName,
                countryCode: input.countryCode,
                currencyCode,
                users: {
                    create: {
                        name: input.name,
                        email: input.email.toLowerCase(),
                        passwordHash,
                        role: 'ADMIN',
                    },
                },
            },
            include: { users: true },
        });
        const admin = company.users[0];
        const token = jsonwebtoken_1.default.sign({ id: admin.id, companyId: company.id, role: admin.role }, config_1.config.jwtSecret, { expiresIn: '7d' });
        return res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, company } });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message || 'Signup failed' });
    }
});
const loginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(6) });
router.post('/login', async (req, res) => {
    try {
        const input = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        const ok = await bcryptjs_1.default.compare(input.password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, companyId: user.companyId, role: user.role }, config_1.config.jwtSecret, { expiresIn: '7d' });
        const company = await prisma_1.prisma.company.findUnique({ where: { id: user.companyId } });
        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, company } });
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Login failed' });
    }
});
router.get('/me', async (req, res) => {
    return res.status(200).json({ status: 'ok' });
});
exports.default = router;
