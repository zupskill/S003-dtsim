export { apiFetch } from "./api";

export function installApiInterceptor(): void {
  // No-op: Direct mutation of window.fetch is avoided to prevent TypeError in restricted iframe environments.
}
