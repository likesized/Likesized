export const OUTFIT_DISPLAY_SUFFIX = "/display.webp";
export const OUTFIT_FEED_SUFFIX = "/feed.webp";

export function outfitFeedPhotoPath(displayPath: string) {
  return displayPath.endsWith(OUTFIT_DISPLAY_SUFFIX)
    ? `${displayPath.slice(0, -OUTFIT_DISPLAY_SUFFIX.length)}${OUTFIT_FEED_SUFFIX}`
    : displayPath;
}
