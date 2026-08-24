import { useRef } from "react"

export function useClosingSnapshot<T>(open: boolean, value: T) {
  const snapshot = useRef(value)

  if (open) {
    snapshot.current = value
  }

  return snapshot.current
}
