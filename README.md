# RLS Policy DSL Tester

> **Experimental Library** - This is an experimental project for testing out ideas. It is not official and not intended for production use.

An interactive demo application for testing and generating PostgreSQL Row Level Security (RLS) policies using the [`ts-to-rls`](https://github.com/supabase/ts-to-rls) TypeScript library.

* **Live Demo:** https://ts-to-rls-demo.vercel.app/
* **Documentation:** https://supabase.github.io/ts-to-rls/

## Testing Custom ts-to-rls Versions

Want to test a specific commit or PR from the [`ts-to-rls`](https://github.com/supabase/ts-to-rls) repository? This project includes a workflow that makes it easy:

1. **Trigger the workflow**: Go to [Actions → Update ts-to-rls from pkg.pr.new](../../actions/workflows/update-ts-to-rls.yml) and click "Run workflow"
2. **Enter either a PR number or commit SHA**:
   - **PR number** - Enter the PR number from [supabase/ts-to-rls](https://github.com/supabase/ts-to-rls) (the workflow will automatically fetch the latest commit from that PR)
   - **SHA** - Enter a specific commit SHA if you want to pin to an exact commit
3. The workflow will:
   - Install `ts-to-rls` from `pkg.pr.new` at that specific commit
   - Create a pull request with the updated dependency
   - Vercel will automatically deploy a preview for the PR
4. **Test the preview** - Click the Vercel preview link in the PR to see a live demo running your custom version

This is perfect for testing unreleased features, bug fixes, or experimental changes before they're merged or published to npm.

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
const p = policy('user_documents')
  .on('documents')
  .read()
  .when(column('user_id').isOwner());

return p.toSQL();
```

Generates:

```sql
CREATE POLICY "user_documents"
ON "documents"
FOR SELECT
USING ("user_id" = auth.uid());
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- [ts-to-rls](https://github.com/supabase/ts-to-rls) - TypeScript DSL for PostgreSQL RLS policies

## License

MIT
