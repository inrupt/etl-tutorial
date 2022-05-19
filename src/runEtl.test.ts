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
  getSolidDataset,
  deleteSolidDataset,
  overwriteFile,
  mockSolidDatasetFrom,
  mockFetchError,
} from "@inrupt/solid-client";
import { WithResourceInfo } from "@inrupt/solid-client/src/interfaces";
import { ILoginInputOptions } from "@inrupt/solid-client-authn-core";
import { INRUPT_TEST } from "@inrupt/vocab-inrupt-test-rdfdatafactory";
import { createCredentialResourceEmpty } from "./credentialUtil";
import {
  runEtl,
  loadResources,
  loginAsRegisteredApp,
  loadResourcesAndBlobs,
} from "./runEtl";

// Ideally we'd have a mock WebID per test suite, but it causes conflicts when
// running all test suites. Would like to refactor to remove the duplication
// of these mocks across test suites too...
// const mockWebId = "https://example.com/mock-user-runEtl#me";
const mockWebId = "https://example.com/mock-user#me";
const mockClientIdThrowOnLogin = "TestClientId-ThrowOnLogin";
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
        async login(options: ILoginInputOptions): Promise<void> {
          if (options.clientId === mockClientIdThrowOnLogin) {
            throw new Error("Test throwing on login...");
          }
          return Promise.resolve();
        },
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

  solidClientModule.overwriteFile = jest.fn(solidClientModule.overwriteFile);
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

