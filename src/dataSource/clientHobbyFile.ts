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
import fs from "fs";
import { RDF, SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import { HOBBY } from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { buildThing, SolidDataset } from "@inrupt/solid-client";
import { APPLICATION_NAME } from "../applicationConstant";
import { CollectionOfResources } from "../solidPod";
import {
  makeDataSourceContainerBuilder,
  wireUpDataSourceContainer,
} from "../applicationSetup";
import { describeCollectionOfResources } from "../util";

const debug = debugModule(`${APPLICATION_NAME}:clientHobbyFile`);

const DATA_SOURCE = "Hobby";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function hobbyFileExtract(sourceFile: string): Promise<any> {
  let fileData;
  try {
    fileData = fs.readFileSync(sourceFile, "utf8");
  } catch (error) {
    const message = `Failed to extract local Hobby file [${sourceFile}] - error: ${error}]`;
    debug(message);
    throw new Error(message);
  }

  debug(
    `Successfully extracted hobby data for [${DATA_SOURCE}] from [${sourceFile}].`
  );
  return Promise.resolve(JSON.parse(fileData));
}

export function hobbyTransform(
  credential: SolidDataset,
  // This 3rd-party APIs doesn't provide type information for responses...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  hobbyDataAsJson: any
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

  if (hobbyDataAsJson === null) {
    return result;
  }
  const wiring = wireUpDataSourceContainer(DATA_SOURCE, credential);

  // Create a container for all the resources we will be adding from this data
  // source.
  const dataSourceContainerBuilder = makeDataSourceContainerBuilder(
    wiring.dataSourceContainerIri,
    DATA_SOURCE
  );

  // Build our Pod resource IRI using our container and our incoming hobby
  // data to build up the identifier.
  const hobbyId = `${hobbyDataAsJson.id}-${hobbyDataAsJson.membership_id}`;
  const hobbyIri = `${wiring.dataSourceContainerIri}${hobbyId}/`;

  // Add a reference to this instance to our data source container.
  dataSourceContainerBuilder.addIri(HOBBY.hasHobby, hobbyIri);

  // Very simplistic address processing...
  const addressComponents = hobbyDataAsJson.address_details.split(",");

  const hobby = buildThing({
    url: `${hobbyIri}`,
  })
    // Denote the type of this resource.
    .addIri(RDF.type, HOBBY.Hobby)

    .addStringEnglish(SCHEMA_INRUPT.name, hobbyDataAsJson.club)
    .addStringNoLocale(HOBBY.kind, hobbyDataAsJson.kind_of_hobby)
    .addIri(SCHEMA_INRUPT.NS("member"), hobbyDataAsJson.web_site)
    .addStringNoLocale(SCHEMA_INRUPT.streetAddress, addressComponents[0].trim())
    .addStringNoLocale(
      SCHEMA_INRUPT.addressLocality,
      addressComponents[1].trim()
    )
    .addStringNoLocale(SCHEMA_INRUPT.addressRegion, addressComponents[2].trim())
    .addStringNoLocale(
      SCHEMA_INRUPT.addressCountry,
      addressComponents[3].trim()
    )
    .build();

  result.rdfResources.push(hobby);

  // Add the wiring-up resources to our result.
  result.rdfResources.push(...wiring.resources);

  // Now build our data source container, and add it to our result resources.
  result.rdfResources.push(dataSourceContainerBuilder.build());

  debug(describeCollectionOfResources("Transformed hobby data into", result));

  return result;
}
