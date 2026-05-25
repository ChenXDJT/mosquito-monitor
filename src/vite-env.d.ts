/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_BASE: string;
  readonly VITE_BAIDU_MAP_AK: string;
  // 更多环境变量可以在此添加
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 声明静态资源模块（可选，用于图片等导入）
declare module '*.png' {
  const value: string;
  export default value;
}
declare module '*.jpg' {
  const value: string;
  export default value;
}
declare module '*.jpeg' {
  const value: string;
  export default value;
}
declare module '*.svg' {
  const value: string;
  export default value;
}
declare module '*.css' {
  const content: string;
  export default content;
}