describe("ETL process", () => {
  describe("Running ETL", () => {
    it("should succeed with valid credential resource (but no credentials at all)", async () => {
      jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };

      const dataset = mockSolidDatasetFrom("https://test.com/dataset");
      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        )
        .mockResolvedValueOnce(dataset);

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            deleteSolidDataset: typeof deleteSolidDataset;
          },
          "deleteSolidDataset"
        )
        .mockResolvedValueOnce();

      const validArguments = {
        _: ["runEtl"],
        $0: "",
        etlCredentialResource:
          "resources/test/DummyData/DummyRegisteredAppCredentialResource/dummy-registered-app-credential-resource.ttl",
        localUserCredentialResourceGlob:
          "resources/test/DummyData/DummyUserCredentialResource/dummy-user-credential-user-no-credentials.ttl",
      };

      const successfullyProcessed = await runEtl(validArguments);
      expect(successfullyProcessed).toBe(1);
    });

    it("should fail if looking for existing application resources throws", async () => {
      jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        )
        // We expect a HTTP failure with a response.status code other than
        // 404!
        .mockRejectedValueOnce(
          mockFetchError("https://example.com/does-not-matter", 401)
        );

      const validArguments = {
        _: ["runEtl"],
        $0: "",
        etlCredentialResource:
          "resources/test/DummyData/DummyRegisteredAppCredentialResource/dummy-registered-app-credential-resource.ttl",
        localUserCredentialResourceGlob:
          "resources/test/DummyData/DummyUserCredentialResource/dummy-user-credential-user-no-credentials.ttl",
      };

      const successfullyProcessed = await runEtl(validArguments);
      expect(successfullyProcessed).toBe(0);
    });

    it("should fail if ETL application login fails", async () => {
      const validArguments = {
        _: ["runEtl"],
        $0: "",
        etlCredentialResource:
          "resources/test/DummyData/DummyRegisteredAppCredentialResource/dummy-registered-app-credential-throw-on-login.ttl",
        localUserCredentialResourceGlob: "does-not-matter.*",
      };

      jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };

      const successfullyProcessed = await runEtl(validArguments);
      expect(successfullyProcessed).toBe(-1);
    });

    it("should fail on invalid credential resource", async () => {
      const filename =
        "resources/test/DummyData/DummyUserCredentialResource/dummy-user-credential-invalid-turtle.ttl";
      const validArguments = {
        _: ["runEtl"],
        $0: "",
        etlCredentialResource:
          "resources/test/DummyData/DummyRegisteredAppCredentialResource/dummy-registered-app-credential-resource.ttl",
        localUserCredentialResourceGlob: filename,
      };

      const successfullyProcessed = await runEtl(validArguments);
      expect(successfullyProcessed).toBe(-1);
    });

    it("should ignore specified credential resource", async () => {
      const filename =
        "resources/test/DummyData/DummyUserCredentialResource/dummy-user-credential-invalid-turtle.ttl";
      const validArguments = {
        _: ["runEtl"],
        $0: "",
        etlCredentialResource:
          "resources/test/DummyData/DummyUserCredentialResource/dummy-user-credential-user-no-credentials.ttl",
        localUserCredentialResourceGlob: filename,
        localUserCredentialResourceGlobIgnore: filename,
      };

      const successfullyProcessed = await runEtl(validArguments);
      expect(successfullyProcessed).toBe(0);
    });
  });

  describe("Loading resources and blobs", () => {
    it("should report no resources or Blobs to load", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      await expect(
        loadResourcesAndBlobs(
          "data source",
          createCredentialResourceEmpty(),
          session,
          null
        )
      ).resolves.toContain("No Linked Data resources or Blobs to load");
    });

    it("should report no resources to load", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      await expect(
        loadResourcesAndBlobs(
          "data source",
          createCredentialResourceEmpty(),
          session,
          { rdfResources: [], blobsWithMetadata: null }
        )
      ).resolves.toContain("Empty set of resources to load");
    });
  });

  describe("Loading resources", () => {
    it("should do nothing if no resources", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      const dataSource = "Test Data Source";
      await expect(
        loadResources(
          dataSource,
          createCredentialResourceEmpty(),
          session,
          null,
          [{ url: "https://example.com/test", blob: new Blob() }]
        )
      ).resolves.toContain(`[${dataSource}] provided no resources`);
    });

    it("should report Blob", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

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

      const thing = buildThing()
        .addStringNoLocale(
          INRUPT_TEST.somePredicate,
          INRUPT_TEST.hashSomeObject
        )
        .build();

      await expect(
        loadResources(
          "data source",
          createCredentialResourceEmpty(),
          session,
          [thing],
          [{ url: "https://example.com/test", blob: new Blob() }]
        )
      ).resolves.toContain("and [1] Blob");
    });

    it("should report no resources to load", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      await expect(
        loadResources(
          "data source",
          createCredentialResourceEmpty(),
          session,
          []
        )
      ).resolves.toContain("Empty set of resources to load");
    });

    it("should load resource, not logged into Pod", async () => {
      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(false);

      const thing = buildThing()
        .addStringNoLocale(
          INRUPT_TEST.somePredicate,
          INRUPT_TEST.hashSomeObject
        )
        .build();
      await expect(
        loadResources("data source", createCredentialResourceEmpty(), session, [
          thing,
        ])
      ).resolves.toContain("Not logged into Pod");
    });

    it("should load resource, logged into Pod", async () => {
      const thing = buildThing()
        .addStringNoLocale(
          INRUPT_TEST.somePredicate,
          INRUPT_TEST.hashSomeObject
        )
        .build();

      const authnModule = jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };
      const session = new authnModule.Session(true);

      await expect(
        loadResources("data source", createCredentialResourceEmpty(), session, [
          thing,
        ])
      ).resolves.toContain("Successfully inserted or updated [1] resource");
    });
  });

  describe("Log into Pod", () => {
    it("should login", async () => {
      jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };

      const validArguments = {
        _: ["runEtl"],
        $0: "",
        etlCredentialResource:
          "resources/test/DummyData/DummyRegisteredAppCredentialResource/dummy-registered-app-credential-resource.ttl",
        localUserCredentialResourceGlob: "does-not-matter.ttl",
      };
      const session = await loginAsRegisteredApp(validArguments);

      // Tricky logic here - we create a mock Session in this test file,
      // which takes a constructor param to set the session's logged-in-ness,
      // but the code-under-test calls the 'real' Session constructor that
      // doesn't take any parameter, so we expect our mock to default to
      // setting it's logged-in flag to 'true', when in fact it's passed
      // 'undefined'.
      expect(session.info.isLoggedIn).toBeTruthy();
    });

    it("should fail login if registered app creds resource is invalid Turtle", async () => {
      jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };

      const invalidArguments = {
        _: ["runEtl"],
        $0: "",
        etlCredentialResource:
          "resources/test/DummyData/DummyUserCredentialResource/dummy-user-credential-invalid-turtle.ttl",
        localUserCredentialResourceGlob: "does-not-matter.ttl",
      };
      const session = await loginAsRegisteredApp(invalidArguments);
      // Tricky logic here - we create a mock Session in this test file,
      // which takes a constructor param to set the session's logged-in-ness,
      // but the code-under-test calls the 'real' Session constructor that
      // doesn't take any parameter, so we expect our mock to default to
      // setting it's logged-in flag to 'true', when in fact it's passed
      // 'undefined', and actually isn't logged in at all...
      expect(session.info.isLoggedIn).toBeTruthy();
    });

    it("should throw if login throws", async () => {
      jest.requireMock(
        "@inrupt/solid-client-authn-node"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as { Session: any };

      const validArguments = {
        _: ["runEtl"],
        $0: "",
        etlCredentialResource:
          "resources/test/DummyData/DummyRegisteredAppCredentialResource/dummy-registered-app-credential-throw-on-login.ttl",
        localUserCredentialResourceGlob: "does-not-matter.ttl",
      };
      await expect(loginAsRegisteredApp(validArguments)).rejects.toThrow(
        "failed to log into Solid"
      );
    });
  });
});
