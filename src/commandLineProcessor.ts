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
import yargs, { Arguments } from "yargs";

import { runEtl } from "./runEtl";
import { APPLICATION_NAME } from "./applicationConstant";

const debug = debugModule(`${APPLICATION_NAME}:commandLineProcessor`);

const COMMAND_RUN_ETL = "runEtl";
const SUPPORTED_COMMANDS = [COMMAND_RUN_ETL];

function validateCommandLine(argv: Arguments) {
  // argv._ contains the commands passed to the program.
  if (argv._.length !== 1) {
    // Only one command is expected.
    const message = `Exactly one command is expected (got [${
      argv._.length
    }], [${argv._.toString()}]), expected one of [${SUPPORTED_COMMANDS}]. (Ensure wildcard file patterns are enclosed in double-quotes!)`;
    debug(message);
    throw new Error(message);
  }

  if (typeof argv._[0] === "number") {
    const message = `Invalid command: command must be a string, but we got the number [${argv._[0]}]. Expected one of [${SUPPORTED_COMMANDS}].`;
    debug(message);
    throw new Error(message);
  }

  if (SUPPORTED_COMMANDS.indexOf(argv._[0]) === -1) {
    const message = `Unknown command: [${argv._[0]}] is not a recognized command. Expected one of [${SUPPORTED_COMMANDS}].`;
    debug(message);
    throw new Error(message);
  }

  return true;
}

function configureLog(argv: Arguments) {
  // Unless specifically told to be quiet (i.e. no logging output, although that
  // will still be overridden by the DEBUG environment variable!), then
  // determine if any application-specific namespaces have been enabled. If they
  // haven't been, then turn them all on.
  if (!argv.quiet) {
    // Retrieve all currently enabled debug namespaces (and then restore them!).
    const namespaces = debugModule.disable();
    debugModule.enable(namespaces);

    // Unless our debug logging has been explicitly configured, turn all
    // debugging on.
    if (namespaces.indexOf("etl") === -1) {
      debugModule.enable("etl-tutorial:*");
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function processCommandLine<T>(
  exitOnFail: boolean,
  commandLineArgs: string | ReadonlyArray<string>
  // TODO: This is a kinda ridiculous 'fix', but using the return type from `yargs.parse()` fails,
  //  so just using the actual return type as described by the TS error.
  // ): { [key in keyof Arguments<T>]: Arguments<T>[key] } {
): Promise<{
  [x: string]: unknown;
  localUserCredentialResourceGlob: unknown;
  outputDirectory: string;
  quiet: boolean;
  _: (string | number)[];
  $0: string;
}> {
  return (
    yargs
      .exitProcess(exitOnFail)
      .command(
        COMMAND_RUN_ETL,
        "Runs the ETL process to populate Solid Pods, and/or a triplestore.",
        (yargsInner) =>
          yargsInner
            .alias("e", "etlCredentialResource")
            .describe(
              "etlCredentialResource",
              "A glob pattern for local RDF resources containing user credentials for the 3rd-party APIs to ETL from."
            )

            .alias("l", "localUserCredentialResourceGlob")
            .describe(
              "localUserCredentialResourceGlob",
              "A glob pattern for local RDF resources containing user credentials for the 3rd-party APIs to ETL from."
            )

            .alias("i", "localUserCredentialResourceGlobIgnore")
            .describe(
              "localUserCredentialResourceGlobIgnore",
              "A comma-separated list of local RDF resources to ignore."
            )

            .alias("o", "outputDirectory")
            .describe(
              "outputDirectory",
              "The output directory for the generated ETL report (defaults to the current directory)."
            )
            .default("outputDirectory", ".")

            .demandOption([
              "localUserCredentialResourceGlob",
              "etlCredentialResource",
            ]),
        async (argv) => {
          configureLog(argv);
          try {
            const exitCode = await runEtl(argv);
            process.exit(exitCode);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            throw new Error(`Error running ETL: [${error.message}]`);
          }
        }
      )
      // The following options are shared between the different commands
      .alias("q", "quiet")
      .boolean("quiet")
      .describe(
        "quiet",
        `If set will not display logging output to console (but you can still use the DEBUG environment variable, set to 'etl-tutorial:*').`
      )
      .default("quiet", false)
      .check(validateCommandLine)
      .help()
      .parse(commandLineArgs)
  );
}
