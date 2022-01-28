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

import { buildThing, getThingAll } from "@inrupt/solid-client";
import { INRUPT_TEST } from "@inrupt/vocab-inrupt-test-rdfdatafactory";
import { RDF } from "@inrupt/vocab-common-rdf-rdfdatafactory";
import { INRUPT_COMMON } from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";

import {
  addCredential,
  createCredentialResourceEmpty,
  getUserCredentialIriMandatory,
  getCredentialIriOptional,
  getUserCredentialStringMandatory,
  getCredentialStringOptional,
} from "./credentialUtil";
import { buildDataset, getThingOfTypeMandatoryOne } from "./solidDatasetUtil";

describe("Credential utility", () => {
  describe("Environment variables", () => {
    it("non-existent environment variables will be ignored", async () => {
      const builder = buildThing();

      addCredential(
        builder,
        INRUPT_COMMON.CredentialResource,
        "COVERAGE_NON_EXISTENT_ENVIRONMENT_VARIABLE"
      );

      expect(builder.build().predicates).toStrictEqual({});
    });
  });

  describe("Getting mandatory credential values", () => {
    it("should get string credential", async () => {
      const thing = buildThing()
        .addIri(RDF.type, INRUPT_COMMON.CredentialResource)
        .addStringNoLocale(
          INRUPT_TEST.somePredicate,
          INRUPT_TEST.hashSomeObject
        )
        .build();

      expect(
        getUserCredentialStringMandatory(
          buildDataset(thing),
          INRUPT_TEST.somePredicate
        )
      ).toEqual(INRUPT_TEST.hashSomeObject);
    });

    it("should get IRI credential", async () => {
      const thing = buildThing()
        .addIri(RDF.type, INRUPT_COMMON.CredentialResource)
        .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
        .build();

      expect(
        getUserCredentialIriMandatory(
          buildDataset(thing),
          INRUPT_TEST.somePredicate
        )
      ).toEqual(INRUPT_TEST.somePodResource);
    });
  });

  describe("Getting optional credential values", () => {
    it("should get string credential", async () => {
      const thing = buildThing()
        .addIri(RDF.type, INRUPT_COMMON.CredentialResource)
        .addStringNoLocale(
          INRUPT_TEST.somePredicate,
          INRUPT_TEST.hashSomeObject
        )
        .build();

      expect(
        getCredentialStringOptional(
          buildDataset(thing),
          INRUPT_TEST.somePredicate
        )
      ).toEqual(INRUPT_TEST.hashSomeObject);
    });

    it("should get IRI credential", async () => {
      const thing = buildThing()
        .addIri(RDF.type, INRUPT_COMMON.CredentialResource)
        .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
        .build();

      expect(
        getCredentialIriOptional(buildDataset(thing), INRUPT_TEST.somePredicate)
      ).toEqual(INRUPT_TEST.somePodResource);
    });
  });

  describe("Creating credential resource", () => {
    it("should create empty resource", () => {
      const creds = createCredentialResourceEmpty();
      expect(
        getThingOfTypeMandatoryOne(creds, INRUPT_COMMON.CredentialResource)
      ).toStrictEqual(getThingAll(creds)[0]);
    });
  });
});
