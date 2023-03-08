import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
const packageJson = require('../package.json');
import { promisify } from 'util';
import { exec, spawn } from 'child_process';
import * as child_process from 'child_process';


// ======================geht nicht wie gewünscht==================================


// ==================================================================================================

const updateStrategy = core.getInput('updateStrategy', { required: false }) || 'MINOR';
const sources = core.getMultilineInput('sources', { required: true }).flatMap(s => s.split(/\r?\n/)).map(s => s.trim());
const npmSources = core.getMultilineInput('npmSources', { required: false }).filter(s => s.trim() !== "");

console.log(`Sources output is : ${sources}; \n 0: ${sources[0]} \n 1: ${sources[1]}`);

interface Repository {
  orgName: any;
  repoName: string;
  currentReleaseTag: string;
  license: string;
  sha: string;
}

// interface Submodule {
//   sha: string;
//   submoduleName: string;
//   referenceBranch: string;
// }

interface Submodule {
  name: string;
  path: string;
  url: string;
  sha: string;
}



interface NugetPackageInfo {
  project: string;
  source: string;
  packageName: string;
  currentVersion: string;
  resolvedVersion: string;
  latestVersion: string;
}


interface AllNugetPackageInfo {
  project: string;
  source: string;
  packageName: string;
  currentVersion: string;
}

interface Output {
  repository: Repository;
  InternnpmPackages: PackageInfooo[];
  ExternnpmPackages: PackageInfooo[];
  //OutdatedNugetPackages: NugetPackageInfo[];
  InternNugetPackages: AllNugetPackageInfo[];
  ExternNugetPackages: AllNugetPackageInfo[];
  InternSubmodules: Submodule[];
  ExternSubmodules: Submodule[];
  updateStrategy: string;
  NugetDependencies: NugetDependentProject[];
  NpmDependencies: NpmDependentProject[];
}



// interface NugetPackageInfo {
//   project: string;
//   source: string;
//   packageName: string;
//   currentVersion: string;
//   resolvedVersion: string;
//   latestVersion: string;
// };


// interface Submodule {
//   sha: string;
//   submoduleName: string;
//   referenceBranch: string;
// }

interface Submodule {
  name: string;
  path: string;
  url: string;
  sha: string;
  organization: 'intern' | 'extern';
}


// // ===========================works ===========================================



//=========================================

import { execSync } from 'child_process';

interface PackageInfooo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  resolved: string;
}

function getPackageInfo(packageName: string): PackageInfooo | null {
  try {
    // Get package information using `npm ls` and parse JSON output
    const packageData = JSON.parse(
      execSync(`npm ls ${packageName} --depth=0 --json`).toString()
    );

    // Extract package information from parsed JSON
    const packageInfo: PackageInfooo = {
      name: packageName,
      currentVersion: packageData.dependencies[packageName].version,
      latestVersion: '',
      resolved: packageData.dependencies[packageName].resolved,
    };

    // Check if package is outdated using `npm outdated`
    const outdatedData = execSync(`npm outdated ${packageName} --json`).toString();
    const outdatedInfo = JSON.parse(outdatedData);
    if (outdatedInfo[packageName]) {
      packageInfo.latestVersion = outdatedInfo[packageName].latest;
    } else {
      packageInfo.latestVersion = packageInfo.currentVersion;
    }

    return packageInfo;
  } catch (error) {
    console.error(`Error getting information for package ${packageName}: ${error}`);
    return null;
  }
}


//   function getAllPackageInfo(): PackageInfooo[] {
//     try {
//       // Get package information using `npm ls` and parse JSON output
//       const packageData = JSON.parse(
//         execSync(`npm ls --depth=0 --json`).toString()
//       );

//       // Extract package names from parsed JSON
//       const packageNames = Object.keys(packageData.dependencies);

//       // Get package information for each package name 
//       const packageInfoList: (PackageInfooo | null)[] = packageNames.map((packageName) =>
//         getPackageInfo(packageName)
//       );

//       return packageInfoList.filter((p) => p !== null) as PackageInfooo[];
//     } catch (error) {
//       console.error(`Error getting information for all packages: ${error}`);
//       return [];
//     }
//   }

function getAllPackageInfo(): { intern: PackageInfooo[], extern: PackageInfooo[] } {
  try {
    // Get package information using `npm ls` and parse JSON output
    const packageData = JSON.parse(
      execSync(`npm ls --depth=0 --json`).toString()
    );

    // Extract package names from parsed JSON
    const packageNames = Object.keys(packageData.dependencies);

    // Get package information for each package name 
    const packageInfoList: (PackageInfooo | null)[] = packageNames.map((packageName) =>
      getPackageInfo(packageName)
    );

    const internPackages: PackageInfooo[] = [];
    const externPackages: PackageInfooo[] = [];

    if (packageInfoList != null) {
      packageInfoList.forEach((packageInfo: (PackageInfooo | null)) => {
        if (packageInfo !== null) {
          npmSources.forEach(element => {
            if (packageInfo.name === element) {
              internPackages.push(packageInfo);
            } else {
              externPackages.push(packageInfo);
            }
          })
        }
      });
    }


    return { intern: internPackages, extern: externPackages };
  } catch (error) {
    console.error(`Error getting information for all packages: ${error}`);
    return { intern: [], extern: [] };
  }
}


