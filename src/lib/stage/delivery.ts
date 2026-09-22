declare const __STAGE_ASSET_URLS__: Record<string, string>;

/** Build-time content hashes; original URLs remain usable by local bake/export tools. */
export function deliveryUrl(path: string): string {
  return typeof __STAGE_ASSET_URLS__ === 'undefined' ? path : __STAGE_ASSET_URLS__[path] ?? path;
}
