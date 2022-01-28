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

import type { NamedNode } from "@rdfjs/types";
import {
  buildThing,
  createSolidDataset,
  setThing,
  SolidDataset,
  Thing,
  ThingBuilder,
  ThingLocal,
} from "@inrupt/solid-client";

import { RDF } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import {
  INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK,
  INRUPT_COMMON,
  SOLID,
} from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import {
  getIriMandatoryOne,
  getIriOptionalOne,
  getStringNoLocaleMandatoryOne,
  getStringNoLocaleOptionalOne,
  getThingOfTypeMandatoryOne,
} from "./solidDatasetUtil";

export function addCredential(
  builder: ThingBuilder<Thing>,
  predicate: NamedNode | string,
  environmentVariable: string,
  ignoreArray?: string[]
): string | undefined {
  if (ignoreArray !== undefined) {
    if (ignoreArray.includes(environmentVariable)) {
      return undefined;
    }
  }

  const value = process.env[environmentVariable];
  if (value !== undefined) {
    builder.addStringNoLocale(predicate, value);
  }

  return value;
}

export function createCredentialResourceEmpty(): SolidDataset {
  const builder = buildThing().addIri(
    RDF.type,
    INRUPT_COMMON.CredentialResource
  );

  return setThing(createSolidDataset(), builder.build());
}

export function createCredentialResourceBuilder(): ThingBuilder<ThingLocal> {
  return buildThing().addIri(RDF.type, INRUPT_COMMON.CredentialResource);
}

export function buildCredentialResourceFromEnvironmentVariables(
  builder: ThingBuilder<ThingLocal>,
  ignoreArray?: string[]
): ThingBuilder<ThingLocal> {
  // Just to get full coverage...
  addCredential(
    builder,
    INRUPT_COMMON.CredentialResource,
    "COVERAGE_NON_EXISTENT_ENVIRONMENT_VARIABLE"
  );

  addCredential(
    builder,
    INRUPT_COMMON.triplestoreEndpointUpdate,
    "INRUPT_TRIPLESTORE_ENDPOINT_UPDATE",
    ignoreArray
  );
  addCredential(
    builder,
    INRUPT_COMMON.triplestoreNamedGraph,
    "INRUPT_TRIPLESTORE_NAMED_GRAPH",
    ignoreArray
  );

  addCredential(builder, SOLID.webId, "SOLID_WED_ID", ignoreArray);
  addCredential(builder, SOLID.storageRoot, "SOLID_STORAGE_ROOT", ignoreArray);
  addCredential(builder, SOLID.oidcIssuer, "SOLID_OIDC_ISSUER", ignoreArray);

  //
  // Credentials for the ETL process to authenticate with Solid.
  //
  addCredential(
    builder,
    INRUPT_COMMON.clientId,
    "INRUPT_CREDENTIALS_ETL_CLIENT_ID",
    ignoreArray
  );
  addCredential(
    builder,
    INRUPT_COMMON.clientSecret,
    "INRUPT_CREDENTIALS_ETL_CLIENT_SECRET",
    ignoreArray
  );

  //
  // Data source-specific credentials...
  //
  addCredential(
    builder,
    INRUPT_3RD_PARTY_COMPANIES_HOUSE_UK.authenticationHttpBasicToken,
    "INRUPT_SOURCE_COMPANIES_HOUSE_UK_HTTP_BASIC_TOKEN",
    ignoreArray
  );

  return builder;
}

export function createCredentialResourceFromEnvironmentVariables(
  ignoreArray?: string[]
): SolidDataset {
  const builder = createCredentialResourceBuilder();
  buildCredentialResourceFromEnvironmentVariables(builder, ignoreArray);

  return setThing(createSolidDataset(), builder.build());
}

export function getUserCredentialStringMandatory(
  credential: SolidDataset,
  predicate: NamedNode | string
): string {
  const thing = getThingOfTypeMandatoryOne(
    credential,
    INRUPT_COMMON.CredentialResource
  );
  return getStringNoLocaleMandatoryOne(thing, predicate);
}

export function getUserCredentialIriMandatory(
  credential: SolidDataset,
  predicate: NamedNode | string
): NamedNode {
  const thing = getThingOfTypeMandatoryOne(
    credential,
    INRUPT_COMMON.CredentialResource
  );
  return getIriMandatoryOne(thing, predicate);
}

export function getCredentialStringOptional(
  credential: SolidDataset,
  predicate: NamedNode | string,
  defaultIfNone?: string
): string | null {
  const thing = getThingOfTypeMandatoryOne(
    credential,
    INRUPT_COMMON.CredentialResource
  );
  return getStringNoLocaleOptionalOne(thing, predicate, defaultIfNone);
}

export function getCredentialIriOptional(
  credential: SolidDataset,
  predicate: NamedNode | string
): NamedNode | null {
  const thing = getThingOfTypeMandatoryOne(
    credential,
    INRUPT_COMMON.CredentialResource
  );
  return getIriOptionalOne(thing, predicate);
}
