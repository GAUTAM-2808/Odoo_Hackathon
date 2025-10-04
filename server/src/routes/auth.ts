import { Router } from 'express';
import { prisma } from '../prisma';
import { config } from '../config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import axios from 'axios';
import { Role } from '../types';

const router = Router();

const signupSchema = z.object({
  companyName: z.string().min(2),
  countryCode: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/signup', async (req, res) => {
  try {
    const input = signupSchema.parse(req.body);

    // Get company currency via restcountries
    const url = `https://restcountries.com/v3.1/alpha/${input.countryCode}?fields=currencies`;
    const { data } = await axios.get(url);
    const currencies = data?.[0]?.currencies || data?.currencies;
    const currencyCode = currencies ? Object.keys(currencies)[0] : undefined;
    if (!currencyCode) return res.status(400).json({ error: 'Could not determine currency for country' });

    const passwordHash = await bcrypt.hash(input.password, 10);

    const company = await prisma.company.create({
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
    const token = jwt.sign({ id: admin.id, companyId: company.id, role: admin.role }, config.jwtSecret, { expiresIn: '7d' });
    return res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, company } });
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Signup failed' });
  }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
router.post('/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, companyId: user.companyId, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, company } });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Login failed' });
  }
});

router.get('/me', async (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

export default router;
