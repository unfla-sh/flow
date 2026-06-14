import { useEffect, useMemo, useRef } from 'react'

/**
 * Returns a debounced version of `callback`. The latest callback is always
 * invoked, and any pending invocation is cancelled on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 300,
) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useMemo(
    () =>
      (...args: Args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args)
        }, delay)
      },
    [delay],
  )
}
