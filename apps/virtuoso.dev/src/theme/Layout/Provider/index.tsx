import { FC, type ReactNode } from 'react'
import { composeProviders, useColorMode } from '@docusaurus/theme-common'
import {
  ColorModeProvider,
  AnnouncementBarProvider,
  ScrollControllerProvider,
  NavbarProvider,
  PluginHtmlClassNameProvider,
} from '@docusaurus/theme-common/internal'
import { DocsPreferredVersionContextProvider } from '@docusaurus/plugin-content-docs/client'
import type { Props } from '@theme/Layout/Provider'
import { Theme } from '@radix-ui/themes'

const RadixThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { colorMode } = useColorMode()
  return (
    <Theme accentColor="blue" grayColor="slate" panelBackground="solid" appearance={colorMode}>
      {children}
    </Theme>
  )
}

const Provider = composeProviders([
  ColorModeProvider,
  RadixThemeProvider,
  AnnouncementBarProvider,
  ScrollControllerProvider,
  DocsPreferredVersionContextProvider,
  PluginHtmlClassNameProvider,
  NavbarProvider,
])

export default function LayoutProvider({ children }: Props): ReactNode {
  return <Provider>{children}</Provider>
}
