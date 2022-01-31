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

import { SolidDataset } from "@inrupt/solid-client";

import { fetch as crossFetch } from "cross-fetch";
import { config } from "dotenv-flow";
import { SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import { createCredentialResourceFromEnvironmentVariables } from "../credentialUtil";
import { getStringNoLocaleMandatoryOne } from "../solidDatasetUtil";

// For our tests, we have example API responses as JSON, so this is fine.
/* eslint-disable import/extensions */
import exampleCompanySearchValid from "../../resources/test/DummyData/DummyApiResponse/DummyCompaniesHouseUk/dummy-api-companieshouse-search-companyid.json";
/* eslint-enable import/extensions */
import {
  companiesHouseUkExtractCompanyById,
  companiesHouseUkTransformCompany,
} from "./clientCompaniesHouseUk";

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

describe("Companies House UK", () => {
  const credential: SolidDataset =
    createCredentialResourceFromEnvironmentVariables();

  describe("Company search", () => {
    it("should return null if no auth token", async () => {
      const credentialNoToken =
        createCredentialResourceFromEnvironmentVariables([
          "INRUPT_SOURCE_COMPANIES_HOUSE_UK_HTTP_BASIC_TOKEN",
        ]);
      await expect(
        companiesHouseUkExtractCompanyById(credentialNoToken, "Does not matter")
      ).resolves.toBeNull();
    });

    it("should throw if API errors", async () => {
      // Mock API returning an error.
      mockedFetch.mockResolvedValueOnce(
        new Response("An error message", {
          status: 500,
        })
      );

      await expect(
        companiesHouseUkExtractCompanyById(credential, "Does not matter")
      ).rejects.toThrow("Exception searching ");
    });

    it("should ignore null input for transformation", async () => {
      const resources = companiesHouseUkTransformCompany(credential, null);
      expect(resources.rdfResources).toHaveLength(0);
      expect(resources.blobsWithMetadata).toHaveLength(0);
    });

    it("should extract company", async () => {
      mockedFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(exampleCompanySearchValid))
      );

      const responseJson = await companiesHouseUkExtractCompanyById(
        credential,
        "00000000"
      );
      expect(responseJson.items[0].title).toBe("MYCOMPANY LIMITED");

      const responseRdf = companiesHouseUkTransformCompany(
        credential,
        responseJson
      );
      expect(responseRdf).toBeDefined();
      expect(responseRdf.rdfResources).toHaveLength(2);

      expect(
        getStringNoLocaleMandatoryOne(
          responseRdf.rdfResources[1],
          SCHEMA_INRUPT.addressRegion
        )
      ).toEqual("Braham Street");
    });
  });
});
