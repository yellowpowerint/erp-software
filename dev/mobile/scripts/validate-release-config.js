const fs = require('fs');
const path = require('path');

function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPositiveInt(v) {
  return Number.isInteger(v) && v > 0;
}

function isBuildNumber(v) {
  return isNonEmptyString(v) && /^\d+(\.\d+)*$/.test(v.trim());
}

const root = path.resolve(__dirname, '..');
const appJsonPath = path.join(root, 'app.json');
const easJsonPath = path.join(root, 'eas.json');
const packageJsonPath = path.join(root, 'package.json');

if (!fs.existsSync(appJsonPath)) fail(`Missing file: ${appJsonPath}`);
if (!fs.existsSync(easJsonPath)) fail(`Missing file: ${easJsonPath}`);
if (!fs.existsSync(packageJsonPath)) fail(`Missing file: ${packageJsonPath}`);

const appJson = readJson(appJsonPath);
const easJson = readJson(easJsonPath);
const packageJson = readJson(packageJsonPath);

const expo = appJson.expo;
if (!expo) fail('app.json missing expo object');

if (!isNonEmptyString(expo.name)) fail('app.json expo.name must be a non-empty string');
if (!isNonEmptyString(expo.slug)) fail('app.json expo.slug must be a non-empty string');
if (!isNonEmptyString(expo.version)) fail('app.json expo.version must be a non-empty string');

if (isNonEmptyString(packageJson.version) && packageJson.version !== expo.version) {
  fail(`Version mismatch: package.json (${packageJson.version}) != app.json expo.version (${expo.version})`);
}

if (!expo.ios) fail('app.json expo.ios missing');
if (!isNonEmptyString(expo.ios.bundleIdentifier)) fail('app.json expo.ios.bundleIdentifier missing');
if (!isBuildNumber(expo.ios.buildNumber)) fail('app.json expo.ios.buildNumber must be a numeric string like "1" or "1.0"');

if (!expo.android) fail('app.json expo.android missing');
if (!isNonEmptyString(expo.android.package)) fail('app.json expo.android.package missing');
if (!isPositiveInt(expo.android.versionCode)) fail('app.json expo.android.versionCode must be a positive integer');

if (!easJson.build || !easJson.build.production) fail('eas.json missing build.production profile');

const prodEnv = easJson.build.production.env || {};
if (!isNonEmptyString(prodEnv.EXPO_PUBLIC_API_URL)) {
  fail('eas.json build.production.env.EXPO_PUBLIC_API_URL must be set');
}

process.stdout.write('OK: release config validated.\n');
