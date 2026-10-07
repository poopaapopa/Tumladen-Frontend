import { useEffect, useState } from 'react';
import { getCachedTileImage, loadTileImage } from '@/utils/tiles.config';

export const useTileImage = (tileId: string | undefined): HTMLImageElement | undefined => {
  const [, forceRender] = useState(0);
  const image = getCachedTileImage(tileId);

  useEffect(() => {
    if (!tileId || image) return;

    let isActive = true;
    void loadTileImage(tileId).then((loadedImage) => {
      if (isActive && loadedImage) {
        forceRender((revision) => revision + 1);
      }
    });

    return () => {
      isActive = false;
    };
  }, [tileId, image]);

  return image;
};
