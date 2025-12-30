import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export type PickedMedia = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function validateFile(file: PickedMedia) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    throw new Error('Unsupported file type. Please select a JPG, PNG, or PDF.');
  }
  if (file.size && file.size > MAX_SIZE_BYTES) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
}

export async function pickFromLibrary(): Promise<PickedMedia | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Photo library permission is required.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const file: PickedMedia = {
    uri: asset.uri,
    name: asset.fileName || asset.uri.split('/').pop() || 'image.jpg',
    mimeType: asset.mimeType || 'image/jpeg',
    size: asset.fileSize,
  };

  validateFile(file);
  return file;
}

export async function pickFromCamera(): Promise<PickedMedia | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Camera permission is required.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const file: PickedMedia = {
    uri: asset.uri,
    name: asset.fileName || asset.uri.split('/').pop() || 'photo.jpg',
    mimeType: asset.mimeType || 'image/jpeg',
    size: asset.fileSize,
  };

  validateFile(file);
  return file;
}

export async function pickDocument(): Promise<PickedMedia | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const file: PickedMedia = {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType || 'application/pdf',
    size: asset.size,
  };

  validateFile(file);
  return file;
}

export const mediaPickerService = {
  pickFromLibrary,
  pickFromCamera,
  pickDocument,
};