//==============================

//@digitalengineering/de_id_np_installdependencies: "^0 || ^1" --> wichtige dependency
//@digitalengineering/de_ls_ts_bafu_basicfunctions: "^1.2.1" --> wichtige dependency 
// both found in package-lock.json oder package.json

// bei nuget --> alle mit der Quelle "E https://nuget.github.bhs-world.com" --> diese sind dependencies

interface NugetDependentProject {
  name: string;
  currentVersion: string;
}
interface NpmDependentProject {
  name: string;
  currentVersion: string;
}

import { Octokit } from "@octokit/rest";
const token = core.getInput("github-token");

const octokit = new Octokit({
  auth: token,
});

//Hier werden alle Repositories aufgelistet, 
//die das Repository "test-repo" als Abhängigkeit in ihrer 
//package.json- oder project.json-Datei angegeben haben.


//===========================  

interface NPMPackageSource {
  name: string;
  currentVersion: string;
  source: string;
}

async function getAllPackages(): Promise<NPMPackageSource[]> {
  try {
    const { stdout } = await exec('npm ls --json --depth=0 --parseable');
    const dependencies = packageJson.dependencies;
    const packageList = Object.keys(dependencies).map((name) => ({
      name,
      currentVersion: dependencies[name],
      source: packageJson._resolved.split(':')[0],
    }));
    return packageList;
  } catch (error) {
    console.error(`Failed to get packages: ${error}`);
    return [];
  }
}




// ========================================


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

findALLCSPROJmodules()
  .then(result => console.log(result))
  .catch(err => console.log(err));

getDotnetSources()
  .then(result => console.log(result))
  .catch(err => console.log(err));



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
      orgName: context.repo.owner,
      repoName: repo,
      currentReleaseTag: '',
      license: '',
      sha: commit.sha,
    },
    InternnpmPackages: [],
    ExternnpmPackages: [],
   // OutdatedNugetPackages: [],
    InternNugetPackages: [],
    ExternNugetPackages: [],
    InternSubmodules: [],
    ExternSubmodules: [],
    updateStrategy: updateStrategy,
    NugetDependencies: [],
    NpmDependencies: []
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
  // const packageInfoList = getAllPackageInfo();
  // console.log(`New bla bla package info list: ${JSON.stringify(packageInfoList, null, 2)}`)
  output.InternnpmPackages = await getAllPackageInfo().intern;
  output.ExternnpmPackages = await getAllPackageInfo().extern;
  // output.OutdatedNugetPackages = await getOutdatedPackages(dotNetProjects, ListOfSources);
  output.InternNugetPackages = await (await getAllNuGetPackages(dotNetProjects, ListOfSources)).intern;
  output.ExternNugetPackages = await (await getAllNuGetPackages(dotNetProjects, ListOfSources)).extern;
  output.InternSubmodules = await (await getSubmodules()).intern;
  output.ExternSubmodules = await (await getSubmodules()).extern;
  output.updateStrategy = updateStrategy;
  output.NugetDependencies = await getDependentProjects(output.InternNugetPackages);
  output.NpmDependencies = await getNpmDependentProjects(output.ExternnpmPackages);

  console.log(`DependentProjects: ${JSON.stringify(getDependentProjects, null, 2)}`);
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

