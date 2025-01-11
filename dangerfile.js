import { exec } from 'node:child_process';

import { message, danger, fail } from 'danger';

const UPDATED_FILES = danger.git.created_files.concat(
  danger.git.modified_files
);

const HOOKS = {
  parametersSet: {
    validation: validateParameterTypesSet,
    successMessage: 'All parameters are typed',
  },
};
const HOOK_ENTRIES = Object.entries(HOOKS);

async function main() {
  const validationHooks = HOOK_ENTRIES.map(async ([key, hook]) => ({
    key,
    values: await Promise.all(UPDATED_FILES.map(hook.validation)),
  }));
  const validations = await Promise.all(validationHooks);
  const validatedValues = validations.reduce((acc, { key, values }) => {
    acc[key] = values;
    return acc;
  }, {});
  for (const [key, values] of Object.entries(validatedValues)) {
    if (validationIsValid(values)) {
      const hook = HOOKS[key];
      message(hook.successMessage);
    }
  }
}

function validationIsValid(validations) {
  validations == null ||
    validations.length === 0 ||
    validations.every(valid => valid);
}

async function validateParameterTypesSet(filepath) {
  if (!isPythonFile(filepath)) return true;

  const result = await asyncExec(`just validate-param-type-set ${filepath}`);
  const wrongFunctions = {};
  for (const { parameters, function_name: functionName } of JSON.parse(
    result
  )) {
    for (const { type_hint: typeHint, name } of parameters) {
      if (typeHint == null) {
        wrongFunctions[functionName] = wrongFunctions[functionName] ?? [];
        wrongFunctions[functionName].push(name);
      }
    }
  }

  const entries = Object.entries(wrongFunctions);
  if (entries.length > 0) {
    let markdown = `File: ${filepath} includes functions without an type hint`;
    for (const [functionName, parameterNames] of entries) {
      markdown += `\nFunction: ${functionName}`;
      for (const parameterName of parameterNames) {
        markdown += `\nParameter: ${parameterName}`;
      }
    }
    fail(markdown);
    return false;
  }

  return true;
}

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
