/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { dirname, extname, join, relative, resolve, basename } from 'path';

export class File {
  public readonly path: string;
  private readonly relativePath: string;
  private readonly ext: string;

  constructor(path: string) {
    this.path = resolve(path);
    this.relativePath = relative(process.cwd(), this.path);
    this.ext = extname(this.path);
  }

  public getAbsolutePath(): string {
    return this.path;
  }

  public getRelativePath(): string {
    return this.relativePath;
  }

  public getWithoutExtension(): File {
    const directory = dirname(this.path);
    const stem = basename(this.path, this.ext);
    return new File(resolve(directory, stem));
  }

  public isJs(): boolean {
    return this.ext === '.js';
  }

  public isTypescript(): boolean {
    return this.ext === '.ts' || this.ext === '.tsx';
  }

  public isTypescriptAmbient(): boolean {
    return this.path.endsWith('.d.ts');
  }

  public isSass(): boolean {
    return this.ext === '.sass' || this.ext === '.scss';
  }

  public getRelativeParentDirs(): string[] {
    const parents: string[] = [];

    while (true) {
      // NOTE: resolve() produces absolute paths, so we have to use join()
      const parent = parents.length
        ? join(parents[parents.length - 1], '..')
        : dirname(this.relativePath);

      if (parent === '..' || parent === '.') {
        break;
      } else {
        parents.push(parent);
      }
    }

    return parents;
  }

  public toString(): string {
    return this.relativePath;
  }

  public toJSON(): string {
    return this.relativePath;
  }
}
