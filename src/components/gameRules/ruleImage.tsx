import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type MutableRefObject,
  type SyntheticEvent,
} from 'react';
import clsx from 'clsx';
import styles from './ruleImage.module.scss';

type RuleImageStatus = 'loading' | 'ready' | 'error';

interface RuleImageState {
  sourceKey: string;
  status: RuleImageStatus;
}

export interface RuleImageProps extends Omit<ComponentPropsWithoutRef<'img'>, 'alt'> {
  alt: string;
}

const assignRef = (
  ref: ForwardedRef<HTMLImageElement>,
  image: HTMLImageElement | null,
) => {
  if (typeof ref === 'function') {
    ref(image);
    return;
  }

  if (ref) {
    (ref as MutableRefObject<HTMLImageElement | null>).current = image;
  }
};

export const RuleImage = forwardRef<HTMLImageElement, RuleImageProps>(function RuleImage({
  src,
  srcSet,
  sizes,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  alt,
  className,
  onLoad,
  onError,
  ...imageProps
}, forwardedRef) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceKey = `${src ?? ''}\n${srcSet ?? ''}\n${sizes ?? ''}`;
  const [imageState, setImageState] = useState<RuleImageState>({
    sourceKey,
    status: 'loading',
  });
  const status = imageState.sourceKey === sourceKey ? imageState.status : 'loading';

  const revealAfterDecode = useCallback(async (
    image: HTMLImageElement,
    expectedSourceKey: string,
  ) => {
    try {
      await image.decode();
    } catch {
      // Some browsers reject decode() for an otherwise successfully loaded image.
    }

    if (imageRef.current !== image || image.naturalWidth === 0) return;

    setImageState({ sourceKey: expectedSourceKey, status: 'ready' });
  }, []);

  const setImageRef = useCallback((image: HTMLImageElement | null) => {
    imageRef.current = image;
    assignRef(forwardedRef, image);

    if (!image?.complete) return;

    if (image.naturalWidth === 0) {
      setImageState({ sourceKey, status: 'error' });
      return;
    }

    void revealAfterDecode(image, sourceKey);
  }, [forwardedRef, revealAfterDecode, sourceKey]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    onLoad?.(event);
    void revealAfterDecode(image, sourceKey);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);
    setImageState({ sourceKey, status: 'error' });
  };

  return (
    <img
      {...imageProps}
      ref={setImageRef}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      alt={alt}
      className={clsx(
        styles.ruleImage,
        status === 'ready' && styles.ruleImage_ready,
        status === 'error' && styles.ruleImage_error,
        className,
      )}
      onLoad={handleLoad}
      onError={handleError}
      aria-busy={status === 'loading' || undefined}
      data-state={status}
    />
  );
});
