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
import {
  RDF,
  SCHEMA_INRUPT,
  CRED,
} from "@inrupt/vocab-common-rdf-rdfdatafactory";
import {
  INRUPT_3RD_PARTY_UNILEVER,
  INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK,
  INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { buildThing, SolidDataset } from "@inrupt/solid-client";
import { APPLICATION_NAME } from "../applicationConstant";
import { CollectionOfResources } from "../solidPod";
import {
  makeDataSourceContainerBuilder,
  wireUpDataSourceContainer,
} from "../applicationSetup";
import { pluralize } from "../util";

const debug = debugModule(`${APPLICATION_NAME}:clientPassportLocal`);

const DATA_SOURCE = "PassportOffice-UK";

// Here we just provide really simple in-line 'JSON', just to illustrate that
// 3rd-party data can really come from anywhere, and it will typically have
// its own completely proprietary naming scheme for its data fields (e.g., in
// this example, the passport number field is simply named  "number", since
// the source of this data is assuming you already know the 'context' within
// which this data is being returned, i.e., it's specifically within the
// context of a request for Passport data).
const inputToEtlFrom3rdParty = {
  surname: "Bloggs",
  first_name: "Joe",
  gender: "male",
  date_of_birth: "2001/04/27",
  issued_date: "2010/01/01",
  expiry_date: "2020/01/01",
  number: "PII-123123213",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function passportLocalExtract(): Promise<any> {
  debug(
    `Successfully extracted passport data from [${DATA_SOURCE}] for [${inputToEtlFrom3rdParty.surname}].`
  );
  return Promise.resolve(inputToEtlFrom3rdParty);
}

export function passportTransform(
  credential: SolidDataset,
  // This 3rd-party APIs doesn't provide type information for responses...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  passportData: any
): CollectionOfResources {
  // Our transformed result will be an array of RDF resources plus an array of
  // binary resources (i.e., Blobs), each of which can have associated RDF
  // metadata (e.g., a JPEG image (the Blob) with RDF metadata expressing the
  // image resolution, the pixel width and height, maybe the location
  // coordinates of where the photo was taken, etc.).
  // Our particular example here doesn't yet need Blobs, but this code is very
  // generically applicable.
  const result: CollectionOfResources = {
    rdfResources: [],
    blobsWithMetadata: [],
  };

  if (passportData === null) {
    return result;
  }
  const wiring = wireUpDataSourceContainer(DATA_SOURCE, credential);

  // Create a container for all the resources we will be adding from this data
  // source.
  const dataSourceContainerBuilder = makeDataSourceContainerBuilder(
    wiring.dataSourceContainerIri,
    DATA_SOURCE
  );

  // Build our Pod resource IRI using our container and our incoming passport
  // identifier.
  const passportNumber = passportData.number;
  const passportIri = `${wiring.dataSourceContainerIri}passport/${passportNumber}/`;

  // Add a reference to this instance to our data source container.
  dataSourceContainerBuilder.addIri(
    INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passport,
    passportIri
  );

  const passport = buildThing({
    url: `${passportIri}`,
  })
    // Denote the type of this resource.
    .addIri(RDF.type, INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.Passport)

    // We know the issuer of this passport (since we're explicitly
    // performing the Extraction from this data source), so we can add it
    // explicitly ourselves (since 3rd-party data rarely identifies itself,
    // instead assuming consumers only work within that data source's silo).
    .addIri(CRED.issuer, INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.PassportOffice)

    .addStringEnglish(SCHEMA_INRUPT.name, passportData.first_name)
    .addStringEnglish(SCHEMA_INRUPT.familyName, passportData.surname)

    .addStringNoLocale(
      INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber,
      passportNumber
    )
    .addDate(CRED.issuanceDate, new Date(passportData.issued_date))
    .addDate(CRED.expirationDate, new Date(passportData.expiry_date))

    // Tag this instance of a passport as being an 'ID', but also 'Travel'
    // (just to show multiple tags).
    .addIri(INRUPT_3RD_PARTY_UNILEVER.tag, INRUPT_3RD_PARTY_UNILEVER.Tag_Id)
    .addIri(INRUPT_3RD_PARTY_UNILEVER.tag, INRUPT_3RD_PARTY_UNILEVER.Tag_Travel)
    .build();

  result.rdfResources.push(passport);

  // Add the wiring-up resources to our result.
  result.rdfResources.push(...wiring.resources);

  // Now build our data source container, and add it to our result resources.
  result.rdfResources.push(dataSourceContainerBuilder.build());

  const resourceText = pluralize("resource", result.rdfResources);
  const blobText = pluralize("Blob", result.blobsWithMetadata);
  debug(
    `Transformed passport data into [${
      result.rdfResources.length
    }] RDF ${resourceText} and [${
      (result.blobsWithMetadata as []).length
    }] ${blobText}.`
  );

  return result;
}
