/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { useDrilldownManager } from '../context';
import { DrilldownForm } from '../../components/drilldown_form';
import type { DrilldownState } from '../../state';
import type { TriggerPickerProps } from '../../components/trigger_picker';

export interface DrilldownStateFormProps {
  state: DrilldownState;
  disabled?: boolean;
}

export const DrilldownStateForm: React.FC<DrilldownStateFormProps> = ({ state, disabled }) => {
  const drilldowns = useDrilldownManager();
  const name = state.useName();
  const triggers = state.useTriggers();
  const config = state.useConfig();
  const triggerPickerProps: TriggerPickerProps = React.useMemo(
    () => ({
      items: state.uiTriggers.map((id) => {
        const trigger = drilldowns.deps.getTrigger(id);
        return trigger;
      }),
      selected: triggers,
      onChange: state.setTriggers,
    }),
    [drilldowns, triggers, state]
  );
  const context = state.getFactoryContext();

  return (
    <DrilldownForm
      name={name}
      onNameChange={state.setName}
      triggers={triggerPickerProps}
      disabled={disabled}
    >
      <state.factory.CollectConfig
        config={config}
        onConfig={disabled ? () => {} : state.setConfig}
        context={context}
      />
    </DrilldownForm>
  );
};
