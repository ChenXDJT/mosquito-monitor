/**
 * IndexedDB 封装
 * 用于离线存储待同步的记录、轨迹点等
 */

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'mosquito-db';
const DB_VERSION = 1;

export interface PendingRecord {
  id?: number;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export interface PendingTrack {
  id?: number;
  taskId: string;
  points: any[];
  timestamp: number;
}

let dbInstance: IDBPDatabase | null = null;

/**
 * 初始化数据库
 */
export async function initDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 待同步记录存储
      if (!db.objectStoreNames.contains('pendingRecords')) {
        const store = db.createObjectStore('pendingRecords', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp');
      }
      // 待同步轨迹点存储
      if (!db.objectStoreNames.contains('pendingTracks')) {
        const store = db.createObjectStore('pendingTracks', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('taskId', 'taskId');
        store.createIndex('timestamp', 'timestamp');
      }
      // 已缓存的地图瓦片元信息（可选，用于管理预下载区域）
      if (!db.objectStoreNames.contains('tileCacheMeta')) {
        db.createObjectStore('tileCacheMeta', { keyPath: 'tileKey' });
      }
    },
  });
  return dbInstance;
}

/**
 * 添加待同步的记录操作
 * @param operation 操作类型和数据
 */
export async function addPendingRecord(operation: Omit<PendingRecord, 'id' | 'timestamp'>) {
  const db = await initDB();
  const tx = db.transaction('pendingRecords', 'readwrite');
  await tx.store.add({
    ...operation,
    timestamp: Date.now(),
  });
  await tx.done;
}

/**
 * 获取所有待同步记录（按时间升序）
 */
export async function getAllPendingRecords(): Promise<PendingRecord[]> {
  const db = await initDB();
  const tx = db.transaction('pendingRecords', 'readonly');
  const index = tx.store.index('timestamp');
  const records = await index.getAll();
  await tx.done;
  return records;
}

/**
 * 删除已同步的记录
 * @param id 记录 id
 */
export async function deletePendingRecord(id: number) {
  const db = await initDB();
  const tx = db.transaction('pendingRecords', 'readwrite');
  await tx.store.delete(id);
  await tx.done;
}

/**
 * 清空所有待同步记录
 */
export async function clearPendingRecords() {
  const db = await initDB();
  const tx = db.transaction('pendingRecords', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

/**
 * 添加待上传的轨迹批次
 * @param track 轨迹数据
 */
export async function addPendingTrack(track: Omit<PendingTrack, 'id' | 'timestamp'>) {
  const db = await initDB();
  const tx = db.transaction('pendingTracks', 'readwrite');
  await tx.store.add({
    ...track,
    timestamp: Date.now(),
  });
  await tx.done;
}

/**
 * 获取所有待上传轨迹
 */
export async function getAllPendingTracks(): Promise<PendingTrack[]> {
  const db = await initDB();
  const tx = db.transaction('pendingTracks', 'readonly');
  const tracks = await tx.store.getAll();
  await tx.done;
  return tracks;
}

/**
 * 删除已上传的轨迹记录
 * @param id 轨迹 id
 */
export async function deletePendingTrack(id: number) {
  const db = await initDB();
  const tx = db.transaction('pendingTracks', 'readwrite');
  await tx.store.delete(id);
  await tx.done;
}

/**
 * 缓存地图瓦片元数据（用于预下载区域管理）
 * @param tileKey 瓦片唯一标识
 * @param data 元数据
 */
export async function cacheTileMeta(tileKey: string, data: any) {
  const db = await initDB();
  const tx = db.transaction('tileCacheMeta', 'readwrite');
  await tx.store.put({ tileKey, ...data });
  await tx.done;
}

/**
 * 获取所有已缓存瓦片元数据
 */
export async function getAllTileMeta() {
  const db = await initDB();
  const tx = db.transaction('tileCacheMeta', 'readonly');
  const metas = await tx.store.getAll();
  await tx.done;
  return metas;
}