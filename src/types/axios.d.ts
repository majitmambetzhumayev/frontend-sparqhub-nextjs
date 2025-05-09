// src/types/axios.d.ts
import 'axios';

declare module 'axios' {
  // augment the existing InternalAxiosRequestConfig interface
  export interface InternalAxiosRequestConfig {
    /** our custom flag to prevent infinite retry loops */
    _retry?: boolean;
  }
}
