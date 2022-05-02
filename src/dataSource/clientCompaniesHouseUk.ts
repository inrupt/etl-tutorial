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

import debugModule from "debug";
import { fetch as crossFetch } from "cross-fetch";
import {
  RDF,
  RDFS,
  SCHEMA_INRUPT,
} from "@inrupt/vocab-common-rdf-rdfdatafactory";
import {
  INRUPT_COMMON,
  INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { buildThing, SolidDataset } from "@inrupt/solid-client";
import {
  getStringNoLocaleOptionalOne,
  getThingOfTypeMandatoryOne,
} from "../solidDatasetUtil";
import { handleResponseJson, pluralize } from "../util";
import { APPLICATION_NAME } from "../applicationConstant";
import { CollectionOfResources } from "../solidPod";
import { wireUpDataSourceContainer } from "../applicationSetup";

const debug = debugModule(`${APPLICATION_NAME}:clientCompaniesHouseUk`);

const DATA_SOURCE = "CompaniesHouse-UK";

const companiesHouseUkEndpointRoot =
  "https://api.company-information.service.gov.uk/";
const companiesHouseUkEndpointSearchCompanyById = `${companiesHouseUkEndpointRoot}search/companies?q={{COMPANY_ID}}`;

export async function companiesHouseUkExtractCompanyById(
  credential: SolidDataset,
  companyId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  const credsThing = getThingOfTypeMandatoryOne(
    credential,
    INRUPT_COMMON.CredentialResource
  );
  const authToken = getStringNoLocaleOptionalOne(
    credsThing,
    INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK.authenticationHttpBasicToken
  );

  if (authToken === null) {
    debug(
      `No, or missing, credentials for [${DATA_SOURCE}] (got authentication token [${authToken}]) - ignoring.`
    );
    return null;
  }

  const endpoint = companiesHouseUkEndpointSearchCompanyById.replace(
    "{{COMPANY_ID}}",
    companyId
  );

  return crossFetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${authToken}`,
    },
  })
    .then((res) => {
      return handleResponseJson(res, DATA_SOURCE, endpoint);
    })
    .then((json) => {
      debug(
        `Successfully retrieved company data from [${DATA_SOURCE}] for company ID [${companyId}].`
      );
      return json;
    })
    .catch((error) => {
      const message = `Exception searching [${DATA_SOURCE}] for company ID [${companyId}] from endpoint [${endpoint}]. Error: ${error}`;
      debug(message);
      throw Error(message);
    });
}

export function companiesHouseUkTransformCompany(
  credential: SolidDataset,
  // This 3rd-party APIs doesn't provide type information for responses...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  companySearchResults: any
): CollectionOfResources {
  // Our transformed result will be an array of RDF resources plus an array of
  // binary resources (i.e., Blobs), each of which can have associated RDF
  // metadata (e.g., a JPEG image (the Blob) with RDF metadata expressing the
  // image resolution, the pixel width and height, maybe to location the photo
  // was taken, etc.).
  // Our particular example here doesn't yet need Blobs, but this code is very
  // generically applicable.
  const result: CollectionOfResources = {
    rdfResources: [],
    blobsWithMetadata: [],
  };

  if (companySearchResults === null) {
    return result;
  }
  const { dataSourceContainerIri } = wireUpDataSourceContainer(
    DATA_SOURCE,
    credential
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  companySearchResults.items.forEach((companyData: any) => {
    const searchResultIri = `${dataSourceContainerIri}${companyData.company_number}/`;

    // It seems Companies House UK can have empty 'country' values (e.g., as
    // of Feb 2022, Unilever (the largest company in the UK)).
    const countryValue = companyData.address.country || "<Unspecified Country>";

    // Here we've chosen to model the company address as its own separate
    // resource.
    const address = buildThing({
      url: `${searchResultIri}address`,
    })
      .addIri(RDF.type, SCHEMA_INRUPT.PostalAddress)
      .addStringEnglish(RDFS.label, "Address")
      .addStringNoLocale(
        SCHEMA_INRUPT.streetAddress,
        companyData.address_snippet
      )
      .addStringNoLocale(
        SCHEMA_INRUPT.addressLocality,
        companyData.address.locality
      )
      .addStringNoLocale(
        SCHEMA_INRUPT.addressRegion,
        companyData.address.address_line_1
      )
      .addStringNoLocale(
        SCHEMA_INRUPT.postalCode,
        companyData.address.postal_code
      )
      .addStringNoLocale(SCHEMA_INRUPT.addressCountry, countryValue)
      .build();

    const company = buildThing({
      url: searchResultIri,
    })
      // Here we are saying that we consider this company to be of type
      // 'Schema.org Organization' (i.e., literally of type
      // 'http://schema.org/Organization').
      .addIri(RDF.type, SCHEMA_INRUPT.NS("Organization"))
      // Link our company to its address.
      .addIri(SCHEMA_INRUPT.address, address)

      .addStringNoLocale(SCHEMA_INRUPT.name, companyData.title)
      .addStringNoLocale(
        INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK.status,
        companyData.company_status
      )
      .addDate(SCHEMA_INRUPT.startDate, new Date(companyData.date_of_creation))
      .build();

    result.rdfResources.push(company);
    result.rdfResources.push(address);

    const resourceText = pluralize("resource", result.rdfResources);
    const blobText = pluralize("Blob", result.blobsWithMetadata);
    debug(
      `Transformed Companies House UK company data into [${
        result.rdfResources.length
      }] RDF ${resourceText} and [${
        (result.blobsWithMetadata as []).length
      }] ${blobText}.`
    );
  });

  return result;
}
