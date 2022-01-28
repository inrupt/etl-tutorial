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

import fs from "fs";
import {
  buildThing,
  getSolidDataset,
  createSolidDataset,
  deleteSolidDataset,
  deleteFile,
  getContainedResourceUrlAll,
  getDecimal,
  getStringEnglish,
  getStringNoLocale,
  getStringNoLocaleAll,
  getStringWithLocale,
  getStringWithLocaleAll,
  mockSolidDatasetFrom,
  setThing,
  SolidDataset,
} from "@inrupt/solid-client";
import {
  LDP,
  RDF,
  SCHEMA_INRUPT,
} from "@inrupt/vocab-common-rdf-rdfdatafactory";
import { INRUPT_COMMON } from "@inrupt/vocab-etl-tutorial-bundle-all-rdfdatafactory";
import { INRUPT_TEST } from "@inrupt/vocab-inrupt-test-rdfdatafactory";
import {
  getThingOfTypeMandatoryOne,
  getStringNoLocaleMandatoryOne,
  getThingAllOfType,
  toNTriples,
  getIriMandatoryOne,
  buildDataset,
  getStringNoLocaleOptionalOne,
  getIriOptionalOne,
  mergeSolidDataset,
  removeTypeTriples,
  deleteRecursively,
  parseStreamIntoSolidDataset,
} from "./solidDatasetUtil";

jest.mock("@inrupt/solid-client", () => {
  // TypeScript can't infer the type of modules imported via Jest;
  // skip type checking for those:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const solidClientModule = jest.requireActual("@inrupt/solid-client") as any;

  solidClientModule.getContainedResourceUrlAll = jest.fn(
    solidClientModule.getContainedResourceUrlAll
  );

  solidClientModule.deleteFile = jest.fn(solidClientModule.deleteFile);

  solidClientModule.deleteSolidDataset = jest.fn(
    solidClientModule.deleteSolidDataset
  );

  solidClientModule.getSolidDataset = jest.fn(
    solidClientModule.getSolidDataset
  );
  return solidClientModule;
});

