/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ApmFeatureFlagName, ValueOfApmFeatureFlag } from '../../common/apm_feature_flags';
import { useApmPluginContext } from '../context/apm_plugin/use_apm_plugin_context';

export function useApmFeatureFlag<TApmFeatureFlagName extends ApmFeatureFlagName>(
  featureFlag: TApmFeatureFlagName
): ValueOfApmFeatureFlag<TApmFeatureFlagName> {
  const { config } = useApmPluginContext();
  return config.featureFlags[featureFlag];
}
