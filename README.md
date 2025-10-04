## Expense Management System (EMS)

A full-stack web app for managing employee expenses with multi-level approvals, conditional rules, currency conversion, and OCR receipt extraction.

### Stack
- Server: Node.js + Express + TypeScript
- DB: SQLite via Prisma (easy to swap to Postgres)
- Auth: JWT
- OCR: tesseract.js (local) – can swap for Google Vision
- Client: Next.js + Tailwind CSS

### Quick start

Prereqs: Node 18+

1) Backend

```bash
cd server
cp .env.example .env   # adjust if needed
npm install
npm run prisma:migrate
npm run dev
```

2) Frontend

```bash
cd ../client
npm install
npm run dev
```

Open the app at `http://localhost:3000`.

Set NEXT_PUBLIC_API_BASE in `client/.env.local` if your server runs on a different host/port.

### API Highlights
- POST `/auth/signup` – first signup creates a `Company` using country currency and an Admin user
- POST `/auth/login`
- GET `/expenses` – list (role-aware)
- POST `/expenses` – create with multipart form (fields: description, category, expenseDate, amount, currency, submit, receipt)
- GET `/approvals/pending` – approver queue
- POST `/approvals/:id/approve|reject`
- Admin-only:
  - POST/GET/PATCH `/rules`
  - POST/PATCH/GET `/users`

### Notes
- Money is stored as integer cents for portability in SQLite.
- Approval rules supported: percentage, specific approver, hybrid (OR).
- Manager chain is derived from each employee's `managerId`; chain stops at first Admin.
- OCR parsing is intentionally basic; replace `parseOcrForExpense` for production.
