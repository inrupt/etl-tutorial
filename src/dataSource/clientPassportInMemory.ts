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

// We need to explicitly import the Node.js implementation of 'Blob' here
// because it's not a global in Node.js (whereas it is global in the browser).
// We may also need to explicitly convert our usage of 'Blob' into a Buffer
// instead of using it as a 'Blob', because the Node.js 'Blob' implementation
// has no 'stream()' method, whereas the browser implementation does -
// otherwise using one instance where the other is expected will throw an
// error like this:
//   error TS2345: Argument of type 'Blob' is not assignable to parameter of type 'Blob | Buffer'.
//     Type 'import("buffer").Blob' is not assignable to type 'Blob'.
//       The types returned by 'stream()' are incompatible between these types.
//         Type 'unknown' is not assignable to type 'ReadableStream<any>'.
// Both the Node.js and the browser implementations of 'Blob' support the
// '.arrayBuffer()' method, and the `solid-client-js` functions that expect
// 'Blob's (like `overwriteFile()`) can accept both native 'Blob's and
// 'Buffer's, so always converting any 'Blob' instances we have into 'Buffer's
// allows those functions to work safely with both Node.js and browser
// 'Blob's.
// eslint-disable-next-line no-shadow
import { Blob } from "node:buffer";
import fs from "fs";
import debugModule from "debug";
import {
  RDF,
  SCHEMA_INRUPT,
  CRED,
  RDFS,
} from "@inrupt/vocab-common-rdf-rdfdatafactory";
import {
  DPV_PD,
  GIST,
  INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { buildThing, SolidDataset } from "@inrupt/solid-client";

import { APPLICATION_NAME } from "../applicationConstant";
import { CollectionOfResources } from "../solidPod";
import {
  makeDataSourceContainerBuilder,
  wireUpDataSourceContainer,
} from "../applicationSetup";
import { describeCollectionOfResources } from "../util";
import { buildDataset } from "../solidDatasetUtil";

const debug = debugModule(`${APPLICATION_NAME}:clientPassportInMemory`);

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
  photo_image_file:
    "resources/test/DummyData/DummyDataSource/DummyPassportOffice/DummyPhoto/fake_passport.jpg",
  exif: `{ ColorModel: RGB, PixelHeight: 800, PixelWidth: 532 }`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function passportLocalExtract(): Promise<any> {
  debug(
    `\nSuccessfully extracted passport data from [${DATA_SOURCE}] for [${inputToEtlFrom3rdParty.surname}].`
  );

  // Return a copy of our 3rd-party data (in case the receiver (e.g., a test)
  // mutates what they get back!).
  return Promise.resolve({ ...inputToEtlFrom3rdParty });
}

export function passportTransform(
  credential: SolidDataset,
  // This 3rd-party APIs doesn't provide type information for responses...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  passportDataAsJson: any,
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

  if (passportDataAsJson === null) {
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

  // Build our Pod resource IRI using our container and our incoming passport
  // identifier.
  const passportNumber = passportDataAsJson.number;
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

    .addStringEnglish(SCHEMA_INRUPT.name, passportDataAsJson.first_name)
    .addStringEnglish(SCHEMA_INRUPT.familyName, passportDataAsJson.surname)

    .addStringNoLocale(
      INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK.passportNumber,
      passportNumber
    )
    .addDate(CRED.issuanceDate, new Date(passportDataAsJson.issued_date))
    .addDate(CRED.expirationDate, new Date(passportDataAsJson.expiry_date))

    // Tag this instance of a passport with applicable DPV Personal Data
    // terms.
    .addIri(GIST.isCategorizedBy, DPV_PD.OfficialID)
    .addIri(GIST.isCategorizedBy, DPV_PD.Passport)
    .addIri(GIST.isCategorizedBy, DPV_PD.Identifying)
    .addIri(GIST.isCategorizedBy, DPV_PD.Picture)
    .build();

  // This section of code was intended to simply read a local file
  // (representing a passport photo), and treat it as a Blob for insertion
  // into the user's Pod. But this project isn't setup to allow that, as we're
  // configured to use 'jsdom' when we shouldn't be (as this project should be
  // a pure Node.js project, and not a JS library).
  let fileData;
  try {
    fileData = fs.readFileSync(passportDataAsJson.photo_image_file);
  } catch (error) {
    const message = `Failed to read local passport photo file [${passportDataAsJson.photo_image_file}] for passport number [${passportNumber}] - error: ${error}]`;
    debug(message);
    throw new Error(message);
  }

  const passportPhoto = new Blob([fileData], {
    type: "image/jpeg",
  });

  const blobMetadataIri = `${passportIri}passportPhoto`;
  const blobIri = `${blobMetadataIri}.jpeg`;

  const blobMetadata: SolidDataset = buildDataset(
    buildThing({
      url: blobMetadataIri,
    })
      .addIri(RDF.type, SCHEMA_INRUPT.NS("ImageObject"))
      .addStringNoLocale(RDFS.label, passportDataAsJson.photo_image_file)
      .addStringNoLocale(SCHEMA_INRUPT.NS("exifData"), passportDataAsJson.exif)
      .addIri(SCHEMA_INRUPT.image, blobIri)
      .build()
  );

  // Here can add the metadata resource to our collection of resources,
  // or add it to a simple structure that keeps blob and metadata
  // together (so a failure to write one can report its association
  // with the other).
  // This 'blobsWithMetadata' value can't be null, 'cos we explicitly
  // instantiated it above.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  result.blobsWithMetadata.push({
    url: blobMetadataIri,
    blob: passportPhoto,
    metadata: blobMetadata,
  });

  result.rdfResources.push(buildDataset(passport));

  // Add the wiring-up resources to our result.
  result.rdfResources.push(
    ...wiring.resources.map((thing) => buildDataset(thing))
  );

  // Now build our data source container, and add it to our result resources.
  result.rdfResources.push(buildDataset(dataSourceContainerBuilder.build()));

  debug(
    describeCollectionOfResources("Transformed passport data into", result)
  );

  return result;
}
