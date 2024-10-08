/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DataViewListItem } from '@kbn/data-views-plugin/common';
import { sortBy } from 'lodash';
import React, { FC, useRef, useState } from 'react';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import {
  ESDataViewSelect as Component,
  ESDataViewSelectProps as Props,
} from './es_data_view_select.component';
import { getDataViews } from '../../lib/data_view_helpers';

type ESDataViewSelectProps = Omit<Props, 'indices' | 'loading'>;

export const ESDataViewSelect: FC<ESDataViewSelectProps> = (props) => {
  const { value, onChange } = props;

  const [dataViews, setDataViews] = useState<DataViewListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const mounted = useRef(true);

  useEffectOnce(() => {
    getDataViews().then((newDataViews) => {
      if (!mounted.current) {
        return;
      }

      if (!newDataViews) {
        newDataViews = [];
      }

      setLoading(false);
      setDataViews(
        sortBy(newDataViews, ({ name, title }) => {
          return name || title || '';
        })
      );

      if (!value && newDataViews.length) {
        onChange(newDataViews[0].title);
      }
    });

    return () => {
      mounted.current = false;
    };
  });

  return <Component {...props} dataViews={dataViews} loading={loading} />;
};
