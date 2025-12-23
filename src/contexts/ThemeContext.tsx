import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = {
  primary: string;
  surface: string;
  text: string;
  textSecondary: string;
};

const lightTheme: Theme = {
  primary: '#2563eb',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
};

const darkTheme: Theme = {
  primary: '#60a5fa',
  surface: '#111827',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
};

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: lightTheme, toggle: () => {} });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const toggle = () => setIsDark(v => !v);
  const theme = isDark ? darkTheme : lightTheme;
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
