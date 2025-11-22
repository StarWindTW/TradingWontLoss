'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SessionProvider } from 'next-auth/react';
import { ColorModeProvider } from '@/components/ui/color-mode';
import { system } from '@/lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ChakraProvider value={system}>
        <ColorModeProvider>
          {children}
        </ColorModeProvider>
      </ChakraProvider>
    </SessionProvider>
  );
}