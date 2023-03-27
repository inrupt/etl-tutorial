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

export const APPLICATION_VENDOR_NAME = "inrupt";
export const APPLICATION_NAME = "etl-tutorial";
export const APPLICATION_LABEL = "ETL Tutorial";

export const APPLICATION_ENTRYPOINT = `private/${APPLICATION_VENDOR_NAME}/${APPLICATION_NAME}/`;

// This value is optional for new ETL processes. The idea is that some ETL
// processes can be run multiple, independent times to populate a single Pod.
// This value can simply be left empty if it's not needed, but if a value is
// provided, it should be truncated with a slash to ensure it represents a
// container.
export const APPLICATION_FIRST_LEVEL_OF_HIERARCHY = "";

export const HOBBY_SOURCE_FILE =
  "resources/test/DummyData/DummyDataSource/DummyHobby/TestUser-Hobby-Skydive.json";
