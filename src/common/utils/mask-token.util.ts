export function maskToken(token?: string): string {
  // 关键日志只展示 token 摘要，避免泄露完整凭证
  if (!token) return '';
  const t = token.trim();
  if (!t) return '';
  if (t.length <= 16) return `${t.slice(0, 4)}...${t.slice(-4)}(len:${t.length})`;
  return `${t.slice(0, 8)}...${t.slice(-6)}(len:${t.length})`;
}

export function maskAuthorizationHeader(value?: string): string {
  if (!value) return '';
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (!v) return '';
  if (!v.startsWith('Bearer ')) return v;
  return `Bearer ${maskToken(v.slice('Bearer '.length))}`;
}
