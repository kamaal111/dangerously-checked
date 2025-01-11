import { message, danger } from "danger";

const modifiedPythonFiles = danger.git.modified_files
  .filter((filename) => filename.endsWith(".py"))
  .join("- ");
message("🐸🐸🐸 Changed Python files in this PR: \n - " + modifiedPythonFiles);
