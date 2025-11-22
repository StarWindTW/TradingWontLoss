"use client"

import { ThemeProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import * as React from "react"

export function ColorModeProvider(props: ThemeProviderProps & { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  )
}

export function useColorMode() {
  const { theme, setTheme, systemTheme } = useTheme()
  return {
    colorMode: theme,
    setColorMode: setTheme,
    systemTheme,
  }
}
