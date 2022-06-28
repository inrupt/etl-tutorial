# Changelog

This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

The following changes have been implemented but not released yet:

## [Unreleased]

### New features

- Handle empty address values in UK Companies House responses.
- Created a 'Public API response' resource folder.
- Removed TestCafe and dependencies (as it wasn't used, and was causing npm
  warnings on install).
- Added Hobby vocabs.
- New util function to find mandatory Thing of specific type from resource
  collection.
- Added Hobby vocabs and ETL.
- Added util functions for describing a collection of resources.
- Updated to treat resources as SolidDatasets instead of just Things.
- Add passport photo image as a Blob to Pod.
- Wired up ETL container resources so that they all link up properly when viewed
  and navigated to from the WebID IRI in a triplestore.
- Fixed Hobby resource IRI to remove trailing slash (making it look like a
  Container).

## [0.0.1] - 2022-02-01

Initial creation.
