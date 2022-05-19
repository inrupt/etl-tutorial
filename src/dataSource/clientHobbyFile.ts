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
  RDFS,
} from "@inrupt/vocab-common-rdf-rdfdatafactory";
import {
  HOBBY,
  INRUPT_3RD_PARTY_PASSPORT_OFFICE_UK,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { buildThing, SolidDataset, Thing } from "@inrupt/solid-client";
import fs from "fs";
import { APPLICATION_NAME } from "../applicationConstant";
import { CollectionOfResources } from "../solidPod";
import {
  makeDataSourceContainerBuilder,
  wireUpDataSourceContainer,
} from "../applicationSetup";
import { describeCollectionOfResources } from "../util";

const debug = debugModule(`${APPLICATION_NAME}:clientPassportLocal`);

const DATA_SOURCE = "Hobby";

const hobbyDetails = {
  id: "Joe_Bloggs",
  club: "Irish Parachute Club",
  web_site: "https://skydive.ie/",
  address_details: "Clonbullogue Airfield, Edenderry, Co. Offaly, Ireland",
  membership_id: "998877",
  kind_of_hobby: "sport",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function hobbyLocalExtract(): Promise<any> {
  debug(
    `Successfully extracted passport data from [${DATA_SOURCE}] for [${hobbyDetails.id}].`
  );
  return Promise.resolve(hobbyDetails);
}

export function hobbyTransform(
  credential: SolidDataset,
  // This 3rd-party APIs doesn't provide type information for responses...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  hobbyData: any
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

  if (hobbyData === null) {
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
  const hobbyId = `${hobbyData.id}-${hobbyData.membership_id}`;
  const hobbyIri = `${wiring.dataSourceContainerIri}${hobbyId}/`;

  // Add a reference to this instance to our data source container.
  dataSourceContainerBuilder.addIri(HOBBY.hasHobby, hobbyIri);

  // Very simplistic address processing...
  const addressComponents = hobbyData.address_details.split(",");

  const hobby = buildThing({
    url: `${hobbyIri}`,
  })
    // Denote the type of this resource.
    .addIri(RDF.type, HOBBY.Hobby)

    .addStringNoLocale(SCHEMA_INRUPT.name, hobbyData.club)
    .addStringNoLocale(HOBBY.kind, hobbyData.kind_of_hobby)
    .addIri(SCHEMA_INRUPT.NS("member"), hobbyData.web_site)
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
