/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { Meta } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { base64dLogo } from '@kbn/shared-ux-file-image-mocks';
import type { FileImageMetadata, FileKindBrowser } from '@kbn/shared-ux-file-types';
import type { FileJSON, BaseFilesClient as FilesClient } from '@kbn/shared-ux-file-types';
import { FilesContext } from '@kbn/shared-ux-file-context';
import { FilePicker, Props as FilePickerProps } from './file_picker';

type ListResponse = ReturnType<FilesClient['list']>;
type MetaDecorators = Pick<Meta, 'decorators'>;

const kind = 'filepicker';
const getFileKind = (id: string) =>
  ({
    id: kind,
    http: {},
    allowedMimeTypes: ['*'],
  } as FileKindBrowser);

const defaultProps: FilePickerProps = {
  kind,
  onDone: action('done!'),
  onClose: action('close!'),
  multiple: true,
};

export default {
  title: 'files/FilePicker',
  component: FilePicker,
  args: defaultProps,
  decorators: [
    (Story) => (
      <FilesContext
        client={
          {
            create: () =>
              new Promise((res, rej) =>
                setTimeout(() => rej(new Error('not so fast buster!')), 3000)
              ),
            list: async (): ListResponse => ({
              files: [],
              total: 0,
            }),
            getFileKind,
          } as unknown as FilesClient
        }
      >
        <Story />
      </FilesContext>
    ),
  ],
} as Meta<typeof FilePicker>;

export const Empty = {};

const d = new Date();
let id = 0;
function createFileJSON(file?: Partial<FileJSON<FileImageMetadata>>): FileJSON<FileImageMetadata> {
  return {
    alt: '',
    created: d.toISOString(),
    updated: d.toISOString(),
    extension: 'png',
    fileKind: kind,
    id: String(++id),
    meta: {
      width: 1000,
      height: 1000,
    },
    mimeType: 'image/png',
    name: 'my file',
    size: 1,
    status: 'READY',
    ...file,
  };
}

export const BasicOne: MetaDecorators = {
  decorators: [
    (Story) => (
      <FilesContext
        client={
          {
            getDownloadHref: () => `data:image/png;base64,${base64dLogo}`,
            list: async (): ListResponse => ({
              files: [createFileJSON()],
              total: 1,
            }),
            getFileKind,
          } as unknown as FilesClient
        }
      >
        <Story />
      </FilesContext>
    ),
  ],
};

export const BasicMany: MetaDecorators = {
  decorators: [
    (Story) => {
      const files = [
        createFileJSON({ name: 'abc' }),
        createFileJSON({ name: 'def' }),
        createFileJSON({ name: 'efg' }),
        createFileJSON({ name: 'foo' }),
        createFileJSON({ name: 'bar' }),
        createFileJSON(),
        createFileJSON(),
      ];

      return (
        <FilesContext
          client={
            {
              getDownloadHref: () => `data:image/png;base64,${base64dLogo}`,
              list: async (): ListResponse => ({
                files,
                total: files.length,
              }),
              getFileKind,
            } as unknown as FilesClient
          }
        >
          <Story />
        </FilesContext>
      );
    },
  ],
};

export const BasicManyMany: MetaDecorators = {
  decorators: [
    (Story) => {
      const array = new Array(102);
      array.fill(null);
      return (
        <FilesContext
          client={
            {
              getDownloadHref: () => `data:image/png;base64,${base64dLogo}`,
              list: async (): ListResponse => ({
                files: array.map((_, idx) => createFileJSON({ id: String(idx) })),
                total: array.length,
              }),
              getFileKind,
            } as unknown as FilesClient
          }
        >
          <Story />
        </FilesContext>
      );
    },
  ],
};

export const ErrorLoading: MetaDecorators = {
  decorators: [
    (Story) => {
      const array = new Array(102);
      array.fill(createFileJSON());
      return (
        <FilesContext
          client={
            {
              getDownloadHref: () => `data:image/png;base64,${base64dLogo}`,
              list: async () => {
                throw new Error('stop');
              },
              getFileKind,
            } as unknown as FilesClient
          }
        >
          <Story />
        </FilesContext>
      );
    },
  ],
};

export const TryFilter: MetaDecorators = {
  decorators: [
    (Story) => {
      const array = { files: [createFileJSON()], total: 1 };
      return (
        <>
          <h2>Try entering a filter!</h2>
          <FilesContext
            client={
              {
                getDownloadHref: () => `data:image/png;base64,${base64dLogo}`,
                list: async ({ name }: { name: string[] }) => {
                  if (name) {
                    return { files: [], total: 0 };
                  }
                  return array;
                },
                getFileKind,
              } as unknown as FilesClient
            }
          >
            <Story />
          </FilesContext>
        </>
      );
    },
  ],
};

export const SingleSelect: Partial<Meta> = {
  decorators: [
    (Story) => (
      <FilesContext
        client={
          {
            getDownloadHref: () => `data:image/png;base64,${base64dLogo}`,
            list: async (): ListResponse => ({
              files: [createFileJSON(), createFileJSON(), createFileJSON()],
              total: 1,
            }),
            getFileKind,
          } as unknown as FilesClient
        }
      >
        <Story />
      </FilesContext>
    ),
  ],

  args: {
    multiple: undefined,
  },
};
