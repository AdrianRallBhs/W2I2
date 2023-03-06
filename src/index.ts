import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
const packageJson = require('../package.lock.json');
import { promisify } from 'util';
import { exec, spawn } from 'child_process';
import * as child_process from 'child_process';


// ======================geht nicht wie gewünscht==================================


// ==================================================================================================

const updateStrategy = core.getInput('updateStrategy', { required: false }) || 'MINOR';


interface Repository {
    orgName: any;
    repoName: string;
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
    //current version
    currentVersion: string;
    repoName: string;
    orgName: string;
}

interface NPMPacko {
    orgName: string;
    repoName: string;
    name: string;
    currentVersion: string;
    latestVersion: string;
}


// interface NPMPackage {
//     orgName: string;
//     repoName: string;
//     source: string;
//     packageName: string;
//     currentVersion: string;
//     latestVersion: string;
//   }




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
    npmPackages: NPMPacko[];
    nugetPackages: NugetPackageInfo[];
    submodules: Submodule[];
    updateStrategy: string;
    dependendencies: DependentProject[];
}


interface NugetPackage {
    Name: string;
    currentVersion: string;
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
    nugetCurrentVersion: string;
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
    orgName: string;
    project: string;
    source: string;
    packageName: string;
    currentVersion: string;
    wantedVersion: string;
    latestVersion: string;
}


// =========================================


interface NPMPackageSmall {
    name: string;
    currentVersion: string;
}


//=========================================


//==============================

interface DependentProject {
    name: string;
    owner: string;
}

import { Octokit } from "@octokit/rest";
const token = core.getInput("github-token");

const octokit = new Octokit({
    auth: token,
});

//Hier werden alle Repositories aufgelistet, 
//die das Repository "test-repo" als Abhängigkeit in ihrer 
//package.json- oder project.json-Datei angegeben haben.

async function getDependentProjects(repository: Repository): Promise<DependentProject[]> {
    const query = `depends on:${repository.orgName}/${repository.repoName}`;
    const { data } = await octokit.search.repos({ q: query });
    return data.items.map((item) => ({ name: item.name, owner: repository.orgName }));
}
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


getAllPackages()
    .then(packageList => console.log(packageList))
    .catch(err => console.error(err))


async function getLatestVersions(packageList: string[]): Promise<string[]> {
    const latestVersions: string[] = [];

    for (const packageName of packageList) {
        const command = `npm show ${packageName} version`;
        const latestVersion = await execCommand(command);

        latestVersions.push(`${packageName}: ${latestVersion}`);
    }

    return latestVersions;
}

async function execCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else if (stderr) {
                reject(stderr);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

let list = ['@actions/core', '@actions/github']
getLatestVersions(list)
    .then(latestVersions => console.log(latestVersions))
    .catch(err => console.error(err));



// =========================================
export async function getAllPackos(): Promise<NPMPacko[]> {
    const packageJson = require('../package.lock.json');
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);

    const { data: contents } = await octokit.rest.repos.getContent({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            path: 'package.lock.json',
    });

    const packages = packageJson.dependencies;
    const packageList: NPMPacko[] = [];

    for (const name in packages) {
        const currentVersion = packages[name];
        packageList.push({
            orgName: github.context.repo.owner,
            repoName: github.context.repo.repo, 
            name,
            currentVersion,
            latestVersion: '',
        });
    }
    return getLatestVersions(packageList.map(pkg => pkg.name))
        .then(latestVersions => {
            latestVersions.forEach((latestVersion, index) => {
                packageList[index].latestVersion = latestVersion;
            });
            return packageList;
        })
        .catch(err => {
            console.error('Error getting latest versions', err);
            return packageList;
        });
}


// getAllPackos()
//     .then((packos) => console.log(packos))
//     .catch((err) => console.error(err));


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


// //========================works fine=======================================

const semver = require('semver');
const execAsync = promisify(exec);



export async function runNPM(): Promise<NPMPackage[]> {
    try {
        const token = core.getInput('github-token');
        const octokit = github.getOctokit(token);

        const { data: contents } = await octokit.rest.repos.getContent({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            path: 'package.lock.json',
        });

        const packages = packageJson.dependencies;

        const packageList = Object.keys(packages).map((name) => ({
            name,
            currentVersion: packages[name],
            repoName: github.context.repo.repo,
            orgName: github.context.repo.owner,
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
            orgName: context.repo.owner,
            repoName: repo,
            currentReleaseTag: '',
            license: '',
            sha: commit.sha,
        },
        npmPackages: [],
        nugetPackages: [],
        submodules: [],
        updateStrategy: updateStrategy,
        dependendencies: [],
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

    output.npmPackages = await getAllPackos();
    output.nugetPackages = await getOutdatedPackages(dotNetProjects, ListOfSources);
    output.submodules = await getDotnetSubmodules();
    output.updateStrategy = updateStrategy;
    output.dependendencies = await getDependentProjects(output.repository);

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
                const errorMessage = error.stderr.toString().trim();
                if (errorMessage.includes('A project or solution file could not be found')) {
                    continue;
                } else {
                    throw new Error(`Error while checking outdated packages in project ${project} and source ${source}: ${errorMessage}`);
                }
            }
        }
    }

    return outdatedPackages;
}

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
