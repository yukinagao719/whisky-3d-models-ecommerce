/**
 * 関数の実行を指定した遅延時間だけ遅らせるdebounce実装
 * lodashのdebounceと同等の機能を提供
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFunction = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };

  // lodashのdebounceと同様にcancel機能を提供
  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunction;
}