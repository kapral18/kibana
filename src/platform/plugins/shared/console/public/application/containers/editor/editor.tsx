/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useCallback, memo, useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { debounce } from 'lodash';
import {
  EuiProgress,
  EuiSplitPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiResizableContainer,
  useIsWithinBreakpoints,
  useEuiTheme,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import type { TextObject } from '../../../../common/text_object';

import {
  EditorContentSpinner,
  OutputPanelEmptyState,
  NetworkRequestStatusBar,
} from '../../components';
import { getAutocompleteInfo, StorageKeys } from '../../../services';
import {
  useServicesContext,
  useRequestReadContext,
  useRequestActionContext,
  useEditorActionContext,
  useEditorReadContext,
} from '../../contexts';
import { MonacoEditor } from './monaco_editor';
import { MonacoEditorOutput } from './monaco_editor_output';
import { getResponseWithMostSevereStatusCode } from '../../../lib/utils';

const INITIAL_PANEL_SIZE = 50;
const PANEL_MIN_SIZE = '20%';
const DEBOUNCE_DELAY = 500;

const useEditorStyles = () => {
  const { euiTheme } = useEuiTheme();

  return {
    consoleEditorPanel: css`
      display: flex;
      flex: 1 1 auto;
      position: absolute;
      left: 0;
      bottom: 0;
      right: 0;
      overflow: hidden;
    `,

    editorContainer: css`
      width: 100%;
      display: flex;
      flex: 0 0 auto;
      position: relative;
    `,

    editorSpinner: css`
      width: 100%;
      background-color: ${euiTheme.colors.lightestShade};
    `,

    outputContainer: css`
      height: 100%;
      display: flex;
      flex: 1 1 1px;
    `,

    editorContent: css`
      height: 100%;
      flex: 1 1 1px;
    `,

    outputContent: css`
      height: 100%;
      flex: 1 1 1px;
    `,

    requestProgressBarContainer: css`
      position: relative;
      z-index: ${euiTheme.levels.menu};
    `,

    resizerButton: css`
      // Give the aria selection border priority when the divider is selected on IE11 and Chrome
      z-index: ${euiTheme.levels.header};
      background-color: ${euiTheme.colors.lightestShade};
      // The margin ensures that the resizer doesn't cover the top border of the selected request
      // in the output panel, when in vertical layout
      margin-bottom: 1px;
      // The margin ensures that the resizer doesn't cover the first Monaco editor's ruler
      margin-inline: 0;
    `,

    // Consolidated styles for editor panels with positioning
    editorPanelPositioned: css`
      display: flex;
      flex: 1 1 auto;
      position: absolute;
      left: 0;
      bottom: 0;
      right: 0;
      overflow: hidden;
      top: 0;
      height: calc(100% - 40px);
    `,

    // Output panel with centering and positioning
    outputPanelCentered: css`
      display: flex;
      flex: 1 1 auto;
      position: absolute;
      left: 0;
      bottom: 0;
      right: 0;
      overflow: hidden;
      align-content: center;
      top: 0;
      height: calc(100% - 40px);
    `,

    // Panel with background color for actions
    actionsPanelWithBackground: css`
      display: flex;
      flex: 1 1 auto;
      position: absolute;
      left: 0;
      bottom: 0;
      right: 0;
      overflow: hidden;
      background-color: ${euiTheme.colors.backgroundBasePlain};
    `,

    // Full height panel
    fullHeightPanel: css`
      height: 100%;
    `,
  };
};

interface Props {
  loading: boolean;
  inputEditorValue: string;
  setInputEditorValue: (value: string) => void;
}

export const Editor = memo(({ loading, inputEditorValue, setInputEditorValue }: Props) => {
  const {
    services: { storage, objectStorageClient },
  } = useServicesContext();
  const editorStyles = useEditorStyles();

  const { currentTextObject } = useEditorReadContext();

  const {
    requestInFlight,
    lastResult: { data: requestData, error: requestError },
  } = useRequestReadContext();

  const dispatch = useRequestActionContext();
  const editorDispatch = useEditorActionContext();

  const [fetchingAutocompleteEntities, setFetchingAutocompleteEntities] = useState(false);

  useEffect(() => {
    const debouncedSetFechingAutocompleteEntities = debounce(
      setFetchingAutocompleteEntities,
      DEBOUNCE_DELAY
    );
    const subscription = getAutocompleteInfo().isLoading$.subscribe(
      debouncedSetFechingAutocompleteEntities
    );

    return () => {
      subscription.unsubscribe();
      debouncedSetFechingAutocompleteEntities.cancel();
    };
  }, []);

  const [firstPanelSize, secondPanelSize] = storage.get(StorageKeys.SIZE, [
    INITIAL_PANEL_SIZE,
    INITIAL_PANEL_SIZE,
  ]);

  const isVerticalLayout = useIsWithinBreakpoints(['xs', 's', 'm']);

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const onPanelSizeChange = useCallback(
    debounce((sizes) => {
      storage.set(StorageKeys.SIZE, Object.values(sizes));
    }, 300),
    []
  );

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const debouncedUpdateLocalStorageValue = useCallback(
    debounce((newValue: string | undefined) => {
      const textObject = {
        ...currentTextObject,
        text: newValue,
        updatedAt: Date.now(),
      } as TextObject;

      objectStorageClient.text.update(textObject);

      editorDispatch({
        type: 'setCurrentTextObject',
        payload: textObject,
      });
    }, DEBOUNCE_DELAY),
    []
  );

  // Always keep the localstorage value in sync with the value in the editor
  // to avoid losing the text object when the user navigates away from the shell
  useEffect(() => {
    debouncedUpdateLocalStorageValue(inputEditorValue);
  }, [debouncedUpdateLocalStorageValue, inputEditorValue]);

  if (!currentTextObject) return null;

  const data = getResponseWithMostSevereStatusCode(requestData) ?? requestError;
  const isLoading = loading || requestInFlight;

  return (
    <>
      {fetchingAutocompleteEntities ? (
        <div css={editorStyles.requestProgressBarContainer}>
          <EuiProgress size="xs" color="accent" position="absolute" />
        </div>
      ) : null}
      <EuiResizableContainer
        css={editorStyles.fullHeightPanel}
        direction={isVerticalLayout ? 'vertical' : 'horizontal'}
        onPanelWidthChange={(sizes) => onPanelSizeChange(sizes)}
        data-test-subj="consoleEditorContainer"
      >
        {(EuiResizablePanel, EuiResizableButton) => (
          <>
            <EuiResizablePanel
              initialSize={firstPanelSize}
              minSize={PANEL_MIN_SIZE}
              tabIndex={0}
              paddingSize="none"
            >
              <EuiSplitPanel.Outer
                grow={true}
                borderRadius="none"
                hasShadow={false}
                css={editorStyles.fullHeightPanel}
              >
                <EuiSplitPanel.Inner
                  paddingSize="none"
                  grow={true}
                  css={editorStyles.editorPanelPositioned}
                >
                  {loading ? (
                    <EditorContentSpinner />
                  ) : (
                    <MonacoEditor
                      localStorageValue={currentTextObject.text}
                      value={inputEditorValue}
                      setValue={setInputEditorValue}
                    />
                  )}
                </EuiSplitPanel.Inner>

                {!loading && (
                  <EuiSplitPanel.Inner
                    grow={false}
                    paddingSize="s"
                    color="subdued"
                    css={editorStyles.consoleEditorPanel}
                  >
                    <EuiButtonEmpty
                      size="xs"
                      color="primary"
                      data-test-subj="clearConsoleInput"
                      onClick={() => {
                        setInputEditorValue('');
                      }}
                      aria-label={i18n.translate('console.editor.clearInputButtonAriaLabel', {
                        defaultMessage: 'Clear console input',
                      })}
                    >
                      {i18n.translate('console.editor.clearConsoleInputButton', {
                        defaultMessage: 'Clear this input',
                      })}
                    </EuiButtonEmpty>
                  </EuiSplitPanel.Inner>
                )}
              </EuiSplitPanel.Outer>
            </EuiResizablePanel>

            <EuiResizableButton
              css={editorStyles.resizerButton}
              aria-label={i18n.translate('console.editor.adjustPanelSizeAriaLabel', {
                defaultMessage: "Press left/right to adjust panels' sizes",
              })}
            />

            <EuiResizablePanel
              initialSize={secondPanelSize}
              minSize={PANEL_MIN_SIZE}
              tabIndex={0}
              paddingSize="none"
            >
              <EuiSplitPanel.Outer
                borderRadius="none"
                hasShadow={false}
                css={editorStyles.fullHeightPanel}
              >
                <EuiSplitPanel.Inner paddingSize="none" css={editorStyles.outputPanelCentered}>
                  {data ? (
                    <MonacoEditorOutput />
                  ) : isLoading ? (
                    <EditorContentSpinner />
                  ) : (
                    <OutputPanelEmptyState />
                  )}
                </EuiSplitPanel.Inner>

                {(data || isLoading) && (
                  <EuiSplitPanel.Inner
                    grow={false}
                    paddingSize="s"
                    css={editorStyles.actionsPanelWithBackground}
                  >
                    <EuiFlexGroup gutterSize="none" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty
                          size="xs"
                          color="primary"
                          data-test-subj="clearConsoleOutput"
                          onClick={() => dispatch({ type: 'cleanRequest', payload: undefined })}
                          aria-label={i18n.translate(
                            'console.editor.clearConsoleOutputButtonAriaLabel',
                            {
                              defaultMessage: 'Clear console output',
                            }
                          )}
                        >
                          {i18n.translate('console.editor.clearConsoleOutputButton', {
                            defaultMessage: 'Clear this output',
                          })}
                        </EuiButtonEmpty>
                      </EuiFlexItem>

                      <EuiFlexItem>
                        <NetworkRequestStatusBar
                          requestInProgress={requestInFlight}
                          requestResult={
                            data
                              ? {
                                  method: data.request.method.toUpperCase(),
                                  endpoint: data.request.path,
                                  statusCode: data.response.statusCode,
                                  statusText: data.response.statusText,
                                  timeElapsedMs: data.response.timeMs,
                                }
                              : undefined
                          }
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiSplitPanel.Inner>
                )}
              </EuiSplitPanel.Outer>
            </EuiResizablePanel>
          </>
        )}
      </EuiResizableContainer>
    </>
  );
});
