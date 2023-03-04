









import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
const packageJson = require('../package.json');

import * as xml2js from 'xml2js';
import { exec, spawn } from 'child_process';
import * as child_process from 'child_process';

import { execSync } from 'child_process';

// ======================geht nicht wie gewünscht==================================


// ==================================================================================================

const updateStrategy = core.getInput('updateStrategy', { required: false }) || 'MINOR';


interface Repository {
  name: string;
  currentReleaseTag: string;
  license: string;
  sha: string;
}

interface Submodule {
  sha: string;
  submoduleName: string;
  referenceBranch: string;

}

interface NPMPackage {
  name: string;
  version: string;
  repoName: string;
  owner: string;
}




  interface NugetPackageInfo {
    project: string;
    source: string;
    packageName: string;
    currentVersion: string;
    resolvedVersion: string;
    latestVersion: string;
  }


interface Output {
  repository: Repository;
  npmPackages: NPMPackage[];
  nugetPackages: NugetPackageInfo[];
  submodules: Submodule[];
  updateStrategy: string;
}


interface NugetPackage {
  Name: string;
  Version: string;
  Source: string;
}

// interface NugetPackageInfo {
//   project: string;
//   source: string;
//   packageName: string;
//   currentVersion: string;
//   resolvedVersion: string;
//   latestVersion: string;
// };

interface PackageInfo {
  nugetName: string;
  nugetVersion: string;
  nugetSource: string
}

interface Source {
  name: string;
  value: string;
}

interface Submodule {
  sha: string;
  submoduleName: string;
  referenceBranch: string;

}


// // ===========================works ===========================================
interface NugetPackageInfo {
  project: string;
  source: string;
  packageName: string;
  currentVersion: string;
  resolvedVersion: string;
  latestVersion: string;
}


interface NPMPackageInfo {
    owner: string;
    project: string;
    source: string;
    packageName: string;
    currentVersion: string;
    wantedVersion: string;
    latestVersion: string;
  }


// =========================================


async function listNpmRegistries(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      exec('npm config get registry', (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          const registries = stdout.split('\n').filter(registry => registry.trim() !== '');
          resolve(registries);
        }
      });
    });
  }


listNpmRegistries()
.then(registries => console.log(registries))
.catch(err => console.error(err));
  

// //========================works fine=======================================


export async function runNPM(): Promise<NPMPackage[]> {
  try {
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);

    const { data: contents } = await octokit.rest.repos.getContent({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      path: 'package.json',
    });

    const packages = packageJson.dependencies;

    const packageList = Object.keys(packages).map((name) => ({
      name,
      version: packages[name],
      repoName: github.context.repo.repo,
      owner: github.context.repo.owner,
    }));

    return packageList;
  } catch (error) {
    core.setFailed("Fehler in runNPM");
    return [];
  }
}


  

//   runNPM();

// ======================================================
export async function runRepoInfo() {
  const token = core.getInput('github-token');
  const octokit = github.getOctokit(token);

  const context = github.context;
  const repo = context.payload.repository?.full_name || '';

  const branch = core.getInput('branch-name');
  const { data: commit } = await octokit.rest.repos.getCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: branch,
  });

  const output: Output = {
    repository: {
      name: repo,
      currentReleaseTag: '',
      license: '',
      sha: commit.sha,
    },
    npmPackages: [],
    nugetPackages: [],
    submodules: [],
    updateStrategy: updateStrategy,
  };
  // Get repository info
  const { data: repository } = await octokit.rest.repos.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  const dotNetProjects: string[] = await findALLCSPROJmodules();
  const ListOfSources: string[] = await getDotnetSources();

  output.repository.currentReleaseTag = repository.default_branch;
  output.repository.license = repository.license?.name || '';

  output.npmPackages = await runNPM();
  output.nugetPackages = await getOutdatedPackages(dotNetProjects, ListOfSources);
  output.submodules = await getDotnetSubmodules();
  output.updateStrategy = updateStrategy;

  // Write output to file
  const outputPath = core.getInput('output-path');
  try {
    core.info(JSON.stringify(output, null, 2))
    const ouputstring: string = JSON.stringify(output, null, 2);
    fs.writeFileSync(outputPath, ouputstring);
    fs.closeSync(fs.openSync(outputPath, 'r'));

  } catch (error) {
    core.setFailed("WriteFileSync ist falsch")
  }
}

