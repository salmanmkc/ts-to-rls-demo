# RLS Policy DSL Tester

An interactive demo application for testing and generating PostgreSQL Row Level Security (RLS) policies using the [`ts-to-rls`](https://github.com/supabase/ts-to-rls) TypeScript library.

**Live Demo:** https://ts-to-rls-demo.vercel.app/
**Documentation:** https://supabase.github.io/ts-to-rls/

## Features

- 🎨 **Monaco Editor** with TypeScript intellisense and autocomplete
- 🚀 Write TypeScript code using the RLS DSL with real-time syntax highlighting
- 📝 Generate PostgreSQL RLS policy SQL instantly
- 📋 Copy to clipboard functionality
- 💡 Error display with helpful messages
- 🔍 Function reference panel
- 14+ built-in examples covering common use cases:
  - User ownership policies
  - Multi-tenant isolation
  - Owner or member access
  - Complex OR conditions
  - Pattern matching (LIKE/ILIKE)
  - Null checks (isNull/isNotNull)
  - DELETE operations
  - Policies with index suggestions
  - INSERT/UPDATE validations with check expressions
  - Pre-built policy templates (userOwned, publicAccess, roleAccess)
  - Helper methods (isOwner, isPublic)

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
  .read()
  .when(column('user_id').isOwner());

return policy.toSQL();
```

Generates:

```sql
CREATE POLICY "user_documents"
ON "documents"
FOR SELECT
USING ("user_id" = auth.uid());
```

## Available Functions

| Category | Functions |
|----------|-----------|
| **Policy Builder** | `createPolicy(name).on(table).read()`, `.write()`, `.update()`, `.delete()`, `.all()` |
| **Clauses** | `.when(condition)`, `.allow(condition)`, `.withCheck(condition)`, `.toSQL()` |
| **Conditions** | `column(name).eq()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.in()`, `.like()`, `.ilike()`, `.isNull()`, `.isNotNull()`, `.and()`, `.or()` |
| **Helper Methods** | `column(name).isOwner()`, `.isPublic()`, `.belongsToTenant()`, `.isMemberOf(table, key)` |
| **Context** | `auth.uid()`, `session.get(key, type)`, `currentUser()` |
| **Subqueries** | `from(table).select(cols).where(condition).join(table, on)` |
| **Templates** | `policies.userOwned()`, `policies.tenantIsolation()`, `policies.publicAccess()`, `policies.roleAccess()` |

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- [ts-to-rls](https://github.com/supabase/ts-to-rls) - TypeScript DSL for PostgreSQL RLS policies

## License

MIT
