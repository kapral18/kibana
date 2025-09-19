/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { UseEuiTheme } from '@elastic/eui';
import { makeHighContrastColor, tint } from '@elastic/eui';

export const getEmbeddableConsoleVariables = ({ euiTheme, colorMode }: UseEuiTheme) => {
  const isDark = colorMode === 'DARK';

  // Original SCSS: $embeddableConsoleBackground: lightOrDarkTheme($euiColorDarkestShade, $euiColorInk);
  const background = isDark ? euiTheme.colors.darkestShade : euiTheme.colors.ink;

  // Original SCSS: $embeddableConsoleText: lighten(makeHighContrastColor($euiColorLightestShade, $embeddableConsoleBackground), 20%);
  const baseTextColor = makeHighContrastColor(euiTheme.colors.lightestShade)(background);
  const text = tint(baseTextColor, 0.2); // lighten by 20%

  return {
    background,
    text,
    initialHeight: euiTheme.size.xxl,
    maxHeight: `calc(var(--kbn-application--content-height, 100vh) - ${euiTheme.size.base})`,
  };
};