describe("Solid dataset util functions", () => {
  describe("Build dataset", () => {
    it("should build a dataset from a thing", async () => {
      const thing = buildThing()
        .addIri(INRUPT_TEST.somePredicate, INRUPT_TEST.somePodResource)
        .build();
      expect(buildDataset(thing)).not.toBeNull();
    });
  });

  describe("get thing All of type", () => {
    it("should fail to find thing in Named Graph", async () => {
      const dataset: SolidDataset = buildDataset(
        buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addStringEnglish(SCHEMA_INRUPT.familyName, "Magoo")
          .build()
      );

      expect(
        getThingAllOfType(dataset, SCHEMA_INRUPT.Person, {
          scope: "https://non-existent-graph",
        })
      ).toHaveLength(0);
    });
  });

  describe("get mandatory things of type", () => {
    it("should get Thing of type from dataset", async () => {
      const personName = "Magoo";
      const dataset: SolidDataset = buildDataset(
        buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addStringEnglish(SCHEMA_INRUPT.familyName, personName)
          .build()
      );

      const thing = getThingOfTypeMandatoryOne(dataset, SCHEMA_INRUPT.Person);
      expect(getStringEnglish(thing, SCHEMA_INRUPT.familyName)).toBe(
        personName
      );
    });

    it("should get Thing of type from dataset (using string for IRI)", async () => {
      const personName = "Magoo";
      const dataset: SolidDataset = buildDataset(
        buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addStringEnglish(SCHEMA_INRUPT.familyName, personName)
          .build()
      );

      const thing = getThingOfTypeMandatoryOne(
        dataset,
        "http://schema.org/Person"
      );
      expect(getStringEnglish(thing, SCHEMA_INRUPT.familyName)).toBe(
        personName
      );
    });

    it("should get Thing of type from dataset (using Named Graph)", async () => {
      const personName = "Magoo";
      const dataset: SolidDataset = buildDataset(
        buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addStringEnglish(SCHEMA_INRUPT.familyName, personName)
          .build()
      );

      const thing = getThingOfTypeMandatoryOne(dataset, SCHEMA_INRUPT.Person, {
        scope: "default",
      });
      expect(getStringEnglish(thing, SCHEMA_INRUPT.familyName)).toBe(
        personName
      );
    });

    it("should fail if no Thing of type in dataset", async () => {
      const dataset: SolidDataset = buildDataset(
        buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addStringEnglish(SCHEMA_INRUPT.familyName, "Magoo")
          .build()
      );

      expect(() =>
        getThingOfTypeMandatoryOne(dataset, SCHEMA_INRUPT.PostalAddress)
      ).toThrow(
        "only one thing of type [http://schema.org/PostalAddress]), but we couldn't find any"
      );
    });

    it("should fail if more than one Thing of type in dataset", async () => {
      const dataset: SolidDataset = buildDataset(
        buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addStringEnglish(SCHEMA_INRUPT.familyName, "Magoo")
          .build()
      );

      const twoThingDataset = setThing(
        dataset,
        buildThing({ url: "https://inrupt.com/vocab/second" })
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addStringEnglish(SCHEMA_INRUPT.familyName, "The Pooh")
          .build()
      );

      expect(() =>
        getThingOfTypeMandatoryOne(twoThingDataset, SCHEMA_INRUPT.Person)
      ).toThrow(
        "only one thing of type [http://schema.org/Person]), but we found [2]"
      );
    });
  });

  describe("Get mandatory string from thing", () => {
    it("should get single string value", async () => {
      const personName = "Magoo";
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, personName)
        .build();

      expect(
        getStringNoLocaleMandatoryOne(thing, SCHEMA_INRUPT.familyName)
      ).toBe(personName);
    });

    it("should fail if no string value", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .build();

      expect(() =>
        getStringNoLocaleMandatoryOne(thing, SCHEMA_INRUPT.givenName)
      ).toThrow(
        "only one no-locale string value for predicate [http://schema.org/givenName]), but we couldn't find any values"
      );
    });

    it("should fail if more than one string value", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "The Pooh")
        .build();

      expect(() =>
        getStringNoLocaleMandatoryOne(thing, SCHEMA_INRUPT.familyName)
      ).toThrow(
        "only one no-locale string value for predicate [http://schema.org/familyName]), but we found [2] values: [Magoo,The Pooh]"
      );
    });
  });

  describe("Get optional string from thing", () => {
    it("should get single string value", async () => {
      const personName = "Magoo";
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, personName)
        .build();

      expect(
        getStringNoLocaleOptionalOne(thing, SCHEMA_INRUPT.familyName)
      ).toBe(personName);
    });

    it("should return null if no string value", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .build();

      expect(
        getStringNoLocaleOptionalOne(thing, SCHEMA_INRUPT.givenName)
      ).toBeNull();
    });

    it("should return null if empty string value", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "")
        .build();

      expect(
        getStringNoLocaleOptionalOne(thing, SCHEMA_INRUPT.familyName)
      ).toBeNull();
    });

    it("should return default value if no string value", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .build();

      expect(
        getStringNoLocaleOptionalOne(
          thing,
          SCHEMA_INRUPT.givenName,
          "default value"
        )
      ).toBe("default value");
    });

    it("should return default value if empty string value", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "")
        .build();

      expect(
        getStringNoLocaleOptionalOne(
          thing,
          SCHEMA_INRUPT.familyName,
          "default value"
        )
      ).toBe("default value");
    });

    it("should fail if more than one string value", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "The Pooh")
        .build();

      expect(() =>
        getStringNoLocaleOptionalOne(thing, SCHEMA_INRUPT.familyName)
      ).toThrow(
        "only one no-locale string value for predicate [http://schema.org/familyName]), but we found [2] values: [Magoo,The Pooh]"
      );
    });
  });

  describe("Get mandatory IRI from thing", () => {
    it("should get single IRI value", async () => {
      const license = INRUPT_TEST.somePodResource;
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addIri(SCHEMA_INRUPT.license, license)
        .build();

      expect(getIriMandatoryOne(thing, SCHEMA_INRUPT.license)).toEqual(license);
    });

    it("should fail if no IRI value", async () => {
      const thing = buildThing().addIri(RDF.type, SCHEMA_INRUPT.Person).build();

      expect(() => getIriMandatoryOne(thing, SCHEMA_INRUPT.license)).toThrow(
        "only one IRI value for predicate [http://schema.org/license]), but we couldn't find any values"
      );
    });

    it("should fail if more than one IRI value", async () => {
      const license1 = INRUPT_TEST.somePodResource;
      const license2 = INRUPT_TEST.someOtherPodResource;
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addIri(SCHEMA_INRUPT.license, license1)
        .addIri(SCHEMA_INRUPT.license, license2)
        .build();

      expect(() => getIriMandatoryOne(thing, SCHEMA_INRUPT.license)).toThrow(
        "only one IRI value for predicate [http://schema.org/license]), but we found [2] values: [https://inrupt.com/vocab/test#https://some.pod/rootContainer/container/Resource1,https://inrupt.com/vocab/test#https://some.other.pod.com/OtherResource]"
      );
    });

    describe("Get optional IRI from thing", () => {
      it("should get single IRI value", async () => {
        const license = INRUPT_TEST.somePodResource;
        const thing = buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addIri(SCHEMA_INRUPT.license, license)
          .build();

        expect(getIriOptionalOne(thing, SCHEMA_INRUPT.license)).toEqual(
          license
        );
      });

      it("should return null if no IRI value", async () => {
        const thing = buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .build();

        expect(getIriOptionalOne(thing, SCHEMA_INRUPT.license)).toBeNull();
      });

      it("should fail if more than one IRI value", async () => {
        const license1 = INRUPT_TEST.somePodResource;
        const license2 = INRUPT_TEST.someOtherPodResource;
        const thing = buildThing()
          .addIri(RDF.type, SCHEMA_INRUPT.Person)
          .addIri(SCHEMA_INRUPT.license, license1)
          .addIri(SCHEMA_INRUPT.license, license2)
          .build();

        expect(() => getIriOptionalOne(thing, SCHEMA_INRUPT.license)).toThrow(
          "only one IRI value for predicate [http://schema.org/license]), but we found [2] values: [https://inrupt.com/vocab/test#https://some.pod/rootContainer/container/Resource1,https://inrupt.com/vocab/test#https://some.other.pod.com/OtherResource]"
        );
      });
    });
  });

  describe("Converting to NTriples (for SPARQL Update)", () => {
    it("should convert Thing to string", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .addStringWithLocale(SCHEMA_INRUPT.familyName, "Cú Chulainn", "ga")
        .addDecimal(SCHEMA_INRUPT.serialNumber, 123.456)
        .build();

      const result = toNTriples(thing);
      expect(result).toContain(
        `"Magoo"^^<http://www.w3.org/2001/XMLSchema#string>`
      );
      expect(result).toContain(`"Cú Chulainn"@ga`);
      expect(result).toContain(
        `"123.456"^^<http://www.w3.org/2001/XMLSchema#decimal>`
      );
    });

    it("should throw if triples has undefined Object value", () => {
      const thing = buildThing()
        // Here we deliberately force a 'null' value for a triple Object.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .addStringNoLocale(SCHEMA_INRUPT.familyName, null)
        .build();

      expect(() => toNTriples(thing)).toThrow("Literal value was not provided");
    });
  });

  describe("Merging datasets", () => {
    it("should merge empty datasets OK", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .addStringWithLocale(SCHEMA_INRUPT.familyName, "Cú Chulainn", "ga")
        .addDecimal(SCHEMA_INRUPT.serialNumber, 123.456)
        .build();

      const dataset1 = setThing(createSolidDataset(), thing);
      const dataset2 = createSolidDataset();

      expect(
        getDecimal(
          getThingOfTypeMandatoryOne(
            mergeSolidDataset(dataset1, dataset2),
            SCHEMA_INRUPT.Person
          ),
          SCHEMA_INRUPT.serialNumber
        )
      ).toBe(123.456);
      expect(
        getDecimal(
          getThingOfTypeMandatoryOne(
            mergeSolidDataset(dataset2, dataset1),
            SCHEMA_INRUPT.Person
          ),
          SCHEMA_INRUPT.serialNumber
        )
      ).toBe(123.456);
    });

    it("should add Thing to dataset", async () => {
      const sharedUrl = "https://we.want.things.with.same.subject.com/";
      const thing1 = buildThing({ url: sharedUrl })
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .addDecimal(SCHEMA_INRUPT.serialNumber, 987.654)
        .addStringNoLocale(SCHEMA_INRUPT.name, "thing 1 name")
        .build();
      const thing2 = buildThing({ url: sharedUrl })
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringWithLocale(SCHEMA_INRUPT.familyName, "Cú Chulainn", "ga")
        .addDecimal(SCHEMA_INRUPT.serialNumber, 123.456)
        .addStringNoLocale(SCHEMA_INRUPT.name, "thing 2 name")
        .build();

      const dataset1 = setThing(createSolidDataset(), thing1);
      const dataset2 = setThing(createSolidDataset(), thing2);

      const datasetMerged = mergeSolidDataset(dataset1, dataset2);

      // const quads = toRdfJsDataset(datasetMerged);

      // Should be just one Thing of type Person (not two!).
      const personThing = getThingOfTypeMandatoryOne(
        datasetMerged,
        SCHEMA_INRUPT.Person
      );

      // Value from first thing should be overwritten from second thing.
      expect(getDecimal(personThing, SCHEMA_INRUPT.serialNumber)).toBe(987.654);

      expect(getStringNoLocale(personThing, SCHEMA_INRUPT.familyName)).toBe(
        "Magoo"
      );
      expect(
        getStringWithLocale(personThing, SCHEMA_INRUPT.familyName, "ga")
      ).toBe("Cú Chulainn");
    });
  });

  describe("remove triples", () => {
    it("should remove rdf:type triples", async () => {
      const thing = buildThing()
        .addIri(RDF.type, LDP.BasicContainer)
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .addStringWithLocale(SCHEMA_INRUPT.familyName, "Cú Chulainn", "ga")
        .addDecimal(SCHEMA_INRUPT.serialNumber, 123.456)
        .build();

      const dataset = setThing(createSolidDataset(), thing);

      const datasetRemoved = removeTypeTriples(dataset, RDF.type, [
        LDP.BasicContainer,
      ]);
      expect(
        getThingAllOfType(datasetRemoved, LDP.BasicContainer)
      ).toHaveLength(0);
      expect(
        getThingAllOfType(datasetRemoved, SCHEMA_INRUPT.Person)
      ).toHaveLength(1);
    });

    it("should remove all predicate triples if no matching type", async () => {
      const thing = buildThing()
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .addStringWithLocale(SCHEMA_INRUPT.familyName, "Cú Chulainn", "ga")
        .addDecimal(SCHEMA_INRUPT.serialNumber, 123.456)
        .build();

      const dataset = setThing(createSolidDataset(), thing);

      // We stipulate an rdf:type that doesn't exist in our thing - should
      // remove all occurrences of the stipulated predicate.
      const datasetRemoved = removeTypeTriples(
        dataset,
        SCHEMA_INRUPT.familyName,
        [SCHEMA_INRUPT.Person]
      );

      const things = getThingAllOfType(datasetRemoved, SCHEMA_INRUPT.Person);
      expect(things).toHaveLength(1);
      expect(
        getStringNoLocaleAll(things[0], SCHEMA_INRUPT.familyName)
      ).toHaveLength(0);
      expect(
        getStringWithLocaleAll(things[0], SCHEMA_INRUPT.familyName, "ga")
      ).toHaveLength(0);
    });

    it("should remove predicate-matching triples", async () => {
      const thing = buildThing()
        .addIri(RDF.type, LDP.BasicContainer)
        .addIri(RDF.type, SCHEMA_INRUPT.Person)
        .addStringNoLocale(SCHEMA_INRUPT.familyName, "Magoo")
        .addStringWithLocale(SCHEMA_INRUPT.familyName, "Cú Chulainn", "ga")
        .addDecimal(SCHEMA_INRUPT.serialNumber, 123.456)
        .build();

      const dataset = setThing(createSolidDataset(), thing);

      const datasetRemoved = removeTypeTriples(
        dataset,
        SCHEMA_INRUPT.familyName
      );
      const things = getThingAllOfType(datasetRemoved, LDP.BasicContainer);
      expect(things).toHaveLength(1);
      expect(
        getStringNoLocaleAll(things[0], SCHEMA_INRUPT.familyName)
      ).toHaveLength(0);
      expect(
        getStringWithLocaleAll(things[0], SCHEMA_INRUPT.familyName, "ga")
      ).toHaveLength(0);
    });
  });

  describe("Parse stream into SolidDataset", () => {
    it("should parse successfully", async () => {
      const filename =
        "resources/test/DummyData/DummyUserCredentialResource/dummy-user-credential-user-no-credentials.ttl";
      const result = await parseStreamIntoSolidDataset(
        filename,
        fs.createReadStream(filename)
      );

      expect(
        getThingOfTypeMandatoryOne(
          result.dataset,
          INRUPT_COMMON.CredentialResource
        )
      ).toBeDefined();
    });

    it("should fail if resource invalid", async () => {
      const filename =
        "resources/test/DummyData/DummyUserCredentialResource/dummy-user-credential-user-invalid-turtle.ttl";
      await expect(
        parseStreamIntoSolidDataset(filename, fs.createReadStream(filename))
      ).rejects.toThrow("Parsing error");
    });
  });

  describe("recursive delete", () => {
    it("should delete single resource, no contained resources", async () => {
      const dataset = mockSolidDatasetFrom("https://test.com/dataset");

      const spiedDeleteSolidDataset = jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            deleteSolidDataset: typeof deleteSolidDataset;
          },
          "deleteSolidDataset"
        )
        .mockResolvedValueOnce();

      await deleteRecursively(dataset);

      expect(spiedDeleteSolidDataset).toHaveBeenCalledTimes(1);
    });

    it("should remove resources recursively", async () => {
      const dataset = mockSolidDatasetFrom("https://test.com/dataset");

      const spiedDeleteSolidDataset = jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            deleteSolidDataset: typeof deleteSolidDataset;
          },
          "deleteSolidDataset"
        )
        .mockResolvedValueOnce()
        .mockResolvedValueOnce()
        .mockResolvedValueOnce();

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        )
        .mockResolvedValueOnce(dataset)
        .mockResolvedValueOnce(dataset);

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getContainedResourceUrlAll: typeof getContainedResourceUrlAll;
          },
          "getContainedResourceUrlAll"
        )
        .mockReturnValueOnce([
          "https://test.com/resource1",
          "https://test.com/resource2",
        ]);

      await deleteRecursively(dataset);

      expect(spiedDeleteSolidDataset).toHaveBeenCalledTimes(3);
    });

    it("should delete file if resource not a dataset", async () => {
      const dataset = mockSolidDatasetFrom("https://test.com/dataset");

      const spiedDeleteSolidDataset = jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            deleteSolidDataset: typeof deleteSolidDataset;
          },
          "deleteSolidDataset"
        )
        .mockResolvedValueOnce();

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getSolidDataset: typeof getSolidDataset;
          },
          "getSolidDataset"
        )
        .mockRejectedValueOnce(new Error("Not a Solid Dataset!"));

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            deleteFile: typeof deleteFile;
          },
          "deleteFile"
        )
        .mockResolvedValueOnce();

      jest
        .spyOn(
          jest.requireMock("@inrupt/solid-client") as {
            getContainedResourceUrlAll: typeof getContainedResourceUrlAll;
          },
          "getContainedResourceUrlAll"
        )
        .mockReturnValueOnce(["https://test.com/resource1"]);

      await deleteRecursively(dataset);

      expect(spiedDeleteSolidDataset).toHaveBeenCalledTimes(1);
    });
  });
});
