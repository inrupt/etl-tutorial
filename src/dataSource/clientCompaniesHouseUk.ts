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
import { RDF, RDFS } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import {
  INRUPT_COMMON,
  INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { buildThing, SolidDataset } from "@inrupt/solid-client";
import {
  buildDataset,
  getStringNoLocaleOptionalOne,
  getThingOfTypeMandatoryOne,
} from "../solidDatasetUtil";
import { describeCollectionOfResources, handleResponseJson } from "../util";
import { APPLICATION_NAME } from "../applicationConstant";
import { CollectionOfResources } from "../solidPod";
import {
  makeDataSourceContainerBuilder,
  wireUpDataSourceContainer,
} from "../applicationSetup";

const debug = debugModule(`${APPLICATION_NAME}:clientCompaniesHouseUk`);

const DATA_SOURCE = "CompaniesHouse-UK";

// These are the publicly available API details for performing a company
// search via the UK Companies House (that API does require an authentication
// token though, for which we've provided detailed step-by-step instructions
// in our sample environments file - /e2e/node/env.example).
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
      `\nIgnoring extraction of data from [${DATA_SOURCE}] - no, or missing, credentials (got authentication token [${authToken}]).`
    );
    return null;
  }

  debug(
    `\nGot Companies House Auth Token from user credential resource: [${authToken.substring(
      0,
      5
    )}...]`
  );

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
        `Successfully extracted company data from [${DATA_SOURCE}] for company ID [${companyId}].`
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
  companySearchResultsAsJson: any,
  applicationEntrypointIri: string
): CollectionOfResources {
  // Our transformed result will be an array of Linked Data resources plus an
  // array of binary resources (i.e., Blobs), each of which can have
  // associated Linked Data metadata (e.g., a JPEG image (the Blob) with
  // Linked Data metadata expressing the image resolution, the pixel width and
  // height, maybe the location coordinates of where the photo was taken,
  // etc.). Our particular example here doesn't yet need Blobs, but this code
  // is very generically applicable.
  const result: CollectionOfResources = {
    rdfResources: [],
    blobsWithMetadata: [],
  };

  if (companySearchResultsAsJson === null) {
    return result;
  }
  const wiring = wireUpDataSourceContainer(
    DATA_SOURCE,
    credential,
    applicationEntrypointIri
  );

  // Create a container for all the resources we will be adding from this data
  // source.
  const dataSourceContainerBuilder = makeDataSourceContainerBuilder(
    wiring.dataSourceContainerIri,
    DATA_SOURCE
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  companySearchResultsAsJson.items.forEach((companyDataAsJson: any) => {
    const searchResultIri = `${wiring.dataSourceContainerIri}CompanyID-${companyDataAsJson.company_number}/`;

    // Add a reference to this instance to our data source container.
    dataSourceContainerBuilder.addIri(
      INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK.searchResult,
      searchResultIri
    );

    // It seems Companies House UK can have empty 'country' values (e.g., as
    // of Feb 2022, Unilever (the largest company in the UK)).
    const countryValue =
      companyDataAsJson.address.country || "<Unspecified Country>";

    // Here we've chosen to model the company address as its own separate
    // resource.
    const address = buildThing({
      url: `${searchResultIri}address`,
    })
      .addIri(RDF.type, "https://schema.org/PostalAddress")
      .addStringEnglish(RDFS.label, "Address")
      .addStringNoLocale(
        "https://schema.org/streetAddress",
        companyDataAsJson.address_snippet
      )
      .addStringNoLocale(
        "https://schema.org/addressLocality",
        companyDataAsJson.address.locality
      )
      .addStringNoLocale(
        "https://schema.org/addressRegion",
        companyDataAsJson.address.address_line_1
      )
      .addStringNoLocale(
        "https://schema.org/postalCode",
        companyDataAsJson.address.postal_code
      )
      .addStringNoLocale("https://schema.org/addressCountry", countryValue)
      .build();

    const company = buildDataset(
      buildThing({
        url: searchResultIri,
      })
        // Here we are saying that we consider this company to be of type
        // 'Schema.org Organization' (i.e., literally of type
        // 'https://schema.org/Organization').
        .addIri(RDF.type, "https://schema.org/Organization")
        // Link our company to its address.
        .addIri("https://schema.org/address", address.url)

        .addStringNoLocale("https://schema.org/name", companyDataAsJson.title)
        .addStringNoLocale(
          INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK.status,
          companyDataAsJson.company_status
        )
        .addDate(
          "https://schema.org/startDate",
          new Date(companyDataAsJson.date_of_creation)
        )
        .build()
    );

    result.rdfResources.push(company);
    result.rdfResources.push(buildDataset(address));

    // Add the wiring-up resources to our result.
    result.rdfResources.push(
      ...wiring.resources.map((thing) => buildDataset(thing))
    );

    // Now build our data source container, and add it to our result resources.
    result.rdfResources.push(buildDataset(dataSourceContainerBuilder.build()));

    debug(
      describeCollectionOfResources(
        "Transformed Companies House UK company data into",
        result
      )
    );
  });

  return result;
}
