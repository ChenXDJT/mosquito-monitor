/**
 * JWT 辅助工具：解析、过期判断
 */

/**
 * 解码 JWT 载荷（前端使用，不验证签名）
 * @param token JWT字符串
 * @returns 载荷对象或 null
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

/**
 * 判断 JWT 是否已过期
 * @param token JWT字符串
 * @returns 是否过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  // exp 单位是秒
  const expTime = payload.exp * 1000;
  return Date.now() >= expTime;
}

/**
 * 从 JWT 中获取用户信息（简化）
 * @param token JWT字符串
 * @returns user_id, role, region 等
 */
export function getUserFromToken(token: string): { userId: string; role: string; region: string } | null {
  const payload = decodeJWT(token);
  if (!payload) return null;
  return {
    userId: payload.user_id,
    role: payload.role,
    region: payload.region,
  };
}