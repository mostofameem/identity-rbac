import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env';

const API_BASE_URL = config.apiBaseUrl;

// Shared auth interceptors for every axios instance in the app.
//
// On a 401 the client tries the refresh token once and retries the original
// request. If the session can't be recovered (no refresh token, or the refresh
// request fails), the user is logged out and sent to the login page with
// ?expired=1 — LoginPage shows a "session expired" notice for that flag.

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Auth endpoints must not trigger refresh/logout: a wrong-password 401 on
// /login or a failed /token/refresh should surface inline, not bounce the
// user to the login page again.
const isAuthEndpoint = (url?: string) =>
  Boolean(
    url &&
    (url.includes('/login') ||
      url.includes('/token/refresh') ||
      url.includes('/auth/') ||
      url.includes('/register'))
  );

let loggedOut = false;

/** Clear the stored session and redirect to login. Safe to call repeatedly. */
export const forceLogout = (): void => {
  if (loggedOut) return;
  loggedOut = true;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('permissions');
  window.location.assign('/login?expired=1');
};

// Bridge for surfacing interceptor-level messages through the React tree
// (the SnackbarProvider registers itself on mount).
export type ApiNotifier = (message: string) => void;
let notifier: ApiNotifier | null = null;
export const setApiNotifier = (fn: ApiNotifier | null): void => {
  notifier = fn;
};

// One shared in-flight refresh so concurrent 401s (e.g. the dashboard's
// parallel stat requests) don't fire multiple refresh calls at once.
let refreshPromise: Promise<string> | null = null;

const getFreshAccessToken = async (): Promise<string> => {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    refreshPromise = axios
      .get(`${API_BASE_URL}/api/v1/token/refresh?token=${encodeURIComponent(refreshToken)}`)
      .then((response) => {
        const { accessToken } = response.data;
        localStorage.setItem('token', accessToken);
        return accessToken as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export const attachAuthInterceptors = (instance: AxiosInstance): void => {
  // Attach the bearer token
  instance.interceptors.request.use((requestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  });

  // Refresh-and-retry on 401; force logout when unrecoverable.
  // 403 surfaces a "no permission" message — the user stays logged in.
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config as RetriableConfig | undefined;
      const status: number | undefined = error.response?.status;

      if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
        original._retry = true;
        try {
          const accessToken = await getFreshAccessToken();
          original.headers.Authorization = `Bearer ${accessToken}`;
          return instance(original);
        } catch {
          forceLogout();
          return Promise.reject(error);
        }
      }

      if (status === 403 && !isAuthEndpoint(original?.url)) {
        const message =
          error.response?.data?.message || "You don't have permission to perform this action.";
        notifier?.(message);
        return Promise.reject(new Error(message));
      }

      return Promise.reject(error);
    }
  );
};
