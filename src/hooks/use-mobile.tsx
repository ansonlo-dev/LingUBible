import * as React from "react"

const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIsMobile = () => {
      // Simplified and more reliable mobile detection
      const width = window.innerWidth
      const userAgent = navigator.userAgent
      
      // Check for mobile user agent
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      
      // Check for touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Simplified logic: Consider it mobile if:
      // 1. Has mobile user agent, OR
      // 2. Is a touch device AND screen width is below breakpoint
      // This makes browser emulation and real devices behave consistently
      return isMobileUserAgent || (isTouchDevice && width < MOBILE_BREAKPOINT)
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(checkIsMobile())
    }
    mql.addEventListener("change", onChange)
    setIsMobile(checkIsMobile())
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
