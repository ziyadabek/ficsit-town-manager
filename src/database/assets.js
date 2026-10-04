export const getItemIcon = (name) => `/icons/Items/${name}.png`;
export const getBuildingIcon = (name) => `/icons/Buildings/${name}.png`;

export function getAssetUrl(path) {
  if (!path) return '';
  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const full = base.endsWith('/') ? base + cleanPath : base + '/' + cleanPath;
  return encodeURI(full);
}
