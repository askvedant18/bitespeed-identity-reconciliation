# 🔗 Bitespeed Identity Reconciliation Service

A backend service that identifies and reconciles customer identities across multiple purchases using shared contact information (email & phone number).

Built with **Node.js**, **Express.js**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

---

## 📌 Problem Statement

FluxKart.com uses Bitespeed to track customer identities. Customers often use different email addresses or phone numbers when placing orders. This service links all such contacts and returns a unified identity with a primary contact and associated secondary contacts.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express.js | HTTP Server & Routing |
| TypeScript | Type-safe development |
| PostgreSQL | Relational Database |
| Prisma ORM (v7) | Database access & migrations |
| `@prisma/adapter-pg` | Driver adapter for PostgreSQL |
| dotenv | Environment variable management |
| CORS | Cross-origin request support |

---

## 📁 Project Structure

```
Task/
├── prisma/
│   ├── schema.prisma        # Prisma schema (Contact model)
│   └── migrations/          # Auto-generated DB migrations
├── src/
│   ├── controllers/
│   │   └── identifyController.ts   # Request handler
│   ├── services/
│   │   └── identifyService.ts      # Core reconciliation logic
│   ├── routes/
│   │   └── identifyRoutes.ts       # Express routes
│   ├── prisma/
│   │   └── client.ts               # Prisma client instance
│   └── index.ts                    # App entry point
├── .env                     # Environment variables (not committed)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL database (local or hosted, e.g. Supabase, Neon, Railway)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/askvedant18/bitespeed-identity-reconciliation.git
cd bitespeed-identity-reconciliation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3000
```

> Replace `USER`, `PASSWORD`, `HOST`, `PORT`, `DATABASE` with your actual PostgreSQL credentials.

### 4. Run Prisma migrations (creates the `Contact` table)

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

---

## 📬 API Reference

### `POST /identify`

Identifies and reconciles a contact based on email and/or phone number.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "9876543210"
}
```
> Note: At least one of `email` or `phoneNumber` must be provided.

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "other@example.com"],
    "phoneNumbers": ["9876543210", "1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## 🔄 Reconciliation Logic

| Scenario | Behavior |
|---|---|
| No existing contact | Creates a new **primary** contact |
| Existing contact found | Returns the existing contact cluster |
| New info provided (new email/phone) | Creates a new **secondary** contact linked to the oldest primary |
| Two separate primary contacts share info | The **older** one stays primary; the newer becomes **secondary** |

---

## 🧪 Testing the API

You can test with **Postman**, **curl**, or any HTTP client:

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "9999999999"}'
```

---

## 📜 Database Schema

```prisma
model Contact {
  id              Int            @id @default(autoincrement())
  phoneNumber     String?
  email           String?
  linkedId        Int?
  linkPrecedence  LinkPrecedence
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
}

enum LinkPrecedence {
  primary
  secondary
}
```

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm run start        # Run compiled production build
```
