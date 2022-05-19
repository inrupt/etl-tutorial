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

// We need to import Response because it's not a global in Node.
// We need to rename Response because otherwise ESLint thinks we're
// re-defining a global - d'oh!
import { Response as CrossFetchResponse } from "cross-fetch";

import { buildThing } from "@inrupt/solid-client";
import {
  describeCollectionOfResources,
  handleResponseBlob,
  handleResponseJson,
  pluralize,
  reportHttpJsonResponseFailure,
} from "./util";

describe("Util functions", () => {
  const dataSource = "test-source";
  const endpoint = "https://test-endpoint.com";

  describe("handle HTTP JSON error response", () => {
    it("should include endpoint", () => {
      expect(
        reportHttpJsonResponseFailure(dataSource, endpoint).message
      ).toContain(endpoint);
    });

    it("should include message", () => {
      const message = "Include this reason...";
      expect(
        reportHttpJsonResponseFailure(dataSource, endpoint, message).message
      ).toContain(message);
    });
  });

  describe("handle HTTP response containing JSON", () => {
    it("should succeed", async () => {
      const res = new CrossFetchResponse(
        JSON.stringify({
          data: "stuff...",
          success: true,
        })
      );

      const response = await handleResponseJson(res, dataSource, endpoint);
      expect(response.data).toBe("stuff...");
    });

    it("should fail if not success", async () => {
      const res = new CrossFetchResponse("An error message", {
        status: 500,
      });

      expect(() => handleResponseJson(res, dataSource, endpoint)).toThrow(
        endpoint
      );
    });
  });

  describe("handle HTTP response containing a Blob", () => {
    it("should succeed", async () => {
      const blob = "hello world!";
      const res = new CrossFetchResponse(blob);

      const response = await handleResponseBlob(res, dataSource, endpoint);
      expect(await response.text()).toEqual(blob);
    });

    it("should fail if not success", async () => {
      const res = new CrossFetchResponse("An error message", {
        status: 500,
      });

      expect(() => handleResponseBlob(res, dataSource, endpoint)).toThrow(
        endpoint
      );
    });
  });

  describe("pluralize", () => {
    it("should add 's'", async () => {
      expect(pluralize("peep", [])).toEqual("peeps");
      expect(pluralize("peep", [1, 2])).toEqual("peeps");
      expect(pluralize("peep", null)).toEqual("peeps");
    });

    it("should not add 's'", async () => {
      expect(pluralize("peep", [1])).toEqual("peep");
    });
  });

  describe("Describe collection", () => {
    it("should describe empty", async () => {
      expect(
        describeCollectionOfResources("prelude", {
          rdfResources: [],
          blobsWithMetadata: [],
        })
      ).toEqual("prelude [0] Linked Data resources and [0] Blobs.");
    });

    it("should describe singular", async () => {
      expect(
        describeCollectionOfResources("prelude", {
          rdfResources: [buildThing().build()],
          blobsWithMetadata: [{ url: "https://test.com", blob: new Blob() }],
        })
      ).toEqual("prelude [1] Linked Data resource and [1] Blob.");
    });
  });
});
