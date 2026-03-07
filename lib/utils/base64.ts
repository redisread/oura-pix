/**
 * 安全的 Base64 编码工具
 * 分块处理避免栈溢出，支持大文件
 */

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 * 使用分块处理避免 RangeError
 * @param buffer 要转换的 ArrayBuffer
 * @returns Base64 编码字符串
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // 每次处理 8KB，避免栈溢出
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  return btoa(binary);
}

/**
 * 将 Base64 字符串转换为 ArrayBuffer
 * @param base64 Base64 编码字符串
 * @returns ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * 检查 Base64 字符串是否有效
 * @param str 要检查的字符串
 * @returns 是否为有效的 Base64
 */
export function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}