runRepoInfo();





const FilterSources = core.getMultilineInput("nuget-source").filter(s => s.trim() !== "")

export async function getDotnetSources(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      exec('dotnet nuget list source --format short', (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr) {
          reject(stderr);
          return;
        }
  
        // Parse the output and extract the enabled source URLs
        const sources = stdout.split('\r\n')
          .map(source => source.trim())
          .filter(source => source && !source.startsWith('---') && !source.startsWith('Source') && source.startsWith('E '))
          .map(source => source.substring(2));
  
        resolve(sources);
      });
    });
  }

// =====================================================


export async function findALLCSPROJmodules(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      // Checkout the repository including submodules
      const submoduleUpdate = spawn('git', ['submodule', 'update', '--init', '--recursive']);
      submoduleUpdate.on('close', (code) => {
        if (code !== 0) {
          reject(`git submodule update exited with code ${code}`);
          return;
        }
  
        // Find all csproj files
        const find = spawn('find', ['.', '-name', '*.csproj']);
        let csprojFiles = '';
        find.stdout.on('data', (data) => {
          csprojFiles += data;
        });
        find.on('close', (code) => {
          if (code !== 0) {
            reject(`find exited with code ${code}`);
            return;
          }
  
          // Split the list of `csproj` files into an array of strings
          const csprojFileList = csprojFiles.trim().split('\n');
  
          // Output the list of `csproj` files found
          //core.info(`List of csproj files found: ${csprojFileList}`);
  
          resolve(csprojFileList);
        });
      });
    });
  }

// ===================================================================

// export async function getAllNugetPackages(projectList: string[], sourceList: string[]): Promise<NugetPackageInfo[][]> {
//     const packageInfoList: NugetPackageInfo[][] = [];
//     for (const project of projectList) {
//       const projectPackageInfoList: NugetPackageInfo[] = [];
//       for (const source of sourceList) {
//         try {
//           const output = child_process.execSync(`dotnet list ${project} package --highest-minor --outdated --source ${source}`);
//           const lines = output.toString().split("\n");
//           let packageName = "";
//           let currentVersion = "";
//           let resolvedVersion = "";
//           let latestVersion = "";
//           for (let i = 0; i < lines.length; i++) {
//             const line = lines[i];
//             if (line.startsWith(">")) {
//               const fields = line.trim().split(/\s+/);
//               packageName = fields[1];
//               currentVersion = fields[2];
//               resolvedVersion = fields[3];
//               latestVersion = fields[4];
//               projectPackageInfoList.push({
//                 project,
//                 source,
//                 packageName,
//                 currentVersion,
//                 resolvedVersion,
//                 latestVersion,
//               });
//             }
//           }
//         } catch (error) {
//           console.log(`Error listing packages for project "${project}" and source "${source}": ${error}`);
//         }
//       }
//       packageInfoList.push(projectPackageInfoList);
//     }
//     return packageInfoList;
//   }
  
export async function getOutdatedPackages(projectList: string[], sourceList: string[]): Promise<NugetPackageInfo[]> {
    const outdatedPackages: NugetPackageInfo[] = [];
  
    for (const project of projectList) {
      for (const source of sourceList) {
        try {
          const output = child_process.execSync(`dotnet list ${project} package --highest-minor --outdated --source ${source}`);
          const lines = output.toString().split('\n');
          let packageName: string = '';
          let currentVersion: string = '';
          let latestVersion: string = '';
          let resolvedVersion: string = '';
          for (const line of lines) {
            if (line.includes('Project') && line.includes('has the following updates')) {
            } else if (line.includes('>')) {
              const parts = line.split(/ +/);
              packageName = parts[1];
              packageName = parts[2];
              currentVersion = parts[3];
              resolvedVersion = parts[4];
              latestVersion = parts[5];
            }
          }
          if (packageName && currentVersion && latestVersion) {
            outdatedPackages.push({ project, source, packageName, currentVersion, resolvedVersion, latestVersion });
          }
        } catch (error: Error | any) {
          // If there is no csproj-file in the repository, skip the iteration
          if (error.message.includes('A project or solution file could not be found')) {
            continue;
          }
          // If there is another error, re-throw it
          throw error;
        }
      }
    }
  
    return outdatedPackages;
  }
  
  


  // ===================================================
