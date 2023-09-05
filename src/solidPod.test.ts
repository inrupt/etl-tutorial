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

// We need to explicitly import the Node.js implementation of 'Blob' here
// because it's not a global in Node.js (whereas it is global in the browser).
// We may also need to explicitly convert our usage of 'Blob' into a Buffer
// instead of using it as a 'Blob', because the Node.js 'Blob' implementation
// has no 'stream()' method, whereas the browser implementation does -
// otherwise using one instance where the other is expected will throw an
// error like this:
//   error TS2345: Argument of type 'Blob' is not assignable to parameter of type 'Blob | Buffer'.
//     Type 'import("buffer").Blob' is not assignable to type 'Blob'.
//       The types returned by 'stream()' are incompatible between these types.
//         Type 'unknown' is not assignable to type 'ReadableStream<any>'.
// Both the Node.js and the browser implementations of 'Blob' support the
// '.arrayBuffer()' method, and the `solid-client-js` functions that expect
// 'Blob's (like `overwriteFile()`) can accept both native 'Blob's and
// 'Buffer's, so always converting any 'Blob' instances we have into 'Buffer's
// allows those functions to work safely with both Node.js and browser
// 'Blob's.
// eslint-disable-next-line no-shadow
import { Blob } from "node:buffer";

import {
  buildThing,
  getSolidDataset,
  mockSolidDatasetFrom,
  SolidDataset,
  saveSolidDatasetAt,
  WithChangeLog,
  UrlString,
  WithServerResourceInfo,
  Url,
  Iri,
  IriString,
  mockFetchError,
  overwriteFile,
  createContainerAt,
  setThing,
} from "@inrupt/solid-client";
import type { WithResourceInfo } from "@inrupt/solid-client";
import { INRUPT_TEST } from "@inrupt/vocab-inrupt-test-rdfdatafactory";
import { updateOrInsertResourceInSolidPod } from "./solidPod";
import { buildDataset } from "./solidDatasetUtil";

// Ideally we'd have a mock WebID per test suite, but it causes conflicts when
// running all test suites. Would like to refactor to remove the duplication
// of these mocks across test suites too...
// const mockWebId = "https://example.com/mock-user-SolidPod#me";
const mockWebId = "https://example.com/mock-user#me";
jest.mock("@inrupt/solid-client-authn-node", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authnModule = jest.requireActual(
    "@inrupt/solid-client-authn-node"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  return {
    ...authnModule,
    Session: function Session(loggedIn: boolean) {
      return {
        login: jest.fn(),
        fetch: jest.fn(),
        logout: jest.fn(),
        info: {
          webId: mockWebId,
          isLoggedIn: loggedIn === undefined ? true : loggedIn,
        },
      };
    },
  };
});

jest.mock("@inrupt/solid-client", () => {
  // TypeScript can't infer the type of modules imported via Jest;
  // skip type checking for those:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const solidClientModule = jest.requireActual("@inrupt/solid-client") as any;

  solidClientModule.getContainedResourceUrlAll = jest.fn(
    solidClientModule.getContainedResourceUrlAll
  );

  solidClientModule.deleteFile = jest.fn(solidClientModule.deleteFile);

  solidClientModule.overwriteFile = jest.fn(solidClientModule.overwriteFile);

  solidClientModule.deleteSolidDataset = jest.fn(
    solidClientModule.deleteSolidDataset
  );

  solidClientModule.getSolidDataset = jest.fn(
    solidClientModule.getSolidDataset
  );

  solidClientModule.saveSolidDatasetAt = jest.fn(
    solidClientModule.saveSolidDatasetAt
  );
  return solidClientModule;
});

type Unpromisify<T> = T extends Promise<infer R> ? R : T;
/* eslint camelcase: 0 */
function internal_toIriString(iri: Iri | IriString): IriString {
  return typeof iri === "string" ? iri : iri.value;
}
/* eslint camelcase: 0 */
const internal_defaultFetchOptions = {
  fetch,
};

