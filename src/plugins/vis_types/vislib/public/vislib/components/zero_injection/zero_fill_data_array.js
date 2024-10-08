/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import _ from 'lodash';

/*
 * Accepts an array of zero-filled y value objects (arr1)
 * and a kibana data.series[i].values array of objects (arr2).
 * Return a zero-filled array of objects (arr1).
 */

export function zeroFillDataArray(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    throw new TypeError('zeroFillDataArray expects 2 arrays');
  }

  let i;
  let val;
  let index;
  const max = arr2.length;

  const getX = function (d) {
    return d.x === val.x;
  };

  for (i = 0; i < max; i++) {
    val = arr2[i];
    index = _.findIndex(arr1, getX);
    arr1.splice(index, 1, val);
  }

  return arr1;
}
