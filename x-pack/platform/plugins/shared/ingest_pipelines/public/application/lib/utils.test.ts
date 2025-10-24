/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { stringifyJson, parseJson } from './utils';

describe('utils', () => {
  describe('stringifyJson()', () => {
    describe('when rendering as an array', () => {
      it('should stringify a valid JSON array', () => {
        expect(stringifyJson([1, 2, 3])).toEqual(`[
  1,
  2,
  3
]`);
      });

      it('should return a stringified empty array if the value is not a valid JSON array', () => {
        expect(stringifyJson({})).toEqual('[\n\n]');
      });
    });

    describe('when rendering as an object', () => {
      it('should stringify a valid JSON object', () => {
        expect(stringifyJson({ field_1: 'hello', field_2: 5, field_3: true }, false)).toEqual(`{
  "field_1": "hello",
  "field_2": 5,
  "field_3": true
}`);
      });

      it('should return a stringified empty object if the value is not a valid JSON object', () => {
        expect(stringifyJson([1, 2, 3], false)).toEqual('{\n\n}');
        expect(stringifyJson('test', false)).toEqual('{\n\n}');
        expect(stringifyJson(10, false)).toEqual('{\n\n}');
      });
    });
  });

  describe('parseJson()', () => {
    describe('when rendering as an array', () => {
      it('should parse a valid JSON string', () => {
        expect(parseJson('[1,2,3]')).toEqual([1, 2, 3]);
        expect(parseJson('[{"foo": "bar"}]')).toEqual([{ foo: 'bar' }]);
      });

      it('should convert valid JSON that is not an array to an array', () => {
        expect(parseJson('{"foo": "bar"}')).toEqual([{ foo: 'bar' }]);
      });

      it('should return an empty array if invalid JSON string', () => {
        expect(parseJson('{invalidJsonString}')).toEqual([]);
      });
    });

    describe('when rendering as an object', () => {
      it('should parse a valid JSON string', () => {
        expect(parseJson('{"foo": "bar"}', false)).toEqual({ foo: 'bar' });
        expect(parseJson('{}', false)).toEqual({});
      });

      it('should return an empty object if invalid JSON string', () => {
        expect(parseJson('{invalidJsonString}', false)).toEqual({});
        expect(parseJson('[invalidJsonString]', false)).toEqual({});
      });
    });
  });

  describe('numeric precision preservation', () => {
    describe('parse and stringify round-trip', () => {
      it('should preserve trailing zeros in decimal numbers', () => {
        const input = '[{"_source": {"Number": 1249604.0}}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('1249604.0');
        expect(output).not.toContain('"Number": 1249604,');
        expect(output).not.toContain('"Number": 1249604\n');
      });

      it('should preserve multiple trailing zeros', () => {
        const input = '[{"value": 123.00}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('123.00');
      });

      it('should preserve trailing zeros with other decimal digits', () => {
        const input = '[{"measurement": 45.670}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('45.670');
      });

      it('should handle integers without decimals normally', () => {
        const input = '[{"count": 12345}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('12345');
        expect(output).not.toContain('12345.0');
      });

      it('should preserve format for negative numbers with trailing zeros', () => {
        const input = '[{"temperature": -273.0}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('-273.0');
      });

      it('should handle multiple fields with mixed numeric formats', () => {
        const input = '[{"int": 100, "float": 100.0, "decimal": 100.50}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toMatch(/"int":\s*100[,\n]/);
        expect(output).toContain('100.0');
        expect(output).toContain('100.50');
      });

      it('should handle the exact issue scenario from GitHub #224763', () => {
        const input = '[{"_index": "test", "_id": "1", "_source": {"Number": 1249604.0}}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        // The key assertion - trailing zero must be preserved
        expect(output).toContain('"Number": 1249604.0');
      });

      it('should handle nested objects with trailing zeros', () => {
        const input = '[{"outer": {"inner": {"value": 999.0}}}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('999.0');
      });

      it('should handle arrays of numbers with trailing zeros', () => {
        const input = '[{"values": [1.0, 2.0, 3.0]}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('1.0');
        expect(output).toContain('2.0');
        expect(output).toContain('3.0');
      });

      it('should preserve zero with trailing zeros', () => {
        const input = '[{"zero": 0.0, "doubleZero": 0.00}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('0.0');
        expect(output).toContain('0.00');
      });

      it('should preserve fractional numbers with trailing zeros', () => {
        const input = '[{"half": 0.50, "quarter": 0.250}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('0.50');
        expect(output).toContain('0.250');
      });

      it('should handle multiple documents with trailing zeros', () => {
        const input = '[{"val": 1.0}, {"val": 2.0}, {"val": 3.0}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        // Should preserve in all documents
        const matches = output.match(/\d+\.0/g);
        expect(matches).toHaveLength(3);
      });

      it('should handle mixed data types with numeric trailing zeros', () => {
        const input = '[{"num": 100.0, "str": "value", "bool": true, "null": null}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('100.0');
        expect(output).toContain('"value"');
        expect(output).toContain('true');
        expect(output).toContain('null');
      });

      it('should preserve very small decimals with trailing zeros', () => {
        const input = '[{"small": 0.0010, "smaller": 0.00100}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('0.0010');
        expect(output).toContain('0.00100');
      });

      it('should handle large numbers with trailing zeros', () => {
        const input = '[{"large": 1000000.0, "huge": 999999999.00}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('1000000.0');
        expect(output).toContain('999999999.00');
      });

      it('should handle deeply nested structures with trailing zeros', () => {
        const input = '[{"a": {"b": {"c": {"d": 42.0}}}}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        expect(output).toContain('42.0');
      });

      it('should preserve when same number appears multiple times', () => {
        const input = '[{"x": 5.0, "y": 5.0, "z": 5.0}]';
        const parsed = parseJson(input);
        const output = stringifyJson(parsed);

        const matches = output.match(/5\.0/g);
        expect(matches).toHaveLength(3);
      });
    });

    describe('when object is modified after parsing', () => {
      it('should use standard formatting for modified objects', () => {
        const input = '[{"value": 100.0}]';
        const parsed = parseJson(input);

        // Modify the object
        parsed[0] = { ...parsed[0], newField: 'added' };

        const output = stringifyJson(parsed);

        // After modification, we can't guarantee preservation since the object changed
        // But it should still stringify correctly
        expect(output).toBeTruthy();
        expect(output).toContain('newField');
      });
    });
  });
});
