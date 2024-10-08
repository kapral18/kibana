/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * Renders the modal dialog which allows the user to run and view time series forecasts.
 */

import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import {
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
} from '@elastic/eui';

import { MessageCallOut } from '../../../components/message_call_out';
import { useMlKibana } from '../../../contexts/kibana';
import { getMlNodeCount } from '../../../ml_nodes_check/check_ml_nodes';
import { ForecastsList } from './forecasts_list';
import { RunControls } from './run_controls';

import { FormattedMessage } from '@kbn/i18n-react';

export function Modal(props) {
  const [mlNodesAvailable, setMlNodesAvailable] = useState(false);
  const {
    services: {
      mlServices: { mlApi },
    },
  } = useMlKibana();

  useEffect(
    function prepMlNodeCheck() {
      getMlNodeCount(mlApi)
        .then(({ count, lazyNodeCount }) => {
          setMlNodesAvailable(count !== 0 || lazyNodeCount !== 0);
        })
        .catch(console.error);
    },
    [mlApi]
  );

  return (
    <EuiModal onClose={props.close} maxWidth={860} data-test-subj="mlModalForecast">
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <FormattedMessage
            id="xpack.ml.timeSeriesExplorer.forecastingModal.forecastingTitle"
            defaultMessage="Forecasting"
          />
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {props.messages.map((message, i) => (
          <React.Fragment key={i}>
            <MessageCallOut {...message} />
            <EuiSpacer size="m" />
          </React.Fragment>
        ))}

        {props.forecasts.length > 0 && (
          <React.Fragment>
            <ForecastsList
              forecasts={props.forecasts}
              viewForecast={props.viewForecast}
              selectedForecastId={props.selectedForecastId}
            />
            <EuiSpacer />
          </React.Fragment>
        )}
        <RunControls {...props} mlNodesAvailable={mlNodesAvailable} jobState={props.jobState} />
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={props.close} size="s" data-test-subj="mlModalForecastButtonClose">
          <FormattedMessage
            id="xpack.ml.timeSeriesExplorer.forecastingModal.closeButtonLabel"
            defaultMessage="Close"
          />
        </EuiButtonEmpty>
      </EuiModalFooter>
    </EuiModal>
  );
}

Modal.propType = {
  job: PropTypes.object,
  forecasts: PropTypes.array,
  close: PropTypes.func.isRequired,
  viewForecast: PropTypes.func.isRequired,
  runForecast: PropTypes.func.isRequired,
  newForecastDuration: PropTypes.string,
  isNewForecastDurationValid: PropTypes.bool,
  newForecastDurationErrors: PropTypes.array,
  onNewForecastDurationChange: PropTypes.func.isRequired,
  isForecastRequested: PropTypes.bool,
  forecastProgress: PropTypes.number,
  jobOpeningState: PropTypes.number,
  jobClosingState: PropTypes.number,
  messages: PropTypes.array,
  selectedForecastId: PropTypes.string,
};
