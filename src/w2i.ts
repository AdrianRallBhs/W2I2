import { execSync } from "child_process";
import * as fs from 'fs';

const repositoryUrl = "https://AdrianRall:^R4fJ23;GEW(github.com/AdrianRallBhs/W2I2.githttps://github.com/AdrianRallBhs/W2I2.git";

// Replace with the name of the branch you want to push to
const featureBranchName = "feature-test";

const repositoryDir = "W2I2";

const email = "adrian@asda4.de"

const name = "AdrianRallBhs" || "Adrian Rall" || "AdrianRall";

try {
 // Clone the repository
  execSync(`git clone ${repositoryUrl}`);

  process.chdir(repositoryDir);
  execSync(`git checkout ${featureBranchName}`, { shell: "/bin/bash" });

//   execSync(`git config --global user.email ${email}`);
// execSync(`git config --global user.name \"${name}\"`);

  // Run the function and write the output to a file
  const output = " Hallo "
  fs.writeFileSync("output.json", JSON.stringify(output, null, 2));

  // Ensure that the remote repository is set up correctly
  execSync(`git remote set-url origin ${repositoryUrl}`);

  // Commit and push the changes to the feature branch
  execSync(`git add .`);
  execSync(`git commit -m "Add output to output.json"`);
  execSync(`git push origin ${featureBranchName}`);
} catch (error) {
  console.error(error);
}