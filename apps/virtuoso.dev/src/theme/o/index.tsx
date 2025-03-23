import { translate } from '@docusaurus/Translate';
import useIsBrowser from '@docusaurus/useIsBrowser';
import type { Props } from '@theme/ColorModeToggle';
import clsx from 'clsx';
import React, { type ReactNode } from 'react';

import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import styles from './styles.module.css';

function ColorModeToggle({
  className,
  buttonClassName,
  value,
  onChange,
}: Props): ReactNode {
  const isBrowser = useIsBrowser();

  const title = translate(
    {
      message: 'Switch between dark and light mode (currently {mode})',
      id: 'theme.colorToggle.ariaLabel',
      description: 'The ARIA label for the navbar color mode toggle',
    },
    {
      mode:
        value === 'dark'
          ? translate({
            message: 'dark mode',
            id: 'theme.colorToggle.ariaLabel.mode.dark',
            description: 'The name for the dark color mode',
          })
          : translate({
            message: 'light mode',
            id: 'theme.colorToggle.ariaLabel.mode.light',
            description: 'The name for the light color mode',
          }),
    },
  );

  return (
    <div className={clsx(styles.toggle, className)}>
      <button
        className={clsx(
          'clean-btn',
          styles.toggleButton,
          !isBrowser && styles.toggleButtonDisabled,
          buttonClassName,
        )}
        type="button"
        onClick={() => onChange(value === 'dark' ? 'light' : 'dark')}
        disabled={!isBrowser}
        title={title}
        aria-label={title}
        aria-live="polite"
        aria-pressed={value === 'dark' ? 'true' : 'false'}>
        <SunIcon
          className={clsx(styles.toggleIcon, styles.lightToggleIcon)}
        />
        <MoonIcon
          className={clsx(styles.toggleIcon, styles.darkToggleIcon)}
        />
      </button>
    </div>
  );
}

export default React.memo(ColorModeToggle);
