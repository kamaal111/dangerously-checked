import { exec } from 'node:child_process';

import { message, danger, fail } from 'danger';

const updatedPythonFiles = danger.git.created_files
  .concat(danger.git.modified_files)
  .filter(filepath => filepath.endsWith('.py'));

async function main() {
  const results = await Promise.all(
    updatedPythonFiles.map(filepath => {
      return asyncExec(`just validate-param-type-set ${filepath}`);
    })
  );

  let hasFailed = false;
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    const filepath = updatedPythonFiles[index];
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
        markdown += `\n   Function: ${functionName}`;
        for (const parameterName of parameterNames) {
          markdown += `\n     Parameter: ${parameterName}`;
        }
      }
      fail(markdown);
      hasFailed += 1;
    }
  }

  if (hasFailed) {
    message('All parameters are typed');
  }
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
