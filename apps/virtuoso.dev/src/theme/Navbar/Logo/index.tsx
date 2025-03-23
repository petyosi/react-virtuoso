import React, { type ReactNode } from 'react';
import Logo from './logo.svg';
import { Box } from '@radix-ui/themes';

export default function NavbarLogo(): ReactNode {
  return (
    <Box mr="4">
      <Logo style={{ fill: 'var(--gray-12)' }} />
    </Box>
  );
}
