import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import type {Props} from '@theme/CodeBlock/WordWrapButton';
import IconWordWrap from '@theme/Icon/WordWrap';

import styles from './styles.module.css';

export default function WordWrapButton({
  className,
  onClick,
  isEnabled,
}: Props): ReactNode {
  const title = translate({
    id: 'theme.CodeBlock.wordWrapToggle',
    message: 'Toggle word wrap',
    description:
      'The title attribute for toggle word wrapping button of code block lines',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'clean-btn',
        className,
        isEnabled && styles.wordWrapButtonEnabled,
      )}
      aria-label={title}
      title={title}>
      <IconWordWrap className={styles.wordWrapButtonIcon} aria-hidden="true" />
    </button>
  );
}
