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
import { CRED } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import { INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK } from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";

import { config } from "dotenv-flow";
import { createCredentialResourceFromEnvironmentVariables } from "../credentialUtil";
import { getStringNoLocaleMandatoryOne } from "../solidDatasetUtil";

import { passportLocalExtract, passportTransform } from "./clientPassportLocal";

// Load environment variables from .env.test.local if available:
config({
  default_node_env: process.env.NODE_ENV || "test",
  path: "resources/test",
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

describe("Passport", () => {
  const credential: SolidDataset =
    createCredentialResourceFromEnvironmentVariables();

  describe("Passport", () => {
    it("should return, always", async () => {
      await expect(passportLocalExtract()).resolves.not.toBeNull();
    });

    it("should ignore null input for transformation", async () => {
      const resources = passportTransform(credential, null);
      expect(resources.rdfResources).toHaveLength(0);
      expect(resources.blobsWithMetadata).toHaveLength(0);
    });

    it("should extract and transform passport", async () => {
      const responseJson = await passportLocalExtract();

      const responseRdf = passportTransform(credential, responseJson);
      expect(responseRdf).toBeDefined();
      expect(responseRdf.rdfResources).toHaveLength(1);

      expect(
        getStringNoLocaleMandatoryOne(responseRdf.rdfResources[0], CRED.issuer)
      ).toEqual(INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.PassportOffice.value);
      expect(
        getStringNoLocaleMandatoryOne(
          responseRdf.rdfResources[0],
          INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber
        )
      ).toEqual("PII-123123213");
    });
  });
});
