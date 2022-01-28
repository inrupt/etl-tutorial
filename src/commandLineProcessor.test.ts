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

// The need to include these guys is a known issue with JOSE
// See: https://github.com/inrupt/solid-client-authn-js/blob/main/tests/environment/customEnvironment.js
// And then you can tell Jest to use this environment instead of the default
// jest-dom :
// https://github.com/inrupt/solid-client-authn-js/blob/main/packages/browser/jest.config.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
global.TextEncoder = require("util").TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-var-requires
global.TextDecoder = require("util").TextDecoder;

// We need to pull in the above code before these imports...
// eslint-disable-next-line import/first
import processCommandLine from "./commandLineProcessor";
// eslint-disable-next-line import/first
import * as runEtlModule from "./runEtl";

describe("Command line argument handling", () => {
  describe("Run ETL command", () => {
    it("should succeed", async () => {
      const mockExit = jest.spyOn(process, "exit").mockImplementation();
      jest.spyOn(runEtlModule, "runEtl").mockResolvedValue(0);

      const filename = "some-dummy-filename.yml";
      const validArguments = [
        "runEtl",
        "--etlCredentialResource",
        "resources/test/DummyData/DummyRegisteredAppCredentialResource/dummy-registered-app-credential-resource.ttl",
        "--localUserCredentialResourceGlob",
        filename,
      ];

      const response = await processCommandLine(false, validArguments);
      expect(response._).toHaveLength(1);
      expect(response.localUserCredentialResourceGlob).toEqual(filename);
      expect(mockExit).toHaveBeenCalledWith(0);

      // Call again to exercise our debug namespace being picked up this 2nd
      // time around (first call should have enabled it).
      await processCommandLine(false, validArguments);
    });

    it("should run in quiet mode", async () => {
      jest.spyOn(runEtlModule, "runEtl").mockResolvedValue(0);
      const filename = "some-dummy-filename.yml";
      const response = await processCommandLine(false, [
        "runEtl",
        "--etlCredentialResource",
        "etlCredential.ttl",
        "--localUserCredentialResourceGlob",
        filename,
        "--quiet",
      ]);
      expect(response._).toHaveLength(1);
      expect(response.localUserCredentialResourceGlob).toEqual(filename);
    });

    it("should throw if no command", async () => {
      await expect(() => processCommandLine(false, [])).rejects.toThrow(
        "one command is expected"
      );
    });

    it("should throw if command is a number", async () => {
      await expect(() => processCommandLine(false, ["666"])).rejects.toThrow(
        "but we got the number [666]"
      );
    });

    it("should throw if invalid command", async () => {
      await expect(() =>
        processCommandLine(false, ["Unknown-command"])
      ).rejects.toThrow("Unknown command");
    });

    it("should log an error", async () => {
      jest
        .spyOn(runEtlModule, "runEtl")
        .mockRejectedValue(new Error("An error from runEtl..."));
      const filename = "some-dummy-filename.yml";

      await expect(() =>
        processCommandLine(false, [
          "runEtl",
          "--etlCredentialResource",
          "etlCredential.ttl",
          "--localUserCredentialResourceGlob",
          filename,
        ])
      ).rejects.toThrow("Error running ETL: [An error from runEtl...]");
    });
  });
});
