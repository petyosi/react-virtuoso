import React, { type ReactNode } from 'react';
import { ExternalLinkIcon } from '@radix-ui/react-icons';
import type { Props } from '@theme/Icon/ExternalLink';

import styles from './styles.module.css';

export default function IconExternalLink({
  width = 13.5,
  height = 13.5,
}: Props): ReactNode {
  return (
    <ExternalLinkIcon width={width} height={height}
      className={styles.iconExternalLink}
    />
  );
}
