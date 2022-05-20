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

import { SolidDataset, Thing } from "@inrupt/solid-client";
import { CRED } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import { INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK } from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";

import { config } from "dotenv-flow";
import { createCredentialResourceFromEnvironmentVariables } from "../credentialUtil";
import {
  getIriMandatoryOne,
  getStringNoLocaleMandatoryOne,
  getThingOfTypeFromCollectionMandatoryOne,
} from "../solidDatasetUtil";

import {
  passportLocalExtract,
  passportTransform,
} from "./clientPassportInMemory";

// Load environment variables from .env.test.local if available:
config({
  default_node_env: process.env.NODE_ENV || "test",
  path: "resources/test",
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

describe("Passport data source", () => {
  const credential: SolidDataset =
    createCredentialResourceFromEnvironmentVariables();

  it("should return, always", async () => {
    await expect(passportLocalExtract()).resolves.not.toBeNull();
  });

  it("should ignore null input for transformation", async () => {
    const resourceDetails = passportTransform(credential, null);
    expect(resourceDetails.rdfResources).toHaveLength(0);
    expect(resourceDetails.blobsWithMetadata).toHaveLength(0);
  });

  it("should extract and transform passport", async () => {
    const responseJson = await passportLocalExtract();

    const resourceDetails = passportTransform(credential, responseJson);
    expect(resourceDetails).toBeDefined();
    expect(resourceDetails.rdfResources).toHaveLength(3);

    const passportResource = getThingOfTypeFromCollectionMandatoryOne(
      resourceDetails,
      INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.Passport
    );

    expect(getIriMandatoryOne(passportResource, CRED.issuer)).toEqual(
      INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.PassportOffice
    );
    expect(
      getStringNoLocaleMandatoryOne(
        passportResource as Thing,
        INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber
      )
    ).toEqual("PII-123123213");
  });
});
