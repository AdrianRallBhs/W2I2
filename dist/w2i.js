"use strict";
// import { execSync } from "child_process";
// import * as fs from 'fs';
Object.defineProperty(exports, "__esModule", { value: true });
// const repositoryUrl = "https://AdrianRall:^R4fJ23;GEW(@github.com/AdrianRallBhs/W2I2.githttps://github.com/AdrianRallBhs/W2I2.git";
// // Replace with the name of the branch you want to push to
// const featureBranchName = "feature-test";
// const repositoryDir = "W2I2";
// const email = "adrian@asda4.de"
// const name = "AdrianRallBhs" || "Adrian Rall" || "AdrianRall";
// const workflowToken = process.env.WORKFLOW_TOKEN;
// try {
//     // Clone the repository
//     if (workflowToken === "ghp") {
//         execSync(`git clone ${repositoryUrl}`);
//         process.chdir(repositoryDir);
//         execSync(`git checkout ${featureBranchName}`, { shell: "/bin/bash" });
//         execSync(`git config --global user.email ${email}`);
//         execSync(`git config --global user.name \"${name}\"`);
//         // Run the function and write the output to a file
//         const output = " Hallo "
//         fs.writeFileSync("output.json", JSON.stringify(output, null, 2));
//         // Ensure that the remote repository is set up correctly
//         execSync(`git remote set-url origin ${repositoryUrl}`);
//         // Commit and push the changes to the feature branch
//         //   execSync(`git add .`);
//         //   execSync(`git commit -m "Add output to output.json"`);
//         //   execSync(`git push origin ${featureBranchName}`);
//     }
//     else if (workflowToken === "ghs") {
//         //f
//     } else {
//         execSync(`git clone ${repositoryUrl}`);
//         process.chdir(repositoryDir);
//         execSync(`git checkout ${featureBranchName}`, { shell: "/bin/bash" });
//         execSync(`git config --global user.email ${email}`);
//         execSync(`git config --global user.name \"${name}\"`);
//         // Run the function and write the output to a file
//         const output = " Hallo "
//         fs.writeFileSync("output.json", JSON.stringify(output, null, 2));
//         // Ensure that the remote repository is set up correctly
//         execSync(`git remote set-url origin ${repositoryUrl}`);
//         // Commit and push the changes to the feature branch
//         //   execSync(`git add .`);
//         //   execSync(`git commit -m "Add output to output.json"`);
//         //   execSync(`git push origin ${featureBranchName}`);
//     }
// } catch (error) {
//     console.error(error);
// }
// import { Octokit } from "@octokit/core";
// import { createAppAuth } from "@octokit/auth-app";
// import { App } from "@octokit/app";
// import { execSync } from "child_process";
// import { runRepoInfo } from "./index";
// // Setze deine Authentifizierungsinformationen
// const token = "ghp_YOUR_PERSONAL_ACCESS_TOKEN"; // Dein GitHub Personal Access Token
// const appId = "YOUR_APP_ID"; // Die ID deiner GitHub-App
// const privateKey = `-----BEGIN PRIVATE KEY-----\n${"YOUR_APP_PRIVATE_KEY"}\n-----END PRIVATE KEY-----`; // Das private Schlüsselmaterial deiner GitHub-App
// const installationId = "YOUR_APP_INSTALLATION_ID"; // Die ID der Installation deiner GitHub-App
// // Setze die Konfiguration für das Git-Repository
// const repoUrl = "https://github.com/OWNER_USERNAME/REPO_NAME.git"; // Die URL deines GitHub-Repositorys
// const repoName = "REPO_NAME"; // Der Name deines GitHub-Repositorys
// const branchName = "feature-test"; // Der Name des Branchs, den du bearbeiten möchtest
// const commitMessage = "Dies ist ein Beispiel-Commit"; // Die Commit-Nachricht für deine Änderungen
// // Prüfe das verwendete Authentifizierungstoken
// if (token.startsWith("ghp_")) {
//   // Authentifizierung mit Personal Access Token
//   const octokit = new Octokit({ auth: token });
//   // Repository klonen
//   execSync(`git clone ${repoUrl}`);
//   // Branch wechseln
//   execSync(`cd ${repoName} && git checkout ${branchName}`);
//   // Änderungen vom Server abrufen
//   execSync(`cd ${repoName} && git pull`);
//   // Informationen über das Repository abrufen
//   const repoInfo = runRepoInfo();
//   // Änderungen hinzufügen
//   execSync(`cd ${repoName} && git add .`);
//   // Änderungen committen
//   execSync(`cd ${repoName} && git commit -m "${commitMessage}"`);
//   // Änderungen pushen
//   execSync(`cd ${repoName} && git push`);
//   // Weitere Operationen mit dem Personal Access Token durchführen
//   // ...
// } else if (token.startsWith("ghs_")) {
//   } else {
//   console.log("Ungültiger Token");
//   }
const child_process_1 = require("child_process");
const index_1 = require("./index");
// Funktion zum Klonen, Aktualisieren und Pushen des Repositories
async function updateRepository(token, repoName) {
    // Überprüfen, welcher Token-Typ verwendet wird
    let gitToken = "";
    if (token.startsWith("ghp_")) {
        gitToken = `https://${token}:x-oauth-basic@github.com`;
    }
    else if (token.startsWith("ghs_")) {
        gitToken = `https://x-access-token:${token}@github.com`;
    }
    else {
        console.log("Ungültiger Token");
        return;
    }
    const branchName = "feature-test";
    // Repository klonen
    (0, child_process_1.execSync)(`git clone ${gitToken}/${repoName}.git`);
    // In das Repository-Verzeichnis wechseln
    (0, child_process_1.execSync)(`cd ${repoName}`);
    // Sicherstellen, dass der Branch "main" verwendet wird
    (0, child_process_1.execSync)(`git checkout main`);
    // Branch "feature-test" erstellen oder zu ihm wechseln
    const createBranchCmd = `git branch ${branchName} origin/${branchName} || git checkout ${branchName}`;
    (0, child_process_1.execSync)(createBranchCmd);
    // Aktualisierungen vom Remote-Repository abrufen
    (0, child_process_1.execSync)(`git pull`);
    // Inhalt in Datei schreiben
    const fileContent = (0, index_1.runRepoInfo)();
    const fileName = "myfile.txt";
    (0, child_process_1.execSync)(`echo '${fileContent}' > ${fileName}`);
    // Änderungen hinzufügen
    (0, child_process_1.execSync)(`git add ${fileName}`);
    // Commit-Nachricht erstellen
    const commitMessage = "Aktualisiere Datei mit neuen Inhalten";
    // Änderungen committen
    (0, child_process_1.execSync)(`git commit -m "${commitMessage}"`);
    // Änderungen auf Branch "feature-test" pushen
    (0, child_process_1.execSync)(`git push origin ${branchName}`);
    // Weitere Operationen mit dem Repository durchführen
    // ...
}
// Beispielaufruf
const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
const repoName = "my-repo";
updateRepository(token, repoName);
