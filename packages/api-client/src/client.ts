/**
 * @oura-pix/api-client - Shared API client package
 *
 * Provides HTTP client and API endpoint definitions for OuraPix
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

export interface ApiClientConfig {
  baseURL: string;
  credentials?: RequestCredentials;
}

/**
 * Create an API client instance
 */
export function createClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: config.credentials === "include",
  });

  return client;
}
