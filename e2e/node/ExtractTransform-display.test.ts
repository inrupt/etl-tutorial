/**
 * Copyright 2022 Inrupt Inc.
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

import { describe, expect, it } from "@jest/globals";

import {
  getIriAll,
  getStringNoLocale,
  getStringWithLocale,
  SolidDataset,
} from "@inrupt/solid-client";
import { CRED, SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf-rdfdatafactory";

import debugModule from "debug";

import { config } from "dotenv-flow";
import { createCredentialResourceFromEnvironmentVariables } from "../../src/credentialUtil";
import { CollectionOfResources } from "../../src/solidPod";
import {
  INRUPT_3RD_PARTY_UNILEVER,
  INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK,
  INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK,
  GIST,
  HOBBY,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";

import {
  companiesHouseUkExtractCompanyById,
  companiesHouseUkTransformCompany,
} from "../../src/dataSource/clientCompaniesHouseUk";
import {
  passportLocalExtract,
  passportTransform,
} from "../../src/dataSource/clientPassportInMemory";
import {
  getIriMandatoryOne,
  getStringNoLocaleMandatoryOne,
  getThingOfTypeFromCollectionMandatoryOne,
} from "../../src/solidDatasetUtil";
import {
  APPLICATION_ENTRYPOINT,
  HOBBY_SOURCE_FILE,
} from "../../src/applicationConstant";
import {
  hobbyFileExtract,
  hobbyTransform,
} from "../../src/dataSource/clientHobbyFile";

import { DataFactory } from "rdf-data-factory";
import * as RDFJS from "rdf-js";
const factory: RDFJS.DataFactory = new DataFactory();

// Load environment variables from .env.test.local if available:
config({
  default_node_env: process.env.NODE_ENV || "test",
  path: __dirname,
  // In CI, actual environment variables will overwrite values from .env files.
  // We don't need warning messages in the logs for that:
  silent: process.env.CI === "true",
});

const debug = debugModule("etl-tutorial:ExtractTransform-display");
debugModule.enable("etl-tutorial:*");

// For testing, we hard-code a couple of big-name UK companies...
const COMPANY_ID_UNILEVER = "00041424";
const COMPANY_ID_MYSTERY = "02216369";

// Which company do we wish to search for...
const COMPANY_ID_TO_SEARCH = COMPANY_ID_UNILEVER;

describe("All data sources", () => {
  // Construct a dataset of credentials from our environment.
  const credential: SolidDataset =
    createCredentialResourceFromEnvironmentVariables();

  describe("Passport office", () => {
    it("extracts and transforms Passport data", async () => {
      const response = await passportLocalExtract();
      expect(response).toBeDefined();

      if (response !== null) {
        const resourceDetails: CollectionOfResources = passportTransform(
          credential,
          response,
          `${process.env.SOLID_STORAGE_ROOT!}${APPLICATION_ENTRYPOINT}`
        );
        expect(resourceDetails.rdfResources).toHaveLength(3);

        const passportResource = getThingOfTypeFromCollectionMandatoryOne(
          resourceDetails,
          INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.Passport
        );

        const passportNumber = getStringNoLocaleMandatoryOne(
          passportResource,
          INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber
        );
        const issuer = getIriMandatoryOne(passportResource, CRED.issuer);
        const idCategories = getIriAll(passportResource, GIST.isCategorizedBy);

        debug(
          `Passport details: passport number [${passportNumber}], issuer [${
            issuer.value
          }], categories of ID [${idCategories.join(", ")}].`
        );

        expect(passportNumber).toBe("PII-123123213");
      }
    });
  });

  describe("Hobby", () => {
    it("extracts and transforms Hobby data", async () => {
      const response = await hobbyFileExtract(HOBBY_SOURCE_FILE);
      expect(response).toBeDefined();

      if (response !== null) {
        const resourceDetails: CollectionOfResources = hobbyTransform(
          credential,
          response,
          `${process.env.SOLID_STORAGE_ROOT!}${APPLICATION_ENTRYPOINT}`
        );
        expect(resourceDetails.rdfResources).toHaveLength(4);

        const hobbyResource = getThingOfTypeFromCollectionMandatoryOne(
          resourceDetails,
          HOBBY.Hobby
        );

        const hobbyKind = getStringNoLocaleMandatoryOne(
          hobbyResource,
          HOBBY.kind
        );
        const hobbyOrg = getStringWithLocale(
          hobbyResource,
          SCHEMA_INRUPT.name,
          "en"
        );

        debug(
          `Hobby details: hobby type [${hobbyKind}], name of organization [${hobbyOrg}].`
        );

        expect(hobbyKind).toBe("sport");
      }
    });
  });

  describe("Companies House UK", () => {
    it("extracts and transforms COmpanies House UK data", async () => {
      const response = await companiesHouseUkExtractCompanyById(
        credential,
        COMPANY_ID_TO_SEARCH
      );
      expect(response).toBeDefined();

      if (response !== null) {
        const resourceDetails: CollectionOfResources =
          companiesHouseUkTransformCompany(
            credential,
            response,
            `${process.env.SOLID_STORAGE_ROOT!}${APPLICATION_ENTRYPOINT}`
          );

        const companyResource = getThingOfTypeFromCollectionMandatoryOne(
          resourceDetails,
          // SCHEMA_INRUPT.Organization
          factory.namedNode("https://schema.org/Organization")
        );
        const addressResource = getThingOfTypeFromCollectionMandatoryOne(
          resourceDetails,
          // SCHEMA_INRUPT.PostalAddress
          factory.namedNode("https://schema.org/PostalAddress")
        );

        // const name = getStringNoLocale(companyResource, SCHEMA_INRUPT.name);
        const name = getStringNoLocale(
          companyResource,
          factory.namedNode("https://schema.org/name")
        );
        const status = getStringNoLocale(
          companyResource,
          INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK.status
        );

        const streetAddress = getStringNoLocale(
          addressResource,
          // SCHEMA_INRUPT.streetAddress
          factory.namedNode("https://schema.org/streetAddress")
        );
        const locality = getStringNoLocale(
          addressResource,
          // SCHEMA_INRUPT.addressLocality
          factory.namedNode("https://schema.org/addressLocality")
        );
        const region = getStringNoLocale(
          addressResource,
          // SCHEMA_INRUPT.addressRegion
          factory.namedNode("https://schema.org/addressRegion")
        );
        const country = getStringNoLocale(
          addressResource,
          // SCHEMA_INRUPT.addressCountry
          factory.namedNode("https://schema.org/addressCountry")
        );
        const postCode = getStringNoLocale(
          addressResource,
          // SCHEMA_INRUPT.postalCode
          factory.namedNode("https://schema.org/postalCode")
        );

        debug(`Company details: name [${name}], status [${status}].`);
        debug(
          `Company address: address [${streetAddress}], region [${region}], locality [${locality}], country [${country}], post code [${postCode}].`
        );

        expect(response.items[0].company_number).toBe(COMPANY_ID_TO_SEARCH);
      }
    }, 20000);
  });
});
