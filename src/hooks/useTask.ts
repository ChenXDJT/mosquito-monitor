import { useState, useEffect, useCallback, useRef } from 'react';
import { taskService } from '../services/taskService';
import { recordService } from '../services/recordService';
import { Task, TrackPoint, CreateTaskInput } from '../types';
import { TRACK_CONFIG } from '../config';
import { haversineDistance, wgs84ToBd09 } from '../utils/coordTransform';
import { addPendingTrack, getAllPendingTracks, deletePendingTrack } from '../utils/idbHelpers';

interface UseTaskReturn {
  currentTask: Task | null;
  tasks: Task[];
  isLoading: boolean;
  isTracking: boolean;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  startTask: (taskId: string) => Promise<void>;
  endTask: (taskId: string, report?: any) => Promise<void>;
  pauseTracking: () => void;
  resumeTracking: () => void;
  getTaskRecords: (taskId: string) => Promise<any[]>;
  syncOfflineTracks: () => Promise<void>;
}

export function useTask(): UseTaskReturn {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const trackBufferRef = useRef<TrackPoint[]>([]);
  const lastPointRef = useRef<TrackPoint | null>(null);
  const flushIntervalRef = useRef<number | null>(null);

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    try {
      const allTasks = await taskService.list();
      setTasks(allTasks);
      const active = allTasks.find(t => t.status === 'in_progress');
      setCurrentTask(active || null);
      if (active && active.status === 'in_progress') {
        // 自动恢复追踪（如果之前开启过，可根据本地存储标记）
      }
    } catch (error) {
      console.error('加载任务失败', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 创建任务
  const createTask = useCallback(async (input: CreateTaskInput) => {
    const newTask = await taskService.create(input);
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  // 开始任务（设置为进行中，并可选择开启轨迹追踪）
  const startTask = useCallback(async (taskId: string) => {
    // 如果已有进行中的任务，先结束
    if (currentTask && currentTask.id !== taskId) {
      await endTask(currentTask.id);
    }
    const task = await taskService.start(taskId);
    setCurrentTask(task);
    setTasks(prev => prev.map(t => t.id === taskId ? task : t));
    // 不自动开启追踪，由用户手动点击开启
  }, [currentTask]);

  // 轨迹采集回调
  const handlePosition = useCallback((position: GeolocationPosition) => {
    if (!isTracking || !currentTask) return;
    const { longitude, latitude, accuracy } = position.coords;
    const [bdLng, bdLat] = wgs84ToBd09(longitude, latitude);
    const now = Date.now();
    const newPoint: TrackPoint = { lng: bdLng, lat: bdLat, timestamp: now, accuracy };

    if (lastPointRef.current) {
      const dist = haversineDistance(
        lastPointRef.current.lng, lastPointRef.current.lat,
        newPoint.lng, newPoint.lat
      );
      if (dist < TRACK_CONFIG.MIN_DISTANCE_METERS) return;
    }

    trackBufferRef.current.push(newPoint);
    lastPointRef.current = newPoint;

    if (trackBufferRef.current.length >= TRACK_CONFIG.MAX_BATCH_SIZE) {
      flushTracks();
    }
  }, [isTracking, currentTask]);

  // 批量上传轨迹
  const flushTracks = useCallback(async () => {
    if (!currentTask || trackBufferRef.current.length === 0) return;
    const pointsToSend = [...trackBufferRef.current];
    trackBufferRef.current = [];

    try {
      await taskService.addTracks(currentTask.id, pointsToSend);
    } catch (error) {
      console.error('上传轨迹失败，存入离线队列', error);
      await addPendingTrack({
        taskId: currentTask.id,
        points: pointsToSend,
      });
    }
  }, [currentTask]);

  // 开启追踪
  const resumeTracking = useCallback(() => {
    if (watchIdRef.current !== null) return;
    if (!navigator.geolocation) {
      console.warn('浏览器不支持地理定位');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => console.error('定位错误', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    setIsTracking(true);
    // 定时批量上传
    if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    flushIntervalRef.current = window.setInterval(() => {
      flushTracks();
    }, TRACK_CONFIG.BATCH_INTERVAL_MS);
  }, [handlePosition, flushTracks]);

  // 暂停追踪
  const pauseTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }
    setIsTracking(false);
    // 立即上传剩余轨迹
    flushTracks();
  }, [flushTracks]);

  // 结束任务
  const endTask = useCallback(async (taskId: string, report?: any) => {
    if (watchIdRef.current !== null) {
      pauseTracking();
    }
    // 计算总路程：从后端获取所有轨迹点累加
    const tracks = await taskService.getTracks(taskId);
    let totalDistance = 0;
    if (tracks.length > 0) {
      let prev = tracks[0];
      for (let i = 1; i < tracks.length; i++) {
        totalDistance += haversineDistance(prev.lng, prev.lat, tracks[i].lng, tracks[i].lat);
        prev = tracks[i];
      }
    }
    await taskService.complete(taskId, { ...report, totalDistance });
    setCurrentTask(null);
    await loadTasks();
  }, [pauseTracking, loadTasks]);

  // 获取任务关联的记录（用于导出等）
  const getTaskRecords = useCallback(async (taskId: string) => {
    return await recordService.list({ taskId });
  }, []);

  // 同步离线轨迹（网络恢复后调用）
  const syncOfflineTracks = useCallback(async () => {
    const pendingList = await getAllPendingTracks();
    for (const pending of pendingList) {
      try {
        await taskService.addTracks(pending.taskId, pending.points);
        await deletePendingTrack(pending.id!);
      } catch (error) {
        console.error('同步离线轨迹失败', error);
      }
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadTasks();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    };
  }, [loadTasks]);

  return {
    currentTask,
    tasks,
    isLoading,
    isTracking,
    createTask,
    startTask,
    endTask,
    pauseTracking,
    resumeTracking,
    getTaskRecords,
    syncOfflineTracks,
  };
}