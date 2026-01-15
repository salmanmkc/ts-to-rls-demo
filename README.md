# RLS Policy DSL Tester

An interactive demo application for testing and generating PostgreSQL Row Level Security (RLS) policies using the [`rls-dsl`](https://github.com/supabase/ts-to-rls) TypeScript library.

**Live Demo:** https://ts-to-rls-demo.vercel.app/

## Features

- Write TypeScript code using the RLS DSL
- Generate PostgreSQL RLS policy SQL in real-time
- Built-in examples covering common use cases:
  - User ownership policies
  - Multi-tenant isolation
  - Owner or member access
  - Complex OR conditions
  - Policies with index suggestions
  - INSERT/UPDATE validations with check expressions
  - Pre-built policy templates

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

## Usage

The tester provides an editor where you can write TypeScript code using the RLS DSL. Click "Generate" to compile the policy into SQL.

### Example

```typescript
const policy = createPolicy('user_documents')
  .on('documents')
  .for('SELECT')
  .when(column('user_id').eq(auth.uid()));

return policy.toSQL();
```

Generates:

```sql
CREATE POLICY "user_documents"
ON "public"."documents"
FOR SELECT
USING ((user_id = auth.uid()));
```

## Available Functions

| Category | Functions |
|----------|-----------|
| **Policy Builder** | `createPolicy(name).on(table).for(operation).when(condition).toSQL()` |
| **Conditions** | `column(name).eq()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.in()`, `.like()`, `.isNull()`, `.and()`, `.or()` |
| **Context** | `auth.uid()`, `session.get(key, type)`, `currentUser()` |
| **Subqueries** | `from(table).select(cols).where(condition).join(table, on)` |
| **Templates** | `policies.userOwned()`, `policies.tenantIsolation()`, `policies.publicAccess()`, `policies.roleAccess()` |
| **Operations** | `'SELECT'`, `'INSERT'`, `'UPDATE'`, `'DELETE'`, `'ALL'` |

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- [rls-dsl](https://github.com/supabase/ts-to-rls) - TypeScript DSL for PostgreSQL RLS policies

## License

MIT
