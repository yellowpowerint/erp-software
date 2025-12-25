export type LocalFile = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
