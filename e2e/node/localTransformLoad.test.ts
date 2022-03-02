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

// Load environment variables from .env.test.local if available:
config({
  default_node_env: process.env.NODE_ENV || "test",
  path: __dirname,
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

const debug = debugModule(
  "etl-tutorial:localApiResponse.transformAndLoad.test"
);
debugModule.enable("etl-tutorial:*");

describe("All data sources", () => {
  let credential: SolidDataset;
  const session = new Session();

  beforeAll(async () => {
    credential = createCredentialResourceFromEnvironmentVariables();

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
    if (
      etlClientId === null ||
      etlClientSecret === null ||
      etlOidcIssuer === null
    ) {
      debug(
        `Ignoring Solid login - we need all credentials for ETL process to authenticate with Solid - we got clientId [${etlClientId}], clientSecret [${etlClientSecret}], and oidcIssuer [${etlOidcIssuer}].`
      );
    } else {
      await session.login({
        clientId: etlClientId,
        clientSecret: etlClientSecret,
        oidcIssuer: etlOidcIssuer,
      });
      expect(session.info.isLoggedIn).toBe(true);
      debug(
        `Successfully logged into Solid Pod - WebID: [${session.info.webId}]`
      );
    }

    // BIg assumption here, but (for now) assume we always clear the entire
    // triplestore for any test run.
    const clearResponse = await clearTriplestore(credential);
    debug(`Clear triplestore response: [${clearResponse}]`);
  });

  afterAll(() => {
    session.logout();
  });

  describe("Test Pod connectivity", () => {
    it("should read private resource from Pod", async () => {
      const storageRoot = getCredentialStringOptional(
        credential,
        SOLID.storageRoot
      );

      if (storageRoot !== null) {
        const url = `${storageRoot}private/inrupt/etl-tutorial/`;
        const dataset = await getSolidDataset(url, { fetch: session.fetch });
        expect(dataset).toBeDefined();
      }
    }, 10000);
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
      debug(
        `Response from loading Companies House UK Company search into Triplestore: [${response}]`
      );
      expect(response).not.toBeNull();

      const responsePod = await updateOrInsertResourceInSolidPod(
        session,
        resources.rdfResources,
        resources.blobsWithMetadata
      );
      debug(
        `Response from loading Companies House UK Company search into Pod: [${responsePod}]`
      );
      expect(responsePod).not.toBeNull();
    }, 60000);
  });
});