async function getSubmodules(): Promise<{intern: Submodule[], extern: Submodule[]}> {
    const output = execSync('git submodule status --recursive');
    const submoduleLines = output.toString().split('\n');

    const submodules: Submodule[] = [];

    submoduleLines.forEach((line) => {
      if (line.length > 0) {
        const parts = line.trim().split(/ +/);
        const sha = parts[0];
        const url = parts[1];
        const name = url.split('/').slice(-1)[0].replace(/.git$/, '');
        const path = parts[2];
        submodules.push({
          name, path, url, sha,
          organization: 'extern'
        });
      }
    });

const internSubmodule: Submodule[] = [];
const externSubmodule: Submodule[] = [];

submodules.forEach((submodule) => {
  if (submodule.organization == 'extern') {
    externSubmodule.push(submodule);
  } else {
    internSubmodule.push(submodule)
  }
})

    return {intern: internSubmodule, extern: externSubmodule};
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


// export async function getDotnetSubmodules(): Promise<Submodule[]> {
//   return new Promise<Submodule[]>((resolve, reject) => {
//     exec('git submodule', (error, stdout, stderr) => {
//       if (error) {
//         reject(error);
//         return;
//       }
//       if (stderr) {
//         reject(stderr);
//         return;
//       }

//       const submodules = stdout
//         .split('\n')
//         .map(submodule => submodule.trim())
//         .filter(submodule => submodule !== '');

//       const submoduleObjects: Submodule[] = submodules.map(submodule => {
//         const [sha, submoduleName, referenceBranch] = submodule.split(' ');
//         return { sha, submoduleName, referenceBranch: referenceBranch.slice(1, -1) };
//       });

//       resolve(submoduleObjects);
//     });
//   });
// }

//======================funktioniert =============================
export async function getOutdatedPackages(projectList: string[], sourceList: string[]): Promise<NugetPackageInfo[]> {
  const outdatedPackages: NugetPackageInfo[] = [];

  for (const project of projectList) {
    for (const source of sourceList) {
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
    }
  }

  return outdatedPackages;
}

// async function getAllNuGetPackages(projectList: string[], sourceList: string[]): Promise<AllNugetPackageInfo[]> {
//   const allPackages: AllNugetPackageInfo[] = [];

//   for (const project of projectList) {
//     for (const source of sourceList) {
//       const output = child_process.execSync(`dotnet list ${project} package --source ${source}`);
//       const lines = output.toString().split('\n');
//       let packageName: string = '';
//       let currentVersion: string = '';
//       for (const line of lines) {
//         if (line.includes('Project')) {
//         } else if (line.includes('>')) {
//           const parts = line.split(/ +/);
//           packageName = parts[2];
//           currentVersion = parts[3];
//           allPackages.push({ project, source, packageName, currentVersion });
//         }
//       }
//     }
//   }

//   return allPackages;
// }


async function getAllNuGetPackages(projectList: string[], sourceList: string[]): Promise<{intern: AllNugetPackageInfo[], extern: AllNugetPackageInfo[]}> {
  const allPackages: AllNugetPackageInfo[] = [];

  for (const project of projectList) {
    for (const source of sourceList) {
      const output = child_process.execSync(`dotnet list ${project} package --source ${source}`);
      const lines = output.toString().split('\n');
      let packageName: string = '';
      let currentVersion: string = '';
      for (const line of lines) {
        if (line.includes('Project')) {
        } else if (line.includes('>')) {
          const parts = line.split(/ +/);
          packageName = parts[2];
          currentVersion = parts[3];
          allPackages.push({ project, source, packageName, currentVersion });
        }
      }
    }
  }

  const internPackages: AllNugetPackageInfo[] = [];
  const externPackages: AllNugetPackageInfo[] = [];

  const s = new Set(sources);


    allPackages.forEach((packageInfo) => {
      sources.forEach(element => {
        const isInternal = element.search(packageInfo.project);
        const bo = convertToBool(isInternal);
    
        console.log(`isInternal2 has value ${convertToBool(isInternal)}`);
        console.log(`sources has value ${sources[0]} and packageInfo is ${ packageInfo.project}`);
        //const isInternal = sources.includes(packageInfo.project);
        if (bo) {
          internPackages.push(packageInfo);
        } else {
          externPackages.push(packageInfo);
        }
      });
        
      //const isInternal2 = packageInfo.project === './Blazor4/BlazorApp4/BlazorApp4/BlazorApp4.csproj'
      //const isInternal2 = sources[0].search(packageInfo.project); //=== './Blazor4/BlazorApp4/BlazorApp4/BlazorApp4.csproj'
      
  
})
  

  return {intern: internPackages, extern: externPackages};
}

function convertToBool(input: number) {
  if(input == 1) {
    return true;
  }
  else {
    return false;
  }
}


function getDependentProjects(allNugetPackages: AllNugetPackageInfo[]): NugetDependentProject[] {
  const dependentProjects: NugetDependentProject[] = [];

  for (const nugetPackage of allNugetPackages) {
    //https://api.nuget.org/v3/index.json
    //https://nuget.github.bhs-world.com
    sources.forEach(element => {
      if (nugetPackage.source.match(element)) {
        dependentProjects.push({
          name: nugetPackage.packageName,
          currentVersion: nugetPackage.currentVersion,
        });
      }
    })
    
  }

  return dependentProjects;
}

function getNpmDependentProjects(InternnpmPackages: PackageInfooo[]): NpmDependentProject[] {
  const dependentProjects: NpmDependentProject[] = [];

  for (const npmPackage of InternnpmPackages) {
    //@digitalengineering
    //https://nuget.github.bhs-world.com
    //@actions/core
    npmSources.forEach(element => {
      if (npmPackage.name.match(element)) {
        dependentProjects.push({
          name: npmPackage.name,
          currentVersion: npmPackage.currentVersion,
        });
      }
    })
    
  }

  return dependentProjects;
}