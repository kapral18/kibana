/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  checkForTripleQuotesAndEsqlQuery,
  findRequestLineNumber,
  unescapeInvalidChars,
} from './autocomplete_utils';

describe('autocomplete_utils', () => {
  describe('checkForTripleQuotesAndQueries', () => {
    it('returns false for all flags for an empty string', () => {
      expect(checkForTripleQuotesAndEsqlQuery('')).toEqual({
        insideTripleQuotes: false,
        insideEsqlQuery: false,
        esqlQueryIndex: -1,
      });
    });

    it('returns false for all flags for a request without triple quotes or ESQL query', () => {
      const request = `POST _search\n{\n  "query": {\n    "match": {\n      "message": "hello world"\n    }\n  }\n}`;
      expect(checkForTripleQuotesAndEsqlQuery(request)).toEqual({
        insideTripleQuotes: false,
        insideEsqlQuery: false,
        esqlQueryIndex: -1,
      });
    });

    it('returns true for insideTripleQuotes and false for ESQL flags when triple quotes are outside a query', () => {
      const request = `POST _ingest/pipeline/_simulate\n{\n  "pipeline": {\n    "processors": [\n      {\n        "script": {\n          "source":\n          """\n            for (field in params['fields']){\n                if (!$(field, '').isEmpty()){\n`;
      expect(checkForTripleQuotesAndEsqlQuery(request)).toEqual({
        insideTripleQuotes: true,
        insideEsqlQuery: false,
        esqlQueryIndex: -1,
      });
    });

    it('returns true for insideTripleQuotes but false for ESQL flags inside a non-_query request query field', () => {
      const request = `POST _search\n{\n  "query": """FROM test `;
      expect(checkForTripleQuotesAndEsqlQuery(request)).toEqual({
        insideTripleQuotes: true,
        insideEsqlQuery: false,
        esqlQueryIndex: -1,
      });
    });

    it('returns false for ESQL flags inside a single-quoted query for non-_query request', () => {
      const request = `GET index/_search\n{\n  "query": "SELECT * FROM logs `;
      const result = checkForTripleQuotesAndEsqlQuery(request);
      expect(result).toEqual({
        insideTripleQuotes: false,
        insideEsqlQuery: false,
        esqlQueryIndex: -1,
      });
    });

    it('returns false for all flags if single quote is closed', () => {
      const request = `POST _query\n{\n  "query": "SELECT * FROM logs" }`;
      expect(checkForTripleQuotesAndEsqlQuery(request)).toEqual({
        insideTripleQuotes: false,
        insideEsqlQuery: false,
        esqlQueryIndex: -1,
      });
    });

    it('returns false for all flags if triple quote is closed', () => {
      const request = `POST _query\n{\n  "query": """SELECT * FROM logs""" }`;
      expect(checkForTripleQuotesAndEsqlQuery(request)).toEqual({
        insideTripleQuotes: false,
        insideEsqlQuery: false,
        esqlQueryIndex: -1,
      });
    });

    it('does not treat longer words as request methods (e.g. GETS, POSTER)', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'] as const;
      for (const method of methods) {
        const requestMethod = `${method}A`;
        const request = `${requestMethod} _query\n{\n  "query": "SELECT * FROM logs `;
        expect(checkForTripleQuotesAndEsqlQuery(request)).toEqual({
          insideTripleQuotes: false,
          insideEsqlQuery: false,
          esqlQueryIndex: -1,
        });
      }
    });
  });

  it('sets insideEsqlQuery for single quoted query after POST _query', () => {
    const request = `POST    _query\n{\n  "query": "FROM test `;
    expect(checkForTripleQuotesAndEsqlQuery(request)).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: true,
      esqlQueryIndex: request.indexOf('"FROM test ') + 1,
    });
  });

  it('sets insideEsqlQuery for triple quoted query after POST _query (case-insensitive)', () => {
    const request = `post _query\n{\n  "query": """FROM test `; // lowercase POST should also match
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: true,
      insideEsqlQuery: true,
      esqlQueryIndex: request.indexOf('"""') + 3,
    });
  });

  it('detects single quoted query after POST _query?pretty suffix', () => {
    const request = `POST _query?pretty\n{\n  "query": "FROM logs | STATS `;
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: true,
      esqlQueryIndex: request.indexOf('"FROM logs ') + 1,
    });
  });

  it('detects query with /_query endpoint', () => {
    const request = `POST /_query\n{\n  "query": "FROM logs | STATS `;
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: true,
      esqlQueryIndex: request.indexOf('"FROM logs ') + 1,
    });
  });

  it('detects query with /_query/async endpoint', () => {
    const request = `POST /_query/async\n{\n  "query": "FROM logs | STATS `;
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: true,
      esqlQueryIndex: request.indexOf('"FROM logs ') + 1,
    });
  });

  it('detects triple quoted query after POST   _query?foo=bar with extra spaces', () => {
    const request = `POST   _query?foo=bar\n{\n  "query": """FROM metrics `;
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: true,
      insideEsqlQuery: true,
      esqlQueryIndex: request.indexOf('"""') + 3,
    });
  });

  it('detects query when request line is indented', () => {
    const request = `  \tPOST _query\n{\n  "query": "FROM logs | STATS `;
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: true,
      esqlQueryIndex: request.indexOf('"FROM logs ') + 1,
    });
  });

  it('detects query value with whitespace around the colon', () => {
    const request = `POST _query\n{\n  "query"  :\t "FROM logs | STATS `;
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: true,
      esqlQueryIndex: request.indexOf('"FROM logs ') + 1,
    });
  });

  it('does not treat near-miss keys as the "query" value', () => {
    const request = `POST _query\n{\n  "queryx": "FROM logs | STATS `;
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: false,
      esqlQueryIndex: -1,
    });
  });

  it('does not set ESQL flags for subsequent non-_query request in same buffer', () => {
    const request = `POST _query\n{\n  "query": "FROM a | STATS "\n}\nGET other_index/_search\n{\n  "query": "match_all" }`;
    const result = checkForTripleQuotesAndEsqlQuery(request);
    expect(result).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: false,
      esqlQueryIndex: -1, // single quotes closed in second request
    });
  });

  it('only flags current active _query section in mixed multi-request buffer', () => {
    const partial = `POST _query\n{\n  "query": "FROM a | STATS "\n}\nPOST _query\n{\n  "query": """FROM b | WHERE foo = `; // cursor inside triple quotes of second request
    const result = checkForTripleQuotesAndEsqlQuery(partial);
    expect(result).toEqual({
      insideTripleQuotes: true,
      insideEsqlQuery: true,
      esqlQueryIndex: partial.lastIndexOf('"""') + 3,
    });
  });

  it('handles request method at end of buffer without trailing newline (regression test)', () => {
    const buffer = 'POST _query';
    const result = checkForTripleQuotesAndEsqlQuery(buffer);
    expect(result).toEqual({
      insideTripleQuotes: false,
      insideEsqlQuery: false,
      esqlQueryIndex: -1,
    });
  });

  describe('unescapeInvalidChars', () => {
    it('should return the original string if there are no escape sequences', () => {
      const input = 'simple string';
      expect(unescapeInvalidChars(input)).toBe('simple string');
    });

    it('should unescape escaped double quotes', () => {
      const input = '\\"hello\\"';
      expect(unescapeInvalidChars(input)).toBe('"hello"');
    });

    it('should unescape escaped backslashes', () => {
      const input = 'path\\\\to\\\\file';
      expect(unescapeInvalidChars(input)).toBe('path\\to\\file');
    });

    it('should unescape both escaped backslashes and quotes', () => {
      const input = 'say: \\"hello\\" and path: C:\\\\Program Files\\\\App';
      expect(unescapeInvalidChars(input)).toBe('say: "hello" and path: C:\\Program Files\\App');
    });

    it('should handle mixed content correctly', () => {
      const input = 'log: \\"User \\\\\\"admin\\\\\\" logged in\\"';
      expect(unescapeInvalidChars(input)).toBe('log: "User \\"admin\\" logged in"');
    });

    it('should leave already unescaped characters alone', () => {
      const input = '"already unescaped" \\ and /';
      expect(unescapeInvalidChars(input)).toBe('"already unescaped" \\ and /');
    });

    it('should not over-unescape multiple backslashes', () => {
      const input = '\\\\\\\\"test\\\\"';
      // \\\\"test\\" becomes \\"test\"
      expect(unescapeInvalidChars(input)).toBe('\\\\"test\\"');
    });
  });

  describe('findRequestLineNumber', () => {
    const fromLines = (lines: string[]) => (lineNumber: number) => lines[lineNumber - 1] ?? '';

    it('returns the cursor line when it is itself the request line', () => {
      expect(findRequestLineNumber(fromLines(['GET _search']), 1)).toBe(1);
    });

    it('scans backwards to the nearest request line', () => {
      const lines = ['POST _query', '{', '\t"script": """', ''];
      expect(findRequestLineNumber(fromLines(lines), 4)).toBe(1);
    });

    it('returns the nearest request line when several precede the cursor', () => {
      const lines = ['GET _search', '{}', 'POST _query', '{', ''];
      expect(findRequestLineNumber(fromLines(lines), 5)).toBe(3);
    });

    it('returns undefined when no request line precedes the cursor', () => {
      expect(findRequestLineNumber(fromLines(['{', '"a": 1', '}']), 3)).toBeUndefined();
    });

    it('gives up past the line lookback cap instead of scanning the whole buffer', () => {
      // Request line sits far above the cursor, beyond the 2000-line cap.
      const lines = ['GET _search', ...new Array(2500).fill('  "filler": 1,')];
      expect(findRequestLineNumber(fromLines(lines), lines.length)).toBeUndefined();
    });

    it('gives up past the character lookback cap even when the line count is small', () => {
      // Regression guard for https://github.com/elastic/kibana/pull/251173: pasted JSON can hold
      // millions of characters in a handful of lines. Without a character cap, the returned text is
      // scanned character by character on a keystroke path.
      const hugeLine = 'x'.repeat(60_000);
      const lines = ['GET _search', hugeLine, hugeLine, hugeLine];
      expect(findRequestLineNumber(fromLines(lines), lines.length)).toBeUndefined();
    });

    it('still finds a nearby request line when the scanned text stays under the caps', () => {
      const smallLine = 'x'.repeat(1_000);
      const lines = ['GET _search', smallLine, smallLine];
      expect(findRequestLineNumber(fromLines(lines), lines.length)).toBe(1);
    });
  });
});
