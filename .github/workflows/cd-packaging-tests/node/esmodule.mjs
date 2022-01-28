// Verify that imports from the main export work:
import { sampleModuleFn as mainModuleFn } from "@inrupt/etl-tutorial";
// Verify that submodule imports work:
import sampleModuleFn from "@inrupt/etl-tutorial/module";

console.log(mainModuleFn());
console.log(sampleModuleFn());
