/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Redirect } from 'react-router-dom';
import { Router, Routes, Route } from '@kbn/shared-ux-router';
import { Observable } from 'rxjs';
import { first } from 'rxjs';

import { CoreStart } from '@kbn/core/public';
import { ManagementAppMountParams } from '@kbn/management-plugin/public';
import { KibanaRenderContextProvider } from '@kbn/react-kibana-context-render';
import {
  ClusterService,
  MonitoringService,
  PipelineService,
  PipelinesService,
  // @ts-ignore
} from '../services';
// @ts-ignore
import { PipelineList } from './components/pipeline_list';
import { PipelineEditView } from './pipeline_edit_view';
// @ts-ignore
import * as Breadcrumbs from './breadcrumbs';

export const renderApp = async (
  core: CoreStart,
  { history, element, setBreadcrumbs }: ManagementAppMountParams,
  isMonitoringEnabled: boolean,
  licenseService$: Observable<any>,
  isServerless: boolean
) => {
  const logstashLicenseService = await licenseService$.pipe(first()).toPromise();
  const clusterService = new ClusterService(core.http);
  const monitoringService = new MonitoringService(core.http, isMonitoringEnabled, clusterService);
  const pipelinesService = new PipelinesService(core.http, monitoringService);
  const pipelineService = new PipelineService(core.http, pipelinesService);

  ReactDOM.render(
    <KibanaRenderContextProvider {...core}>
      <Router history={history}>
        <Routes>
          <Route
            path={['/', '']}
            exact
            render={() => {
              setBreadcrumbs(Breadcrumbs.getPipelineListBreadcrumbs());
              return (
                <PipelineList
                  clusterService={clusterService}
                  isServerless={isServerless}
                  isReadOnly={logstashLicenseService.isReadOnly}
                  isForbidden={true}
                  isLoading={false}
                  licenseService={logstashLicenseService}
                  monitoringService={monitoringService}
                  openPipeline={(id: string) => history.push(`/pipeline/${id}/edit`)}
                  clonePipeline={(id: string) => history.push(`/pipeline/${id}/edit?clone`)}
                  createPipeline={() => history.push(`pipeline/new-pipeline`)}
                  pipelinesService={pipelinesService}
                  toastNotifications={core.notifications.toasts}
                />
              );
            }}
          />
          <Route
            path="/pipeline/new-pipeline"
            exact
            render={() => (
              <PipelineEditView
                history={history}
                setBreadcrumbs={setBreadcrumbs}
                logstashLicenseService={logstashLicenseService}
                pipelineService={pipelineService}
                toasts={core.notifications.toasts}
              />
            )}
          />
          <Route
            path="/pipeline/:id"
            exact
            render={({ match }) => <Redirect to={`/pipeline/${match.params.id}/edit`} />}
          />
          <Route
            path="/pipeline/:id/edit"
            exact
            render={({ match }) => (
              <PipelineEditView
                history={history}
                setBreadcrumbs={setBreadcrumbs}
                logstashLicenseService={logstashLicenseService}
                pipelineService={pipelineService}
                toasts={core.notifications.toasts}
                id={match.params.id}
              />
            )}
          />
        </Routes>
      </Router>
    </KibanaRenderContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
