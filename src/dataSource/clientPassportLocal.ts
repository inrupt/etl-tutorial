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
  INRUPT_3RD_PARTY_BT,
  INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { buildThing, SolidDataset } from "@inrupt/solid-client";
import { APPLICATION_NAME } from "../applicationConstant";
import { CollectionOfResources } from "../solidPod";
import { wireUpDataSourceContainer } from "../applicationSetup";

const debug = debugModule(`${APPLICATION_NAME}:clientPassport`);

const DATA_SOURCE = "Passport";

const inputToEtlFromMl = {
  [SCHEMA_INRUPT.familyName.value]: "Mr BT",
  [SCHEMA_INRUPT.name.value]: "Alexei",
  [SCHEMA_INRUPT.NS("gender").value]: "male",
  [SCHEMA_INRUPT.NS("birthDate").value]: "2001/04/27",

  [CRED.issuer.value]: INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.PassportOffice.value,
  [CRED.issuanceDate.value]: "2010/01/01",
  [CRED.expirationDate.value]: "2020/01/01",
  [INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber.value]: "123123123213",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function passportLocalExtract(): Promise<any> {
  return Promise.resolve(inputToEtlFromMl);
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
  // image resolution, the pixel width and height, maybe to location the photo
  // was taken, etc.).
  // Our particular example here doesn't yet need Blobs, but this code is very
  // generically applicable.
  const result: CollectionOfResources = {
    rdfResources: [],
    blobsWithMetadata: [],
  };

  if (passportData === null) {
    return result;
  }
  const { dataSourceContainerIri } = wireUpDataSourceContainer(
    DATA_SOURCE,
    credential
  );

  // Build our Pod resource IRI using our container and our incoming passport
  // identifier.
  const passportIri = `${dataSourceContainerIri}passports/${
    passportData[INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber.value]
  }/`;

  const passport = buildThing({
    url: `${passportIri}`,
  })
    // Denote the type of this resource.
    .addIri(RDF.type, INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.Passport)

    // Tag this instance of a passport as being an 'ID', but also 'Travel'
    // (just to show multiple tags).
    .addIri(INRUPT_3RD_PARTY_BT.tag, INRUPT_3RD_PARTY_BT.Tag_Id)
    .addIri(INRUPT_3RD_PARTY_BT.tag, INRUPT_3RD_PARTY_BT.Tag_Travel)

    .addStringNoLocale(
      INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber,
      passportData[INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber.value]
    )
    .addStringNoLocale(CRED.issuanceDate, passportData[CRED.issuanceDate.value])
    .addStringNoLocale(
      CRED.expirationDate,
      passportData[CRED.expirationDate.value]
    )
    .addStringNoLocale(CRED.issuer, passportData[CRED.issuer.value])
    .build();

  result.rdfResources.push(passport);

  debug(
    `...transformed passport data into [${
      result.rdfResources.length
    }] RDF resources and [${(result.blobsWithMetadata as []).length}] Blobs.`
  );

  return result;
}
