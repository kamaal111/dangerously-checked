'use strict';

import { exec } from 'node:child_process';

import { message, danger, fail } from 'danger';

const UPDATED_FILES = danger.git.created_files.concat(
  danger.git.modified_files
);

const VALIDATION_HOOKS = {
  parametersSet: {
    validation: validateParameterTypesSet,
    successMessage: '✅ All parameters are typed',
  },
};
const VALIDATION_HOOK_ENTRIES = Object.entries(VALIDATION_HOOKS);

async function main() {
  const validationHooks = VALIDATION_HOOK_ENTRIES.map(async ([key, hook]) => ({
    key,
    values: await Promise.all(UPDATED_FILES.map(hook.validation)),
  }));
  const validations = await Promise.all(validationHooks);
  const validatedValues = validations.reduce((acc, { key, values }) => {
    return { ...acc, [key]: values };
  }, /** @type {Record<string, boolean[]>} */ ({}));
  for (const [key, values] of Object.entries(validatedValues)) {
    const isValid = validationIsValid(values);
    if (isValid) {
      const hook = VALIDATION_HOOKS[key];
      message(hook.successMessage);
    }
  }
}

function validationIsValid(validations) {
  for (const value of validations ?? []) {
    if (!value) return false;
  }

  return true;
}
/**
 * Validate whether all function parameters have type hints defined
 * @param {string} filepath Where the file that will be validated is located
 * @returns {boolean} Returns true when the file is valid, otherwise will return false
 */
async function validateParameterTypesSet(filepath) {
  if (!isPythonFile(filepath)) return true;

  /**
   * Represents a function parameter.
   * @typedef {Object} Parameter
   * @property {string|null} type_hint - The type hint of the parameter, or `null` if not provided.
   * @property {string} name - The name of the parameter.
   */

  /**
   * Represents a function with its parameters.
   * @typedef {Object} FunctionData
   * @property {Parameter[]} parameters - The list of parameters for the function.
   * @property {string} function_name - The name of the function.
   */

  /**
   * The result of the `just validate-param-type-set` command.
   * @type {string}
   */
  const result = await asyncExec(`just validate-param-type-set ${filepath}`);

  /**
   * Parsed result of the `just validate-param-type-set` command.
   * @type {FunctionData[]}
   */
  const parsedData = JSON.parse(result);

  /**
   * A mapping of function names to parameters with missing type hints.
   * @type {Object<string, string[]>}
   */
  const wrongFunctions = {};
  for (const { parameters, function_name: functionName } of parsedData) {
    for (const { type_hint: typeHint, name } of parameters) {
      if (typeHint == null) {
        wrongFunctions[functionName] = wrongFunctions[functionName] ?? [];
        wrongFunctions[functionName].push(name);
      }
    }
  }

  const entries = Object.entries(wrongFunctions);
  if (entries.length === 0) return true;

  let markdown = `File: ${filepath} includes functions without an type hint`;
  for (const [functionName, parameterNames] of entries) {
    markdown += `\nFunction: ${functionName}`;
    for (const parameterName of parameterNames) {
      markdown += `\nParameter: ${parameterName}`;
    }
  }
  fail(markdown, filepath);
  return false;
}

/**
 * @param {string} filepath
 * @returns {boolean}
 */
function isPythonFile(filepath) {
  return filepath.endsWith('.py');
}

async function asyncExec(command, options = null) {
  return await new Promise((resolve, reject) => {
    exec(command, options ?? {}, (error, stdout, stderr) => {
      if (error != null) {
        reject(error);
        return;
      }

      if (stderr !== '') {
        reject(stderr);
        return;
      }

      resolve(stdout);
    });
  });
}

main();
