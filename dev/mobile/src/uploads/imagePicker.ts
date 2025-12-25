import * as ImagePicker from 'expo-image-picker';

import type { LocalFile } from './types';

export type PickImageResult =
  | { ok: true; file: LocalFile }
  | { ok: false; cancelled: true }
  | { ok: false; permissionDenied: true };

function assetToLocalFile(asset: any): LocalFile | null {
  if (!asset?.uri) return null;
  return {
    uri: String(asset.uri),
    fileName: asset.fileName ? String(asset.fileName) : undefined,
    mimeType: asset.mimeType ? String(asset.mimeType) : undefined,
  };
}

export async function pickImageFromCamera(): Promise<PickImageResult> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm?.granted) return { ok: false, permissionDenied: true };

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (result?.canceled) return { ok: false, cancelled: true };
  const asset = Array.isArray(result?.assets) ? result.assets[0] : null;
  const file = assetToLocalFile(asset);
  if (!file) return { ok: false, cancelled: true };
  return { ok: true, file };
}

export async function pickImageFromLibrary(): Promise<PickImageResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm?.granted) return { ok: false, permissionDenied: true };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (result?.canceled) return { ok: false, cancelled: true };
  const asset = Array.isArray(result?.assets) ? result.assets[0] : null;
  const file = assetToLocalFile(asset);
  if (!file) return { ok: false, cancelled: true };
  return { ok: true, file };
}