//   export async function getOutdatedNpmPackages(projectList: string[], sourceList: string[]): Promise<NugetPackageInfo[]> {
//     const outdatedPackages: NugetPackageInfo[] = [];
  
//     for (const project of projectList) {
//       for (const source of sourceList) {
//         const output = child_process.execSync(`dotnet list ${project} package --highest-minor --outdated --source ${source}`);
//         const lines = output.toString().split('\n');
//         let packageName: string = '';
//         let currentVersion: string = '';
//         let latestVersion: string = '';
//         let resolvedVersion: string = '';
//         for (const line of lines) {
//           if (line.includes('Project') && line.includes('has the following updates')) {
//           } else if (line.includes('>')) {
//             const parts = line.split(/ +/);
//             packageName = parts[1];
//             packageName = parts[2];
//             currentVersion = parts[3];
//             resolvedVersion = parts[4];
//             latestVersion = parts[5];
//           }
//         }
//         if (packageName && currentVersion && latestVersion) {
//           outdatedPackages.push({ project, source, packageName, currentVersion, resolvedVersion, latestVersion });
//         }
//       }
//     }
  
//     return outdatedPackages;
//   }
  
  

  

// =====================================================

// export async function getNugetPackageListFromCsprojDoc(csprojPath: string): Promise<PackageInfo[]> {
//     const csprojXml = fs.readFileSync(csprojPath, 'utf-8');
//     const xmlParser = new xml2js.Parser();
//     let packageInfoList: PackageInfo[] = [];

//     const sources = await getDotnetSources();

//     try {
//         const csprojDoc = await xmlParser.parseStringPromise(csprojXml);

//         FilterSources.forEach(source => {
//             for (const packageRef of csprojDoc.Project.ItemGroup[0].PackageReference) {
//                 const packageName = packageRef.$.Include;
//                 const packageVersion = packageRef.$.Version;
//                 packageInfoList.push({
//                     nugetName: packageName,
//                     nugetVersion: packageVersion,
//                     nugetSource: source,
//                 });
//             }
//         })

//     } catch (e) {
//         console.log(`Could not parse .csproj file at ${csprojPath}. Error: ${e}`);
//     }

//     return packageInfoList;
// }

// =====================================================

// export async function getNugetPackagesForSource(directoryPath: string, source?: string): Promise<NugetPackage[]> {
//     const csprojPaths = await findALLCSPROJmodules();
//     const packages: NugetPackage[] = [];

//     for (const csprojPath of csprojPaths) {
//         const packageInfoList = await getNugetPackageListFromCsprojDoc(csprojPath);

//         for (const packageInfo of packageInfoList) {
//             if (!source || packageInfo.nugetSource === source) {
//                 packages.push({
//                     Name: packageInfo.nugetName,
//                     Version: packageInfo.nugetVersion,
//                     Source: packageInfo.nugetSource,
//                 });
//             }
//         }
//     }

//     return packages;
// }




export async function getDotnetSubmodules(): Promise<Submodule[]> {
    return new Promise<Submodule[]>((resolve, reject) => {
      exec('git submodule', (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr) {
          reject(stderr);
          return;
        }
  
        const submodules = stdout
          .split('\n')
          .map(submodule => submodule.trim())
          .filter(submodule => submodule !== '');
  
        const submoduleObjects: Submodule[] = submodules.map(submodule => {
          const [sha, submoduleName, referenceBranch] = submodule.split(' ');
          return { sha, submoduleName, referenceBranch: referenceBranch.slice(1, -1) };
        });
  
        resolve(submoduleObjects);
      });
    });
  }

     function fetch(apiUrl: string) {
         throw new Error('Function not implemented.');
     }