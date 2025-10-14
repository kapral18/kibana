/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen, waitFor, act } from '@testing-library/react';
import { indexPatterns } from '@kbn/data-plugin/public';
import './mocks';
import { setupEnvironment, pageHelpers } from './helpers';

const { setup } = pageHelpers.followerIndexAdd;
const { setup: setupAutoFollowPatternAdd } = pageHelpers.autoFollowPatternAdd;

describe('Create Follower index', () => {
  let httpSetup;
  let httpRequestsMockHelpers;

  beforeAll(() => {
    jest.useFakeTimers();
    const mockEnvironment = setupEnvironment();
    httpRequestsMockHelpers = mockEnvironment.httpRequestsMockHelpers;
    httpSetup = mockEnvironment.httpSetup;
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set "default" mock responses by not providing any arguments
    httpRequestsMockHelpers.setLoadRemoteClustersResponse();
  });

  describe('on component mount', () => {
    beforeEach(() => {
      setup();
    });

    test('should display a "loading remote clusters" indicator', () => {
      expect(screen.getByTestId('sectionLoading')).toBeInTheDocument();
      expect(screen.getByTestId('sectionLoading')).toHaveTextContent('Loading remote clusters…');
    });
  });

  describe('when remote clusters are loaded', () => {
    let form;
    let actions;

    beforeEach(async () => {
      ({ actions, form } = setup());

      await act(async () => {
        await jest.runAllTimersAsync();
      });
    });

    test('should have a link to the documentation', () => {
      expect(screen.getByTestId('docsButton')).toBeInTheDocument();
    });

    test('should display the Follower index form', () => {
      expect(screen.getByTestId('followerIndexForm')).toBeInTheDocument();
    });

    test('should display errors and disable the save button when clicking "save" without filling the form', () => {
      expect(screen.queryByTestId('formError')).not.toBeInTheDocument();
      expect(screen.getByTestId('submitButton')).not.toBeDisabled();

      actions.clickSaveForm();

      expect(screen.getByTestId('formError')).toBeInTheDocument();
      expect(form.getErrorsMessages()).toEqual(['Leader index is required.', 'Name is required.']);
      expect(screen.getByTestId('submitButton')).toBeDisabled();
    });
  });

  describe('form validation', () => {
    let form;
    let actions;

    beforeEach(async () => {
      ({ form, actions } = setup());

      await act(async () => {
        await jest.runAllTimersAsync();
      });
    });

    describe('remote cluster', () => {
      // The implementation of the remote cluster "Select" + validation is
      // done inside the <RemoteClustersFormField /> component. The same component that we use in the <AutoFollowPatternAdd /> section.
      // To avoid copy/pasting the same tests here, we simply make sure that both sections use the <RemoteClustersFormField />
      test('should use the same <RemoteClustersFormField /> component as the <AutoFollowPatternAdd /> section', async () => {
        setupAutoFollowPatternAdd();
        await act(async () => {
          await jest.runAllTimersAsync();
        });

        // Both components should render the remote cluster field
        const remoteClusterFields = screen.getAllByTestId('remoteClusterFormField');
        expect(remoteClusterFields.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('leader index', () => {
      test('should not allow spaces', () => {
        form.setInputValue('leaderIndexInput', 'with space');
        actions.clickSaveForm();
        expect(form.getErrorsMessages()).toContain('Spaces are not allowed in the leader index.');
      });

      test('should not allow invalid characters', () => {
        actions.clickSaveForm(); // Make all errors visible

        const expectInvalidChar = (char) => {
          form.setInputValue('leaderIndexInput', `with${char}`);
          expect(form.getErrorsMessages()).toContain(
            `Remove the characters ${char} from your leader index.`
          );
        };

        return indexPatterns.ILLEGAL_CHARACTERS_VISIBLE.reduce((promise, char) => {
          return promise.then(() => expectInvalidChar(char));
        }, Promise.resolve());
      });
    });

    describe('follower index', () => {
      test('should not allow spaces', () => {
        form.setInputValue('followerIndexInput', 'with space');
        actions.clickSaveForm();
        expect(form.getErrorsMessages()).toContain('Spaces are not allowed in the name.');
      });

      test('should not allow a "." (period) as first character', () => {
        form.setInputValue('followerIndexInput', '.withDot');
        actions.clickSaveForm();
        expect(form.getErrorsMessages()).toContain(`Name can't begin with a period.`);
      });

      test('should not allow invalid characters', () => {
        actions.clickSaveForm(); // Make all errors visible

        const expectInvalidChar = (char) => {
          form.setInputValue('followerIndexInput', `with${char}`);
          expect(form.getErrorsMessages()).toContain(
            `Remove the characters ${char} from your name.`
          );
        };

        return indexPatterns.ILLEGAL_CHARACTERS_VISIBLE.reduce((promise, char) => {
          return promise.then(() => expectInvalidChar(char));
        }, Promise.resolve());
      });

      describe('ES index name validation', () => {
        test('should make a request to check if the index name is available in ES', async () => {
          httpRequestsMockHelpers.setGetClusterIndicesResponse([]);

          form.setInputValue('followerIndexInput', 'index-name');
          
          await act(async () => {
            jest.advanceTimersByTime(550); // Advance past the 500ms debounce
          });

          expect(httpSetup.get).toHaveBeenLastCalledWith(
            `/api/index_management/indices`,
            expect.anything()
          );
        });

        test('should display an error if the index already exists', async () => {
          const indexName = 'index-name';
          httpRequestsMockHelpers.setGetClusterIndicesResponse([{ name: indexName }]);

          form.setInputValue('followerIndexInput', indexName);
          
          await act(async () => {
            jest.advanceTimersByTime(550);
            await jest.runAllTimersAsync();
          });

          expect(form.getErrorsMessages()).toContain('An index with the same name already exists.');
        });
      });
    });

    describe('advanced settings', () => {
      const advancedSettingsInputFields = {
        maxReadRequestOperationCountInput: {
          default: 5120,
          type: 'number',
        },
        maxOutstandingReadRequestsInput: {
          default: 12,
          type: 'number',
        },
        maxReadRequestSizeInput: {
          default: '32mb',
          type: 'string',
        },
        maxWriteRequestOperationCountInput: {
          default: 5120,
          type: 'number',
        },
        maxWriteRequestSizeInput: {
          default: '9223372036854775807b',
          type: 'string',
        },
        maxOutstandingWriteRequestsInput: {
          default: 9,
          type: 'number',
        },
        maxWriteBufferCountInput: {
          default: 2147483647,
          type: 'number',
        },
        maxWriteBufferSizeInput: {
          default: '512mb',
          type: 'string',
        },
        maxRetryDelayInput: {
          default: '500ms',
          type: 'string',
        },
        readPollTimeoutInput: {
          default: '1m',
          type: 'string',
        },
      };

      test('should have a toggle to activate advanced settings', () => {
        const expectDoesNotExist = (testSubject) => {
          const element = screen.queryByTestId(testSubject);
          if (element !== null) {
            throw new Error(`The advanced field "${testSubject}" exists.`);
          }
        };

        const expectDoesExist = (testSubject) => {
          const element = screen.queryByTestId(testSubject);
          if (element === null) {
            throw new Error(`The advanced field "${testSubject}" does not exist.`);
          }
        };

        // Make sure no advanced settings is visible
        Object.keys(advancedSettingsInputFields).forEach(expectDoesNotExist);

        actions.toggleAdvancedSettings();

        // Make sure all advanced settings are visible
        Object.keys(advancedSettingsInputFields).forEach(expectDoesExist);
      });

      test('should set the correct default value for each advanced setting', () => {
        actions.toggleAdvancedSettings();

        Object.entries(advancedSettingsInputFields).forEach(([testSubject, data]) => {
          const input = screen.getByTestId(testSubject);
          expect(input).toHaveValue(data.default);
        });
      });

      test('should set number input field for numeric advanced settings', () => {
        actions.toggleAdvancedSettings();

        Object.entries(advancedSettingsInputFields).forEach(([testSubject, data]) => {
          if (data.type === 'number') {
            const input = screen.getByTestId(testSubject);
            expect(input).toHaveAttribute('type', 'number');
          }
        });
      });
    });
  });
});
