# Publishing Guide

## Before Publishing

1. **Package name**: Already set to `@isaaclagoy/webgl-canvas` - ready to use!

2. **Repository URL**: Already set in `package.json` ✓

3. **Set access level**: 
   - For scoped packages (`@your-org/...`): Already set to `"access": "public"`
   - For unscoped packages: Remove the `publishConfig` section

## Build the Package

```bash
cd lib/webgl-canvas
npm install  # Install dev dependencies
npm run build  # Compile TypeScript
```

This creates a `dist` folder with the compiled JavaScript and type definitions.

## Test Locally

Before publishing, you can test the package locally:

```bash
# In the package directory
npm pack

# In your test project
npm install /path/to/webgl-canvas-1.0.0.tgz
```

## Publish to npm

### Important: Two-Factor Authentication Required

npm requires 2FA for publishing packages. You'll need to enable it first:

1. **Enable 2FA on your npm account:**
   - Go to https://www.npmjs.com/settings/isaaclagoy/tokens
   - Click "Enable 2FA" or "Edit Profile" → "Enable 2FA"
   - Follow the prompts to set up 2FA (recommended: use an authenticator app)

2. **After enabling 2FA, you have two options:**

   **Option A: Use npm login (requires 2FA code)**
   ```bash
   npm login
   # Enter your username, password, email, and 2FA code when prompted
   ```

   **Option B: Use an access token (recommended for CI/CD)**
   - Go to https://www.npmjs.com/settings/isaaclagoy/tokens
   - Click "Generate New Token"
   - Choose "Automation" (for CI/CD) or "Publish" token type
   - Copy the token and use it:
   ```bash
   npm login --auth-type=legacy
   # Username: isaaclagoy
   # Password: <paste your token>
   # Email: <your email>
   ```

3. **Publish:**
```bash
npm publish
```

The `publishConfig.access: "public"` is already set, so scoped packages will be published publicly automatically.

## Version Management

Use semantic versioning:
- `npm version patch` - Bug fixes (1.0.0 → 1.0.1)
- `npm version minor` - New features (1.0.0 → 1.1.0)
- `npm version major` - Breaking changes (1.0.0 → 2.0.0)

This automatically updates `package.json` and creates a git tag.

## After Publishing

Update the import in your main project to use the published package:

```tsx
// Before (local)
import { WebGLCanvas } from '@/lib/webgl-canvas';

// After (npm package)
import { WebGLCanvas } from '@isaaclagoy/webgl-canvas';
```

Then install it:
```bash
npm install @isaaclagoy/webgl-canvas
```

