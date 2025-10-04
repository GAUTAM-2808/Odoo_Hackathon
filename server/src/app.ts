import express from 'express';
import cors from 'cors';
import { ensureEnv } from './config';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import expenseRoutes from './routes/expenses';
import approvalRoutes from './routes/approvals';
import ruleRoutes from './routes/rules';

ensureEnv();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/expenses', expenseRoutes);
app.use('/approvals', approvalRoutes);
app.use('/rules', ruleRoutes);

export default app;
