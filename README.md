# Bitespeed Identity Reconciliation Service

This is a backend service built with Node.js, Express.js, TypeScript, and Prisma ORM to solve the Identity Reconciliation Task.

## Tech Stack
- **Node.js**
- **Express.js**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**

## Project Structure
```text
src/
  controllers/      # Request handlers
  services/         # Business logic (Reconciliation logic)
  routes/           # API route definitions
  prisma/           # Prisma client instance
  utils/            # Helper functions (if any)
  index.ts          # Entry point
prisma/
  schema.prisma     # Prisma models and DB configuration
```

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database instance

### 2. Installation
Clone the project and install dependencies:
```bash
npm install
```

### 3. Database Configuration
Create a `.env` file in the root directory and add your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
PORT=3000
```

### 4. Running Migrations
Use Prisma to create the database schema:
```bash
npm run prisma:migrate
```
This will create the **Contact** table in your PostgreSQL database.

### 5. Running the Application
To start the server in development mode:
```bash
npm run dev
```
The server will be available at `http://localhost:3000`.

---

## API Testing (Postman)

### Endpoint: `POST /identify`

**Request Body (JSON):**
```json
{
  "email": "mcfly@hillvalley.net",
  "phoneNumber": "123456"
}
```

### Example Scenarios

#### 1. New Contact (First Request)
**Request:**
```json
{ "email": "lorraine@hillvalley.net", "phoneNumber": "123456" }
```
**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.net"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

#### 2. Reconciliation (Secondary Information)
**Request:**
```json
{ "email": "mcfly@hillvalley.net", "phoneNumber": "123456" }
```
**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.net", "mcfly@hillvalley.net"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

#### 3. Connecting Two Primaries
**Request:**
```json
{ "email": "bob@example.com", "phoneNumber": "999999" } // Primary 1
{ "email": "alice@example.com", "phoneNumber": "888888" } // Primary 2
{ "email": "alice@example.com", "phoneNumber": "999999" } // Connects them!
```
**Response (Oldest remains primary):**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["bob@example.com", "alice@example.com"],
    "phoneNumbers": ["999999", "888888"],
    "secondaryContactIds": [2]
  }
}
```

---

## Key Features
- **Oldest Primary Logic**: Guaranteed to identify the earliest primary contact as the root.
- **Service Layer**: Clean separation of business logic from controllers.
- **Type Safety**: Fully typed with TypeScript interfaces.
- **Prisma Support**: Built-in migrations and type-safe DB access.
