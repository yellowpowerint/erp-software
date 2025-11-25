# Render Build Error Fix: nest command not found

## 🚨 Issue
```
sh: 1: nest: not found
==> Build failed 😞
```

The `nest` CLI command isn't found because `@nestjs/cli` is in `devDependencies` and may not be installed during the build.

---

## ✅ Solution: Use npx nest build

I've updated the build script in `package.json` to use `npx nest build` instead of `nest build`.

This ensures the NestJS CLI is available during build, even if it's in devDependencies.

---

## 📋 Push the Fix

```bash
cd C:\Users\Plange\Downloads\Projects\mining-erp

# Add the updated package.json
git add dev/backend/package.json

# Commit
git commit -m "Fix Render build: use npx nest build"

# Push
git push origin main
```

---

## 🔄 After Pushing

Render will automatically detect the push and start a new deployment with the fixed build command.

**Watch the logs in Render dashboard to see the build succeed!**

---

## ✅ Expected Success Output

After the fix, you should see:
```
==> Running build command 'npm install && npm run build'...
added 210 packages...
> mining-erp-backend@0.1.0 build
> npx nest build
✔ Build successful
```

---

## 🎯 Alternative Solutions (if still fails)

### Option 1: Use npm ci instead of npm install
In Render dashboard, update **Build Command** to:
```bash
npm ci && npm run build
```

### Option 2: Install devDependencies explicitly
In Render dashboard, update **Build Command** to:
```bash
npm install --include=dev && npm run build
```

### Option 3: Move @nestjs/cli to dependencies
Edit `package.json` and move `@nestjs/cli` from `devDependencies` to `dependencies`.

---

## 💡 Why This Happens

- `@nestjs/cli` is in `devDependencies`
- Some environments don't install dev dependencies by default
- Using `npx` ensures the CLI is found and run correctly
- `npx` automatically uses the locally installed package

---

**Status:** Fix applied, ready to push and redeploy!
