/**
 * 坐标转换工具
 * WGS84 ↔ GCJ02 ↔ BD09
 * 使用 coordtransform 库实现
 */

import coordtransform from 'coordtransform';

/**
 * WGS84 转 BD09（百度坐标系）
 * @param lng 经度
 * @param lat 纬度
 * @returns [经度, 纬度]
 */
export function wgs84ToBd09(lng: number, lat: number): [number, number] {
  // WGS84 -> GCJ02
  const [gcjLng, gcjLat] = coordtransform.wgs84togcj02(lng, lat);
  // GCJ02 -> BD09
  return coordtransform.gcj02tobd09(gcjLng, gcjLat);
}

/**
 * BD09 转 WGS84（用于回显或精度核对）
 * @param lng 经度
 * @param lat 纬度
 * @returns [经度, 纬度]
 */
export function bd09ToWgs84(lng: number, lat: number): [number, number] {
  const [gcjLng, gcjLat] = coordtransform.bd09togcj02(lng, lat);
  return coordtransform.gcj02towgs84(gcjLng, gcjLat);
}

/**
 * 计算两点之间的距离（Haversine 公式，单位：米）
 * @param lng1 点1经度
 * @param lat1 点1纬度
 * @param lng2 点2经度
 * @param lat2 点2纬度
 * @returns 距离（米）
 */
export function haversineDistance(
  lng1: number, lat1: number,
  lng2: number, lat2: number
): number {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}