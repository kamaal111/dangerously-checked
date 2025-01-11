import { exec } from 'node:child_process';

import { message, danger } from 'danger';

const updatedPythonFiles = danger.git.created_files
  .concat(danger.git.modified_files)
  .filter(filepath => filepath.endsWith('.py'));

async function main() {
  const results = await Promise.all(
    updatedPythonFiles.map(filepath => {
      return asyncExec(`just validate-param-type-set ${filepath}`);
    })
  );

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    const filepath = updatedPythonFiles[index];

    message(`${filepath}\n${JSON.parse(result)}`);
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
