import { exec } from 'node:child_process';

import { message, danger } from 'danger';

const updatedPythonFiles = danger.git.created_files
  .concat(danger.git.modified_files)
  .filter(filepath => filepath.endsWith('.py'));

async function main() {
  const result = await Promise.all(
    updatedPythonFiles.map(filepath =>
      asyncExec(`just validate-param-type-set ${filepath}`)
    )
  );

  console.log('result', result);

  message(
    '🐸🐸🐸 Changed Python files in this PR: \n - ' +
      updatedPythonFiles.join('- ') +
      result
  );
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
