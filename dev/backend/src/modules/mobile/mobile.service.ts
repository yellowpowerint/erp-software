import { Injectable } from "@nestjs/common";

type MobileFeatureFlags = {
  home: boolean;
  work: boolean;
  modules: boolean;
  notifications: boolean;
  more: boolean;
};

type MobileConfigResponse = {
  minimumVersions: {
    ios: string;
    android: string;
  };
  storeUrls: {
    ios: string;
    android: string;
  };
  featureFlags: MobileFeatureFlags;
  serverTime: string;
};

function parseBooleanEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function parseJsonObjectEnv(value: string | undefined): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as any;
    return null;
  } catch {
    return null;
  }
}

@Injectable()
export class MobileService {
  getMobileConfig(): MobileConfigResponse {
    const minimumIos = process.env.MOBILE_MIN_VERSION_IOS || "1.0.0";
    const minimumAndroid = process.env.MOBILE_MIN_VERSION_ANDROID || "1.0.0";

    const iosUrl =
      process.env.MOBILE_APP_STORE_URL ||
      "https://apps.apple.com/";

    const androidUrl =
      process.env.MOBILE_PLAY_STORE_URL ||
      "https://play.google.com/store";

    const defaultFlags: MobileFeatureFlags = {
      home: true,
      work: true,
      modules: true,
      notifications: true,
      more: true,
    };

    const overrides = parseJsonObjectEnv(process.env.MOBILE_FEATURE_FLAGS);
    const featureFlags: MobileFeatureFlags = {
      home: parseBooleanEnv(overrides?.home as any, defaultFlags.home),
      work: parseBooleanEnv(overrides?.work as any, defaultFlags.work),
      modules: parseBooleanEnv(overrides?.modules as any, defaultFlags.modules),
      notifications: parseBooleanEnv(overrides?.notifications as any, defaultFlags.notifications),
      more: parseBooleanEnv(overrides?.more as any, defaultFlags.more),
    };

    return {
      minimumVersions: {
        ios: minimumIos,
        android: minimumAndroid,
      },
      storeUrls: {
        ios: iosUrl,
        android: androidUrl,
      },
      featureFlags,
      serverTime: new Date().toISOString(),
    };
  }
}
