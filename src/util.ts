// Copyright 2022 Inrupt Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
// Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import debugModule from "debug";
import { APPLICATION_NAME } from "./applicationConstant";

const debug = debugModule(`${APPLICATION_NAME}:util`);

export function handleResponseJson(
  res: Response,
  dataSource: string,
  endpoint: string
  // Here we are just copying the 'Promise<any>' return type as defined by
  // 'Response.json()' - so ignore ESLint warning!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  if (!res.ok) {
    const message = `Failure response from [${dataSource}] endpoint [${endpoint}]. Status [${res.statusText}]`;
    debug(message);
    throw Error(message);
  }

  return res.json();
}

export function handleResponseBlob(
  res: Response,
  dataSource: string,
  endpoint: string
): Promise<Blob> {
  if (!res.ok) {
    const message = `Failure response from [${dataSource}] endpoint [${endpoint}]. Status [${res.statusText}]`;
    debug(message);
    throw Error(message);
  }

  return res.blob();
}

export function reportHttpJsonResponseFailure(
  dataSource: string,
  endpoint: string,
  message?: string
): Error {
  const msg = message === undefined ? "" : ` Message [${message}].`;
  const description = `Failure response from [${dataSource}] endpoint [${endpoint}].${msg}`;
  debug(description);
  return new Error(description);
}

/**
 * Deliberately extremely simplistic pluralizing string function - does NOT
 * handle cases like 'person' becoming 'people', or 'country' becoming
 * 'countries'!
 *
 * @param value the string value ot pluralize by adding a single 's' if needed.
 * @param count the count to determine if the value should be pluralized or not.
 */
export function pluralize(value: string, arr: Array<any> | null) {
  return arr && arr.length === 1 ? value : `${value}s`;
}
