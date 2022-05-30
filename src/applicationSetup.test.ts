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

import { config } from "dotenv-flow";
import {
  buildThing,
  deleteSolidDataset,
  getContainedResourceUrlAll,
  getSolidDataset,
  mockFetchError,
  mockSolidDatasetFrom,
  SolidDataset,
} from "@inrupt/solid-client";
import { RDF } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import { INRUPT_COMMON } from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import {
  makeDataSourceContainerBuilder,
  createWebIdProfileDocumentIfNeeded,
  initiateApplication,
  wireUpDataSourceContainer,
  DataSourceContainerObject,
} from "./applicationSetup";
import { createCredentialResourceFromEnvironmentVariables } from "./credentialUtil";
import { buildDataset } from "./solidDatasetUtil";
import {
  APPLICATION_NAME,
  APPLICATION_VENDOR_NAME,
} from "./applicationConstant";

// Ideally we'd have a mock WebID per test suite, but it causes conflicts when
// running all test suites. Would like to refactor to remove the duplication
// of these mocks across test suites too...
// const mockWebId = "https://example.com/mock-user-publishEvent#me";
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

  solidClientModule.deleteSolidDataset = jest.fn(
    solidClientModule.deleteSolidDataset
  );

  solidClientModule.getSolidDataset = jest.fn(
    solidClientModule.getSolidDataset
  );
  return solidClientModule;
});

// Load environment variables from .env.test.local if available:
config({
  default_node_env: process.env.NODE_ENV || "test",
  path: "resources/test",
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

describe("Application setup", () => {
  describe("ETL utilities", () => {
    it("should make data source container builder", () => {
      expect(
        makeDataSourceContainerBuilder(
          "https://example.com/test/iri/",
          "DataSource"
        )
      ).toBeDefined();
    });
  });

  describe("Create WebID profile document", () => {
    it("should ignore WebID profile document creation if logged in", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      const resources = await createWebIdProfileDocumentIfNeeded(
        mockSolidDatasetFrom("https://does_not-matter.com/"),
        session,
        "https://also_does_not-matter.com/"
      );

      expect(resources).toHaveLength(0);
    });

    it("should create WebID profile document if not logged in", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(false);

      const resources = await createWebIdProfileDocumentIfNeeded(
        buildDataset(
          buildThing()
            .addIri(RDF.type, INRUPT_COMMON.CredentialResource)
            .build()
        ),
        session,
        "https://also_does_not-matter.com/"
      );

      expect(resources).toHaveLength(1);
    });
  });

  describe("Wire up data source container", () => {
    it("should create and return container for data source", () => {
      const credential: SolidDataset =
        createCredentialResourceFromEnvironmentVariables([]);

      const dataSourceContainerDetails: DataSourceContainerObject =
        wireUpDataSourceContainer("Test data source", credential);
      expect(dataSourceContainerDetails.resources).toHaveLength(1);
    });
  });

  describe("Initiate application", () => {
    let credential: SolidDataset;

    beforeAll(() => {
      // Just ignore triplestore storage completely.
      credential = createCredentialResourceFromEnvironmentVariables([
        "INRUPT_TRIPLESTORE_ENDPOINT_UPDATE",
      ]);
    });

    it("should ignore Pod if session not logged in", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(false);

      const result = await initiateApplication(credential, session);
      expect(result).toContain(
        `/private/${APPLICATION_VENDOR_NAME}/${APPLICATION_NAME}/`
      );
    });

    it("should read Pod if session logged in (application exists)", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      const mockDataset = mockSolidDatasetFrom(mockWebId);

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        )
        .mockResolvedValueOnce(mockDataset);

      // Mock zero contained resources, so recursive delete has nothing to do!
      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getContainedResourceUrlAll: typeof getContainedResourceUrlAll;
          },
          "getContainedResourceUrlAll"
        )
        .mockReturnValueOnce([]);
      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            deleteSolidDataset: typeof deleteSolidDataset;
          },
          "deleteSolidDataset"
        )
        .mockResolvedValueOnce();

      const result = await initiateApplication(credential, session);
      expect(result).toContain(
        `/private/${APPLICATION_VENDOR_NAME}/${APPLICATION_NAME}/`
      );
    });

    it("should read Pod if session logged in (application exists, delete throws)", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      const mockDataset = mockSolidDatasetFrom(mockWebId);

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        )
        .mockResolvedValueOnce(mockDataset);

      // Mock zero contained resources, so recursive delete has nothing to do!
      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getContainedResourceUrlAll: typeof getContainedResourceUrlAll;
          },
          "getContainedResourceUrlAll"
        )
        .mockReturnValueOnce([]);
      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            deleteSolidDataset: typeof deleteSolidDataset;
          },
          "deleteSolidDataset"
        )
        .mockRejectedValueOnce("Some error...");

      await expect(initiateApplication(credential, session)).rejects.toThrow(
        "Failed to recursively delete"
      );
    });

    it("should read Pod if session logged in (application doesn't exist)", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        )
        .mockRejectedValueOnce(mockFetchError(mockWebId));

      const result = await initiateApplication(credential, session);
      expect(result).toContain(
        `/private/${APPLICATION_VENDOR_NAME}/${APPLICATION_NAME}/`
      );
    });

    it("should read Pod if session logged in (application read failure)", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        )
        .mockRejectedValueOnce(mockFetchError(mockWebId, 409));

      await expect(initiateApplication(credential, session)).rejects.toThrow(
        "Error (apart from '404"
      );
    });
  });
});
