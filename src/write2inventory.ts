import * as fs from "fs";
import * as path from "path";
import { runRepoInfo } from "./index";

// Set the path to the local repository with the feature branch - <PATH_TO_LOCAL_REPOSITORY>
const repoPath = "https://github.com/AdrianRallBhs/submarine";

// Set the name of the feature branch - <FEATURE_BRANCH_NAME>
const branchName = "feature-test";

// Set the path to the file where you want to write the result of runRepoInfo function - <PATH_TO_FILE_IN_FEATURE_BRANCH>
const filePath = "README.md";

// Get the result of runRepoInfo function
const result = runRepoInfo();

// Write the result to a file
fs.writeFileSync(path.join(repoPath, filePath), JSON.stringify(result, null, 2));

// Commit the changes
const { exec } = require("child_process");
exec(`cd ${repoPath} && git add ${filePath} && git commit -m "Add result of runRepoInfo function"`, (err: any, stdout: any, stderr: any) => {
    if (err) {
        console.log(`Error committing changes: ${err}`);
        return;
    }
    console.log(`Changes committed: ${stdout}`);
});

// Push the changes to the remote repository
exec(`cd ${repoPath} && git push origin ${branchName}`, (err: any, stdout: any, stderr: any) => {
    if (err) {
        console.log(`Error pushing changes: ${err}`);
        return;
    }
    console.log(`Changes pushed: ${stdout}`);
});
