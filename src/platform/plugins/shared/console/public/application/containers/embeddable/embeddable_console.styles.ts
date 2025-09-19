/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { css } from '@emotion/react';
import {
  type UseEuiTheme,
  useEuiTheme,
  useEuiScrollBar,
  useEuiBreakpoint,
  makeHighContrastColor,
  tint,
} from '@elastic/eui';
import { getEmbeddableConsoleVariables } from './embeddable_console_variables';

export const useEmbeddableConsoleStyles = () => {
  const euiThemeContext = useEuiTheme();
  const { euiTheme } = euiThemeContext;
  const variables = getEmbeddableConsoleVariables(euiThemeContext);
  const scrollBarStyle = useEuiScrollBar();

  return {
    // Global body style when embeddable console is present
    bodyWithEmbeddableConsole: css`
      &.kbnBody--hasEmbeddableConsole .euiPageTemplate main {
        // Ensure page content is not overlapped by console control bar
        padding-bottom: ${variables.initialHeight};
      }
    `,

    container: css`
      background: ${variables.background};
      color: ${variables.text};
      display: flex;
      flex-direction: column;
      // This large box shadow helps prevent a flicker of dark
      // background when the content is shown and hidden
      box-shadow: inset 0 ${variables.initialHeight} 0 ${variables.background},
        inset 0 600rem 0 ${euiTheme.colors.body};
      bottom: var(--kbn-application--content-bottom, 0);
      right: var(--kbn-application--content-right, 0);
      transform: translateY(0);
      height: ${variables.initialHeight};
      max-height: ${variables.maxHeight};

      ${useEuiBreakpoint(['xs', 's'])} {
        &:not(.embeddableConsole--showOnMobile) {
          display: none;
        }
      }
    `,

    containerFixed: css`
      position: fixed;
      z-index: calc(${euiTheme.levels.header} - 2);
    `,

    containerProjectChrome: css`
      left: calc(var(--euiCollapsibleNavOffset, 0) + var(--kbn-application--content-left, 0));
    `,

    containerClassicChrome: css`
      left: calc(var(--kbnSolutionNavOffset, 0) + var(--kbn-application--content-left, 0));
    `,

    containerUnknownChrome: css`
      left: var(--kbn-application--content-left, 0);
    `,

    containerOpen: css`
      animation-duration: ${euiTheme.animation.normal};
      animation-timing-function: ${euiTheme.animation.resistance};
      animation-fill-mode: forwards;
      animation-name: embeddableConsoleOpenPanel;
      height: var(--embedded-console-height);
      bottom: calc(var(--embedded-console-bottom) + var(--kbn-application--content-bottom, 0));

      @keyframes embeddableConsoleOpenPanel {
        0% {
          transform: translateY(-${variables.initialHeight});
        }

        100% {
          transform: translateY(var(--embedded-console-bottom));
        }
      }
    `,

    controls: css`
      height: ${variables.initialHeight};
      width: 100%;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      overflow-y: hidden; // Ensures the movement of buttons in :focus don't cause scrollbars
      overflow-x: auto;
      padding-right: ${euiTheme.size.s};
    `,

    controlsButton: css`
      flex-grow: 1;
      width: 100%;

      .euiButtonEmpty__content {
        justify-content: flex-start;
      }
    `,

    controlsAltViewButtonContainer: css`
      margin-left: auto;
    `,

    content: css`
      ${scrollBarStyle}
      overflow-y: auto;
      width: 100%;
      height: calc(100% - ${variables.initialHeight});
      background-color: ${euiTheme.colors.body};
      animation-name: embeddableConsoleShowContent;
      animation-duration: ${euiTheme.animation.slow};
      animation-iteration-count: 1;
      animation-timing-function: ${euiTheme.animation.resistance};
      color: ${euiTheme.colors.darkestShade};

      #consoleRoot {
        height: 100%;
      }

      @keyframes embeddableConsoleShowContent {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
      }
    `,
  };
};

// Function to generate button type styles for embeddable console
export const getEmbeddableConsoleButtonStyles = (
  { euiTheme }: UseEuiTheme,
  variables: ReturnType<typeof getEmbeddableConsoleVariables>
) => {
  const buttonTypeColors = {
    primary: euiTheme.colors.primary,
    success: euiTheme.colors.success,
    warning: euiTheme.colors.warning,
    danger: euiTheme.colors.danger,
    text: euiTheme.colors.text,
  };

  return Object.entries(buttonTypeColors).reduce((styles, [colorName, colorValue]) => {
    styles[`link${colorName.charAt(0).toUpperCase() + colorName.slice(1)}`] = css`
      &.euiLink.euiLink--${colorName} {
        color: ${makeHighContrastColor(colorValue)(variables.background)};

        &:hover {
          color: ${tint(colorValue, 0.3)};
        }
      }
    `;

    if (colorName === 'text') {
      styles.linkText = css`
        &.euiLink.euiLink--text {
          color: ${euiTheme.colors.ghost};
        }
      `;
    }

    styles[`button${colorName.charAt(0).toUpperCase() + colorName.slice(1)}`] = css`
      &.embeddableConsole__button.euiButton[class*='${colorName}']:enabled:not(.euiButton--fill) {
        color: ${makeHighContrastColor(colorValue)(variables.background)};
        border-color: ${makeHighContrastColor(colorValue)(variables.background)};
      }
    `;

    styles[`buttonIcon${colorName.charAt(0).toUpperCase() + colorName.slice(1)}`] = css`
      &.euiButtonIcon[class*='${colorName}'] {
        color: ${makeHighContrastColor(colorValue)(variables.background)};
      }
    `;

    return styles;
  }, {} as Record<string, any>);
};
