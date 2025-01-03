/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexGroup, EuiFlexItem, EuiHeaderLink, EuiHeaderLinks } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { useContext } from 'react';
import { Routes, Route } from '@kbn/shared-ux-router';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { HeaderMenuPortal, useLinkProps } from '@kbn/observability-shared-plugin/public';
import type { SharePublicStart } from '@kbn/share-plugin/public/plugin';
import {
  type ObservabilityOnboardingLocatorParams,
  OBSERVABILITY_ONBOARDING_LOCATOR,
} from '@kbn/deeplinks-observability';
import { dynamic } from '@kbn/shared-ux-utility';
import { isDevMode } from '@kbn/xstate-utils';
import { type LogsLocatorParams, LOGS_LOCATOR_ID } from '@kbn/logs-shared-plugin/common';
import { LazyAlertDropdownWrapper } from '../../alerting/log_threshold';
import { HelpCenterContent } from '../../components/help_center_content';
import { useReadOnlyBadge } from '../../hooks/use_readonly_badge';
import { HeaderActionMenuContext } from '../../containers/header_action_menu_provider';
import { RedirectWithQueryParams } from '../../utils/redirect_with_query_params';
import { NotFoundPage } from '../404';
import { getLogsAppRoutes } from './routes';

const LogEntryCategoriesPage = dynamic(() =>
  import('./log_entry_categories').then((mod) => ({ default: mod.LogEntryCategoriesPage }))
);
const LogEntryRatePage = dynamic(() =>
  import('./log_entry_rate').then((mod) => ({ default: mod.LogEntryRatePage }))
);

const StateMachinePlayground = dynamic(() =>
  import('../../observability_logs/xstate_helpers').then((mod) => ({
    default: mod.StateMachinePlayground,
  }))
);

export const LogsPageContent: React.FunctionComponent = () => {
  const { application, share } = useKibana<{ share: SharePublicStart }>().services;

  const uiCapabilities = application?.capabilities;
  const onboardingLocator = share?.url.locators.get<ObservabilityOnboardingLocatorParams>(
    OBSERVABILITY_ONBOARDING_LOCATOR
  );
  const { setHeaderActionMenu, theme$ } = useContext(HeaderActionMenuContext);

  const enableDeveloperRoutes = isDevMode();

  useReadOnlyBadge(!uiCapabilities?.logs?.save);

  const routes = getLogsAppRoutes();

  const settingsLinkProps = useLinkProps({
    app: 'logs',
    pathname: 'settings',
  });

  return (
    <>
      <HelpCenterContent feedbackLink={feedbackLinkUrl} appName={pageTitle} />

      {setHeaderActionMenu && theme$ && (
        <HeaderMenuPortal setHeaderActionMenu={setHeaderActionMenu} theme$={theme$}>
          <EuiFlexGroup responsive={false} gutterSize="s">
            <EuiFlexItem>
              <EuiHeaderLinks gutterSize="xs">
                <EuiHeaderLink color={'text'} {...settingsLinkProps}>
                  {settingsTabTitle}
                </EuiHeaderLink>
                <LazyAlertDropdownWrapper />
                <EuiHeaderLink
                  href={onboardingLocator?.useUrl({ category: 'logs' })}
                  color="primary"
                  iconType="indexOpen"
                >
                  {ADD_DATA_LABEL}
                </EuiHeaderLink>
              </EuiHeaderLinks>
            </EuiFlexItem>
          </EuiFlexGroup>
        </HeaderMenuPortal>
      )}

      <Routes>
        <Route
          path="/stream"
          exact
          render={() => {
            share.url.locators.get<LogsLocatorParams>(LOGS_LOCATOR_ID)?.navigate({});

            return null;
          }}
        />
        <Route path={routes.logsAnomalies.path} component={LogEntryRatePage} />
        <Route path={routes.logsCategories.path} component={LogEntryCategoriesPage} />
        {enableDeveloperRoutes && (
          <Route path={'/state-machine-playground'} component={StateMachinePlayground} />
        )}
        <RedirectWithQueryParams from={'/analysis'} to={routes.logsAnomalies.path} exact />
        <RedirectWithQueryParams from={'/log-rate'} to={routes.logsAnomalies.path} exact />
        <RedirectWithQueryParams from={'/'} to={routes.logsAnomalies.path} exact />

        <Route render={() => <NotFoundPage title={pageTitle} />} />
      </Routes>
    </>
  );
};

const pageTitle = i18n.translate('xpack.infra.header.logsTitle', {
  defaultMessage: 'Logs',
});

const settingsTabTitle = i18n.translate('xpack.infra.logs.index.settingsTabTitle', {
  defaultMessage: 'Settings',
});

const feedbackLinkUrl = 'https://discuss.elastic.co/c/logs';

const ADD_DATA_LABEL = i18n.translate('xpack.infra.logsHeaderAddDataButtonLabel', {
  defaultMessage: 'Add data',
});
