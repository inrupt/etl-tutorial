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
import { buildThing, createSolidDataset, setThing } from "@inrupt/solid-client";

import { fetch as crossFetch } from "cross-fetch";
import { config } from "dotenv-flow";
import { RDF, SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import {
  clearTriplestore,
  insertIntoTriplestoreResources,
  insertIntoTriplestoreResource,
  insertIntoTriplestoreNTriples,
} from "./triplestore";
import { createCredentialResourceFromEnvironmentVariables } from "./credentialUtil";

jest.mock("cross-fetch");
const mockedFetch = crossFetch as jest.MockedFunction<typeof crossFetch>;

// Load environment variables from .env.test.local if available:
config({
  default_node_env: process.env.NODE_ENV || "test",
  path: "resources/test",
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

describe("triplestore", () => {
  const TEST_REPO_ENDPOINT_UPDATE =
    "http://localhost:7200/repositories/<test>/statements";

  describe("clear triplestore", () => {
    it("should ignore clear all if null endpoint", async () => {
      const credentials = createCredentialResourceFromEnvironmentVariables([
        "INRUPT_TRIPLESTORE_ENDPOINT_UPDATE",
      ]);
      expect(await clearTriplestore(credentials)).toContain(
        "Ignoring request to clear"
      );
    });

    it("should clear all data", async () => {
      // Mock triplestore response.
      mockedFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
          })
        )
      );

      const credentials = createCredentialResourceFromEnvironmentVariables();
      expect(await clearTriplestore(credentials)).toContain("Successfully");
    });

    it("should clear Named Graph data", async () => {
      // Mock triplestore response.
      mockedFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
          })
        )
      );

      const credentials = createCredentialResourceFromEnvironmentVariables([
        "INRUPT_TRIPLESTORE_NAMED_GRAPH",
      ]);
      expect(await clearTriplestore(credentials)).toContain("Successfully");
    });

    it("should fail to clear all data", async () => {
      // Mock triplestore response.
      mockedFetch.mockResolvedValueOnce(
        new Response("An error message", {
          status: 500,
        })
      );

      const credentials = createCredentialResourceFromEnvironmentVariables();
      await expect(clearTriplestore(credentials)).rejects.toThrow(
        "Failed to clear Named Graph"
      );
    });
  });

  describe("Insert N-Triples into triplestore", () => {
    it("should ignore insertion if no endpoint", async () => {
      expect(
        await insertIntoTriplestoreNTriples(null, "default", "Does not matter")
      ).toContain("ignoring request to write triples");
    });
  });

  describe("Insert Blobs with metadata into triplestore", () => {
    it("should insert Blob metadata", async () => {
      // Mock triplestore response.
      mockedFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
          })
        )
      );

      const credentials = createCredentialResourceFromEnvironmentVariables();

      const blobsWithMetadata = [];
      blobsWithMetadata.push({
        url: "https://example.com/test",
        blob: new Blob(),
        metadata: buildThing({ url: "https://inrupt.com/vocab/first" })
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .build(),
      });
      blobsWithMetadata.push({
        url: "https://example.com/test",
        blob: new Blob(),
      });

      expect(
        await insertIntoTriplestoreResources(credentials, [], blobsWithMetadata)
      ).toContain("Successfully inserted");
    });
  });

  describe("Insert resources into triplestore", () => {
    it("should throw if missing credentials", async () => {
      await expect(
        insertIntoTriplestoreResources(
          setThing(createSolidDataset(), buildThing().build()),
          []
        )
      ).rejects.toThrow("Error: Mandatory");
    });

    it("should ignore insertion if no endpoint", async () => {
      const credentials = createCredentialResourceFromEnvironmentVariables([
        "INRUPT_TRIPLESTORE_ENDPOINT_UPDATE",
      ]);

      const resources = [];
      resources.push(
        buildThing({ url: "https://inrupt.com/vocab/first" })
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .build()
      );

      expect(
        await insertIntoTriplestoreResources(credentials, resources)
      ).toContain("Ignoring request to insert [1] resource into triplestore");
    });

    it("should succeed", async () => {
      // Mock triplestore response.
      mockedFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
          })
        )
      );

      const thing = buildThing({ url: "https://inrupt.com/vocab/first" })
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .build();

      const resources = [];
      resources.push(thing);

      const credentials = createCredentialResourceFromEnvironmentVariables();
      expect(
        await insertIntoTriplestoreResources(credentials, resources)
      ).toContain("Successfully inserted");
    });

    it("should fail if HTTP error", async () => {
      // Mock triplestore response.
      mockedFetch.mockResolvedValueOnce(
        new Response("An error message", {
          status: 500,
        })
      );

      const thing = buildThing({ url: "https://inrupt.com/vocab/first" })
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .build();

      await expect(
        insertIntoTriplestoreResource(
          TEST_REPO_ENDPOINT_UPDATE,
          "default",
          thing
        )
      ).rejects.toThrow("got status [500");
    });

    it("should fail if fetch error", async () => {
      mockedFetch.mockRejectedValueOnce(
        new Response("An error message", {
          status: 500,
        })
      );

      const thing = buildThing({ url: "https://inrupt.com/vocab/first" })
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .build();

      await expect(
        insertIntoTriplestoreResource(
          TEST_REPO_ENDPOINT_UPDATE,
          "default",
          thing
        )
      ).rejects.toThrow("Failed to insert");
    });
  });
});
