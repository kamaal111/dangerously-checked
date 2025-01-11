import { message, danger } from "danger";

const updatedPythonFiles = danger.git.created_files
  .concat(danger.git.modified_files)
  .filter((filename) => filename.endsWith(".py"));

message(
  "🐸🐸🐸 Changed Python files in this PR: \n - " +
    updatedPythonFiles.join("- ")
);
