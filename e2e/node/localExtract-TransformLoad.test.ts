/**
 * Copyright 2022 Inrupt
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

import {
  INRUPT_COMMON,
  SOLID,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { getSolidDataset, SolidDataset } from "@inrupt/solid-client";

import { Session } from "@inrupt/solid-client-authn-node";

// We just need this to allow us to increase the default connection timeout
// (default is 3.5 seconds).
import { custom } from "openid-client";

import debugModule from "debug";

import { config } from "dotenv-flow";
import {
  createCredentialResourceFromEnvironmentVariables,
  getCredentialStringOptional,
} from "../../src/credentialUtil";

// For our tests, we have example API responses as JSON, so this is fine.
/* eslint-disable import/extensions */
import companiesHouseUkSearchCompanyIdExample from "../../resources/test/RealData/PublicApiResponse/api-uk-companieshouse-search-companyid-unilever.json";
/* eslint-enable import/extensions */

import {
  clearTriplestore,
  insertIntoTriplestoreResources,
} from "../../src/triplestore";
import { companiesHouseUkTransformCompany } from "../../src/dataSource/clientCompaniesHouseUk";

import { updateOrInsertResourceInSolidPod } from "../../src/solidPod";
import {
  passportLocalExtract,
  passportTransform,
} from "../../src/dataSource/clientPassportLocal";
import { DEFAULT_STORAGE_ROOT } from "../../src/applicationSetup";

// Load environment variables from .env.test.local if available:
config({
  default_node_env: process.env.NODE_ENV || "test",
  path: __dirname,
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

const debug = debugModule("etl-tutorial:localExtract-TransformLoad.test");
debugModule.enable("etl-tutorial:*");

// Note: All these tests are expected to 'pass' if we provide no Pod
// credentials and no Triplestore Update endpoint, as performing the Load
// operation to either is always optional for each, as is each individual data
// source.
describe("All data sources", () => {
  let credential: SolidDataset;
  const session = new Session();
  let storageRoot: string | null;

  beforeAll(async () => {
    credential = createCredentialResourceFromEnvironmentVariables();

    // Check if we're configured with a storage root, and if not use a
    // default one. This is useful in the case where we want to populate a
    // triplestore out-of-the-box without configuring any user credentials,
    // yet we want all tests in this suite to operate with the same default
    // storage (so we can subsequently visualize our loaded data).
    storageRoot = getCredentialStringOptional(credential, SOLID.storageRoot);
    if (!storageRoot) {
      process.env["SOLID_STORAGE_ROOT"] = DEFAULT_STORAGE_ROOT;
      credential = createCredentialResourceFromEnvironmentVariables();
    }

    const etlClientId = getCredentialStringOptional(
      credential,
      INRUPT_COMMON.clientId
    );
    const etlClientSecret = getCredentialStringOptional(
      credential,
      INRUPT_COMMON.clientSecret
    );
    const etlOidcIssuer = getCredentialStringOptional(
      credential,
      SOLID.oidcIssuer
    );

    storageRoot = getCredentialStringOptional(credential, SOLID.storageRoot);

    if (
      etlClientId === null ||
      etlClientSecret === null ||
      etlOidcIssuer === null
    ) {
      debug(
        `Ignoring ETL Tutorial login - we need credentials for this ETL process to authenticate with it's own Solid Pod before it can load data into user Pod's (we got 'clientId' [${etlClientId}], 'clientSecret' [${etlClientSecret}], and 'oidcIssuer' [${etlOidcIssuer}]).`
      );
    } else {
      // Just set a higher timeout for our Pod login attempts...
      custom.setHttpOptionsDefaults({
        timeout: 10000,
      });

      await session.login({
        clientId: etlClientId,
        clientSecret: etlClientSecret,
        oidcIssuer: etlOidcIssuer,
      });
      expect(session.info.isLoggedIn).toBe(true);
      debug(
        `Successfully logged into ETL Tutorial's Pod (to get an access token) - WebID: [${session.info.webId}]`
      );
    }

    // Big assumption here, but (for now) assume we always clear the entire
    // triplestore for any test run.
    const clearResponse = await clearTriplestore(credential);
  });

  afterAll(() => {
    session.logout();
  });

  describe("Test Pod connectivity", () => {
    it("should read private resource from Pod", async () => {
      if (storageRoot === null || storageRoot === DEFAULT_STORAGE_ROOT) {
        debug(
          `No storage root (or just our default one for triplestore population), so not attempting to access a private resource on the ETL Tutorial Pod.`
        );
      } else {
        const resourceIri = `${storageRoot}private/`;
        debug(`Attempting to read PRIVATE resource [${resourceIri}]...`);
        try {
          const dataset = await getSolidDataset(resourceIri, {
            fetch: session.fetch,
          });
          expect(dataset).toBeDefined();
          debug(
            `Successfully read PRIVATE resource [${resourceIri}] in the test user's Pod (meaning our ETL Tutorial has a valid access token, and has been granted access by the user).`
          );
        } catch (error) {
          debug(
            `FAILED TO READ PRIVATE RESOURCE [${resourceIri}] in test user's Pod (meaning our ETL Tutorial has not got a valid access token, or has not been granted access by the user) - error: ${error}`
          );
          throw new Error("Fail test!");
        }
      }
    }, 10000);
  });

  describe("Passport (local)", () => {
    it("should transform and load", async () => {
      const passportData = await passportLocalExtract();

      const resources = await passportTransform(credential, passportData);

      let response = await insertIntoTriplestoreResources(
        credential,
        resources.rdfResources,
        resources.blobsWithMetadata
      );
      expect(response).not.toBeNull();

      if (storageRoot === null || storageRoot === DEFAULT_STORAGE_ROOT) {
        debug(
          `No storage root (or just our default one for triplestore population), so not attempting to insert into user Pods.`
        );
      } else {
        const responsePod = await updateOrInsertResourceInSolidPod(
          session,
          resources.rdfResources,
          resources.blobsWithMetadata
        );
        debug(`RESPONSE Passport data Load: [${responsePod}].`);
        expect(responsePod).not.toBeNull();
        expect(responsePod).toContain("Successfully");
      }
    }, 60000);
  });

  describe("Companies House UK", () => {
    it("should transform and load", async () => {
      const resources = await companiesHouseUkTransformCompany(
        credential,
        companiesHouseUkSearchCompanyIdExample
      );

      let response = await insertIntoTriplestoreResources(
        credential,
        resources.rdfResources,
        resources.blobsWithMetadata
      );
      expect(response).not.toBeNull();

      if (storageRoot === null || storageRoot === DEFAULT_STORAGE_ROOT) {
        debug(
          `No storage root (or just our default one for triplestore population), so not attempting to insert into user Pods.`
        );
      } else {
        const responsePod = await updateOrInsertResourceInSolidPod(
          session,
          resources.rdfResources,
          resources.blobsWithMetadata
        );
        debug(`RESPONSE Companies House data Load: [${responsePod}].`);
        expect(responsePod).not.toBeNull();
        expect(responsePod).toContain("Successfully");
      }
    }, 60000);
  });
});
