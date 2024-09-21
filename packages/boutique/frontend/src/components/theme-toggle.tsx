import { useThemeContext } from '@/lib/theme'
import { CSSProperties, useEffect } from 'react'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useThemeContext()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    const rootElement = document.documentElement

    rootElement.setAttribute('style', `color-scheme: ${theme};`)
    rootElement.setAttribute('class', `h-full ${theme}`)
  }, [theme])

  return (
    <div className="w-28 relative">
      <button
        style={
          {
            '--diameter': '2rem',
            '--spacing': '.2rem',
            '--offset': 'calc(100% - var(--diameter) - var(--spacing) * 2)',
            '--is-active': theme === 'dark' ? 1 : 0
          } as CSSProperties
        }
        type="button"
        aria-pressed={theme === 'dark'}
        aria-label={
          theme === 'dark' ? 'Activate light mode' : 'Activate dark mode'
        }
        className="border-none absolute shadow-[0px_0px_0px_2px_rgb(var(--black))] dark:shadow-[0px_0px_0px_2px_rgb(var(--white))] top-[-1.2rem] right-0 z-20 flex h-[calc(var(--diameter)_+_var(--spacing)_*_2)] w-[calc(var(--diameter)_*_2_+_var(--spacing)_*_3)] cursor-pointer items-center justify-around rounded-[2rem] bg-green-light transition-all before:absolute before:h-[var(--diameter)] before:w-[var(--diameter)] before:rounded-full before:bg-green before:transition-all dark:bg-purple-dark before:dark:bg-pink-neon dark:focus:shadow-glow-button before:start-[calc(var(--spacing)_+_var(--offset)_*_var(--is-active))] before:duration-300"
        onClick={() => toggleTheme()}
      >
        <svg
          fill="currentColor"
          viewBox="0 0 102 104"
          aria-hidden="true"
          focusable="false"
          className="h-6 w-6 text-black dark:text-white"
        >
          <path d="M52.553 103.648c-1.42 0-2.85-.06-4.26-.18-13.98-1.11-26.68-7.61-35.78-18.29-18.78-22.03-16.11-55.23 5.92-73.99 6.37-5.44 13.7-9.17 21.78-11.09 1.32-.31 2.68.13 3.55 1.16.87 1.02 1.09 2.46.58 3.7-6.61 15.86-3.79 33.8 7.33 46.86 11.12 13.06 28.42 18.69 45.12 14.69 1.3-.31 2.68.13 3.55 1.16.87 1.03 1.09 2.46.58 3.7-3.2 7.67-8.04 14.3-14.42 19.74-9.58 8.16-21.52 12.54-33.95 12.54Zm-17.17-94.51c-4.44 1.8-8.57 4.31-12.32 7.51-19.03 16.21-21.32 44.88-5.11 63.89 7.85 9.23 18.82 14.82 30.89 15.8 12.07.98 23.8-2.83 33.01-10.68 3.75-3.18 6.87-6.85 9.37-10.96-16.98 1.67-33.73-4.97-45.01-18.21-11.29-13.24-15.18-30.84-10.84-47.34l.02-.02-.01.01Z"></path>
        </svg>
        <svg
          fill="currentColor"
          viewBox="0 0 126 126"
          aria-hidden="true"
          focusable="false"
          className="h-6 w-6 text-black dark:text-white"
        >
          <path d="M63 97.06c-18.96 0-34.39-15.44-34.39-34.39 0-18.95 15.44-34.39 34.39-34.39 18.95 0 34.39 15.44 34.39 34.39 0 18.95-15.44 34.39-34.39 34.39Zm0-60.56c-14.43 0-26.16 11.73-26.16 26.16S48.57 88.82 63 88.82s26.16-11.73 26.16-26.16S77.43 36.5 63 36.5ZM94.32 35.68a4.07 4.07 0 0 1-2.91-1.2 4.11 4.11 0 0 1 0-5.82l10.22-10.22a4.11 4.11 0 0 1 5.82 0 4.11 4.11 0 0 1 0 5.82L97.23 34.48c-.8.8-1.86 1.2-2.91 1.2ZM121.75 67h-14.46a4.11 4.11 0 1 1 0-8.22h14.46a4.11 4.11 0 1 1 0 8.22ZM104.56 108.55a4.07 4.07 0 0 1-2.91-1.2L91.43 97.13a4.11 4.11 0 0 1 0-5.82 4.11 4.11 0 0 1 5.82 0l10.22 10.22a4.11 4.11 0 0 1-2.91 7.02ZM63 125.75a4.11 4.11 0 0 1-4.11-4.11v-14.46a4.11 4.11 0 1 1 8.22 0v14.46a4.11 4.11 0 0 1-4.11 4.11ZM21.45 108.55a4.07 4.07 0 0 1-2.91-1.2 4.11 4.11 0 0 1 0-5.82l10.22-10.22a4.11 4.11 0 0 1 5.82 0 4.11 4.11 0 0 1 0 5.82l-10.22 10.22c-.8.8-1.86 1.2-2.91 1.2ZM18.7 67H4.24a4.11 4.11 0 1 1 0-8.22H18.7a4.11 4.11 0 1 1 0 8.22ZM31.69 35.68a4.07 4.07 0 0 1-2.91-1.2L18.56 24.26a4.11 4.11 0 0 1 0-5.82 4.11 4.11 0 0 1 5.82 0L34.6 28.66a4.11 4.11 0 0 1-2.91 7.02ZM63 22.69a4.11 4.11 0 0 1-4.11-4.11V4.11a4.11 4.11 0 1 1 8.22 0v14.46A4.11 4.11 0 0 1 63 22.68v.01Z"></path>{' '}
        </svg>
      </button>
    </div>
  )
}
