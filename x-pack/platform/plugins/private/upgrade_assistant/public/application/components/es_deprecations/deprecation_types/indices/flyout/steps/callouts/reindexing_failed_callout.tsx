/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Fragment } from 'react';
import { EuiCallOut, EuiSpacer } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';

interface Props {
  errorMessage: string;
}

export const ReindexingFailedCallOut: React.FunctionComponent<Props> = (props) => {
  const { errorMessage } = props;
  return (
    <Fragment>
      <EuiCallOut
        color="danger"
        iconType="warning"
        data-test-subj="reindexingFailedCallout"
        title={
          <FormattedMessage
            id="xpack.upgradeAssistant.esDeprecations.indices.indexFlyout.reindexStep.reindexingFailedCalloutTitle"
            defaultMessage="Reindexing error"
          />
        }
      >
        {errorMessage}
      </EuiCallOut>
      <EuiSpacer size="m" />
    </Fragment>
  );
};