// Need to look into sharing common test code...
// eslint-disable-next-line jest/no-export
function mockSaveSolidDatasetAt<Dataset extends SolidDataset>(
  url: UrlString | Url,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  solidDataset: Dataset,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: Partial<typeof internal_defaultFetchOptions>
): Unpromisify<ReturnType<typeof saveSolidDatasetAt>> {
  // Due to typing mismatches if we just use the incoming dataset, we just
  // create our own mock dataset which has the right types.
  const solidDataset1: SolidDataset = mockSolidDatasetFrom(url);

  const solidDatasetWithServerResourceInfoWithChangeLog: SolidDataset &
    WithServerResourceInfo &
    WithChangeLog = {
    ...solidDataset1,
    internal_resourceInfo: {
      sourceIri: internal_toIriString(url),
      isRawData: false,
      contentType: "text/turtle",
      linkedResources: {},
    },
    internal_changeLog: {
      additions: [],
      deletions: [],
    },
  };

  return solidDatasetWithServerResourceInfoWithChangeLog;
}

describe("Solid Pod functions", () => {
  describe("Multiple Things in a single dataset", () => {
    it("should fail if more than one Thing", async () => {
      const thing1 = buildThing()
        .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
        .build();
      const thing2 = buildThing()
        .addIri(
          INRUPT_TEST.someOtherPredicate,
          INRUPT_TEST.someOtherPodResource
        )
        .build();
      const dataset = setThing(buildDataset(thing1), thing2);

      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      // We can use the same dataset twice for this test, we just need 'more
      // than one' to kick off the dataset sorting code...
      await expect(
        updateOrInsertResourceInSolidPod(session, [dataset, dataset])
      ).rejects.toThrow("more than one Thing");
    });
  });

  describe("Inserting or updating blob with metadata into Pod", () => {
    it("should insert Blob with no metadata", async () => {
      const obj = { hello: "world" };
      const blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: "application/json",
      });

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            overwriteFile: typeof overwriteFile;
          },
          "overwriteFile"
        )
        .mockResolvedValueOnce(
          Buffer.from("whatever") as Buffer & WithResourceInfo
        );

      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      const result = await updateOrInsertResourceInSolidPod(
        session,
        [],
        [{ blob, url: "https://example.com/resource/url" }]
      );
      expect(result).toContain("[0] resources and [1] Blob into");
    });

    it("should insert Blob with metadata", async () => {
      const obj = { hello: "world" };
      const blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: "application/json",
      });
      const metadata = buildDataset(
        buildThing()
          .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
          .build()
      );

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            overwriteFile: typeof overwriteFile;
          },
          "overwriteFile"
        )
        .mockResolvedValueOnce(
          Buffer.from("whatever") as Buffer & WithResourceInfo
        );
      const testIri = "https://example.com/whatever";
      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            saveSolidDatasetAt: typeof saveSolidDatasetAt;
          },
          "saveSolidDatasetAt"
        )
        .mockResolvedValueOnce(
          mockSaveSolidDatasetAt(testIri, mockSolidDatasetFrom(testIri))
        );

      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      const result = await updateOrInsertResourceInSolidPod(
        session,
        [],
        [{ blob, url: "https://example.com/resource/url", metadata }]
      );
      expect(result).toContain("[0] resources and [1] Blob into");
    });

    it("should fail silently if exception inserting metadata with Blob", async () => {
      const obj = { hello: "world" };
      const blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: "application/json",
      });
      const metadata = buildDataset(
        buildThing()
          .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
          .build()
      );

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            overwriteFile: typeof overwriteFile;
          },
          "overwriteFile"
        )
        .mockResolvedValueOnce(
          Buffer.from("whatever") as Buffer & WithResourceInfo
        );
      const testIri = "https://example.com/whatever";
      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            saveSolidDatasetAt: typeof saveSolidDatasetAt;
          },
          "saveSolidDatasetAt"
        )
        .mockRejectedValueOnce(mockFetchError(testIri));

      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      const result = await updateOrInsertResourceInSolidPod(
        session,
        [],
        [{ blob, url: "https://example.com/resource/url", metadata }]
      );
      expect(result).toContain("[0] resources and [0] Blobs into");
    });
  });

  describe("Inserting or updating resources into Pod", () => {
    it("should sort resources if multiple", async () => {
      const thing1 = buildThing()
        .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
        .build();
      const thing2 = buildThing()
        .addIri(
          INRUPT_TEST.someOtherPredicate,
          INRUPT_TEST.someOtherPodResource
        )
        .build();

      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      const result = await updateOrInsertResourceInSolidPod(session, [
        buildDataset(thing1),
        buildDataset(thing2),
      ]);
      expect(result).toContain(
        "Successfully inserted or updated [2] resources"
      );
    });

    it("should do nothing if not logged in", async () => {
      const thing = buildThing()
        .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
        .build();

      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(false);

      const result = await updateOrInsertResourceInSolidPod(session, [
        buildDataset(thing),
      ]);
      expect(result).toContain("session is not logged in");

      // Attempt insert with number of resources that's not 1 (so 'plural').
      const result2 = await updateOrInsertResourceInSolidPod(session, []);
      expect(result2).toContain("to write [0] resources");
    });

    it("should do nothing if no resources to load, but logged in", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
      ) as {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Session: any;
      };
      const session = new authnModule.Session(true);

      const result = await updateOrInsertResourceInSolidPod(session, []);
      expect(result).toContain("Successfully inserted or updated [0]");
    });

    it.each([
      ["https://example.com/whateverContainer/", true, true],
      ["https://example.com/whateverContainer/", true, false],
      ["https://example.com/whateverContainer/", false, true],
      ["https://example.com/whateverContainer/", false, false],
      ["https://example.com/whatever", true, true],
      ["https://example.com/whatever", true, false],
      ["https://example.com/whatever", false, true],
      ["https://example.com/whatever", false, false],
    ])(
      "should load resource (even if exist first)",
      async (testIri, existsAlready, throwSaving) => {
        const authnModule = jest.requireMock(
          "@inrupt/solid-client-authn-node"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as { Session: any };
        const session = new authnModule.Session(true);

        const mockDataset = mockSolidDatasetFrom("https://test.com/dataset");
        const spyGetDataset = jest.spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        );
        // eslint-disable-next-line no-unused-expressions
        existsAlready
          ? spyGetDataset.mockResolvedValueOnce(mockDataset)
          : spyGetDataset.mockRejectedValueOnce(mockFetchError(testIri));

        const spySaveDataset = jest.spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            saveSolidDatasetAt: typeof saveSolidDatasetAt;
          },
          "saveSolidDatasetAt"
        );
        // eslint-disable-next-line no-unused-expressions
        throwSaving
          ? spySaveDataset.mockRejectedValueOnce(mockFetchError(testIri))
          : spySaveDataset.mockResolvedValueOnce(
              mockSaveSolidDatasetAt(testIri, mockSolidDatasetFrom(testIri))
            );

        const spyCreateContainer = jest.spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            createContainerAt: typeof createContainerAt;
          },
          "createContainerAt"
        );
        // eslint-disable-next-line no-unused-expressions
        throwSaving
          ? spyCreateContainer.mockRejectedValueOnce(mockFetchError(testIri))
          : spyCreateContainer.mockResolvedValueOnce(
              mockSaveSolidDatasetAt(testIri, mockSolidDatasetFrom(testIri))
            );

        const thing = buildThing({ url: testIri })
          .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
          .build();

        const result = await updateOrInsertResourceInSolidPod(session, [
          buildDataset(thing),
        ]);
        expect(result).toContain("Successfully inserted or updated [1]");
        expect(result).toContain(`[${mockWebId}]`);
      }
    );
  });
});
