import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router (unlike server-rendered navigation) does not reset scroll
// position between route changes — without this, a new page can render
// already scrolled to wherever the previous page was left.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
