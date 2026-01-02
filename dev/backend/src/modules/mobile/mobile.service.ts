import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { getModulesForRole, getCapabilitiesForRole } from "./capabilities.helper";

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
  maintenance: {
    enabled: boolean;
    message: string;
  };
  forceUpdateMessage: string | null;
  serverTime: string;
};

function parseBooleanEnv(value: unknown, fallback: boolean) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return fallback;
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

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMobileConfig(): Promise<MobileConfigResponse> {
    const keys = [
      "MOBILE_CONFIG_JSON",
    ];

    const settings = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: keys,
        },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value] as const));

    const defaultFlags: MobileFeatureFlags = {
      home: true,
      work: true,
      modules: true,
      notifications: true,
      more: true,
    };

    const envOverrides = parseJsonObjectEnv(process.env.MOBILE_FEATURE_FLAGS);

    const stored = safeJsonParse<any>(map.get("MOBILE_CONFIG_JSON"), {});

    const minimumIos =
      stored?.minimumVersions?.ios || process.env.MOBILE_MIN_VERSION_IOS || "1.0.0";
    const minimumAndroid =
      stored?.minimumVersions?.android || process.env.MOBILE_MIN_VERSION_ANDROID || "1.0.0";

    const iosUrl =
      stored?.storeUrls?.ios || process.env.MOBILE_APP_STORE_URL || "https://apps.apple.com/";
    const androidUrl =
      stored?.storeUrls?.android || process.env.MOBILE_PLAY_STORE_URL || "https://play.google.com/store";

    const featureFlags: MobileFeatureFlags = {
      home: parseBooleanEnv((envOverrides?.home as any) ?? stored?.featureFlags?.home, defaultFlags.home),
      work: parseBooleanEnv((envOverrides?.work as any) ?? stored?.featureFlags?.work, defaultFlags.work),
      modules: parseBooleanEnv((envOverrides?.modules as any) ?? stored?.featureFlags?.modules, defaultFlags.modules),
      notifications: parseBooleanEnv(
        (envOverrides?.notifications as any) ?? stored?.featureFlags?.notifications,
        defaultFlags.notifications,
      ),
      more: parseBooleanEnv((envOverrides?.more as any) ?? stored?.featureFlags?.more, defaultFlags.more),
    };

    const maintenanceEnabled = parseBooleanEnv(
      stored?.maintenance?.enabled !== undefined ? String(stored.maintenance.enabled) : undefined,
      false,
    );
    const maintenanceMessage =
      typeof stored?.maintenance?.message === "string" && stored.maintenance.message.trim()
        ? stored.maintenance.message
        : "We are currently performing scheduled maintenance. Please try again shortly.";

    const forceUpdateMessage =
      typeof stored?.forceUpdateMessage === "string" ? stored.forceUpdateMessage : null;

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
      maintenance: {
        enabled: maintenanceEnabled,
        message: maintenanceMessage,
      },
      forceUpdateMessage,
      serverTime: new Date().toISOString(),
    };
  }

  async registerDevice(userId: string, data: {
    deviceId: string;
    platform: string;
    pushToken: string;
    appVersion?: string;
    deviceModel?: string;
    osVersion?: string;
  }) {
    const now = new Date();

    const revokedRaw = await this.prisma.systemSetting.findUnique({
      where: {
        key: "MOBILE_REVOKED_DEVICE_IDS_JSON",
      },
      select: {
        value: true,
      },
    });

    const revoked = safeJsonParse<string[]>(revokedRaw?.value, []);
    if (revoked.includes(data.deviceId)) {
      throw new ForbiddenException("This device has been revoked.");
    }

    return this.prisma.mobileDevice.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: data.deviceId,
        },
      },
      create: {
        userId,
        deviceId: data.deviceId,
        platform: data.platform,
        pushToken: data.pushToken,
        appVersion: data.appVersion,
        deviceModel: data.deviceModel,
        osVersion: data.osVersion,
        lastSeenAt: now,
      },
      update: {
        platform: data.platform,
        pushToken: data.pushToken,
        appVersion: data.appVersion,
        deviceModel: data.deviceModel,
        osVersion: data.osVersion,
        lastSeenAt: now,
      },
    });
  }

  async unregisterDevice(userId: string, deviceId: string) {
    return this.prisma.mobileDevice.deleteMany({
      where: {
        userId,
        deviceId,
      },
    });
  }

  async getUserCapabilities(user: any) {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        role: true,
        department: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!userRecord) {
      throw new ForbiddenException("User not found");
    }

    const role = userRecord.role;
    const modules = getModulesForRole(role);
    const capabilities = getCapabilitiesForRole(role);

    return {
      userId: userRecord.id,
      role: userRecord.role,
      departmentId: userRecord.department,
      modules,
      capabilities,
    };
  }
}
