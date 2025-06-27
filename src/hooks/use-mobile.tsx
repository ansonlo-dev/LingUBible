import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIsMobile = () => {
      // Check if it's actually a mobile device using multiple criteria
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent
      
      // Check for mobile user agent
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      
      // Check for touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // For truly mobile devices, use the width breakpoint
      if (isMobileUserAgent || (isTouchDevice && width < MOBILE_BREAKPOINT && height < 1024)) {
        return true
      }
      
      // For desktop browsers, only consider it mobile if the width is very small (likely a phone)
      // This prevents desktop windows resized to half-screen from being considered mobile
      return width < 480
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
