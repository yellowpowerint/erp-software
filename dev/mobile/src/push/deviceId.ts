import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'device_id_v1';

function generateId(): string {
  const rand = Math.random().toString(36).slice(2);
  const time = Date.now().toString(36);
  return `dev_${time}_${rand}`;
}

export async function getExistingDeviceId(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  const value = (raw ?? '').trim();
  return value.length > 0 ? value : null;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getExistingDeviceId();
  if (existing) return existing;

  const created = generateId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  return created;
}
