#!/usr/bin/env -S deno run --allow-read --allow-write=./,/Users/qwtel/Library/Caches/deno --allow-net --allow-env=HOME,DENO_AUTH_TOKENS,DENO_DIR --allow-run=git,pnpm

// ex. scripts/build_npm.ts
import { basename, extname } from "https://deno.land/std@0.133.0/path/mod.ts";
import { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts"

import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

export async function latestVersion() {
  return new TextDecoder().decode(
    await Deno.run({ cmd: ['git', 'tag', '--sort=committerdate'], stdout: 'piped' }).output()
  ).trim().split('\n').at(-1)?.replace(/^v/, '') ?? '0.0.1'
} 

export async function copyMdFiles() {
  for await (const { isFile, name } of Deno.readDir('.')) {
    if (isFile && extname(name) === '.md') {
      console.log(`[^dnt] Copying ${name}...`)
      await Deno.copyFile(name, `npm/${name}`);
    }
  }
}

export async function getDescription() {
  console.log('[^dnt] Parsing README.md...')
  const markdown = new TextDecoder().decode(await Deno.readFile('./README.md'))
  const markup = Marked.parse(markdown).content;
  const document = new DOMParser().parseFromString(markup, 'text/html')
  const description = document?.documentElement?.querySelector('p')?.textContent?.replace(/\s+/g, ' ');
  if (description) {
    console.log('[^dnt] Parsing README.md OK.')
    return description.trim()
  }
  throw Error('Couldn\'t parse description from README file')
}

export async function getGitAuthor() {
  const name = new TextDecoder().decode(await Deno.run({ cmd: ['git', 'config', '--get', 'user.name'], stdout: 'piped' }).output()).trim()
  const email = new TextDecoder().decode(await Deno.run({ cmd: ['git', 'config', '--get', 'user.email'], stdout: 'piped' }).output()).trim()
  const homepage = new TextDecoder().decode(await Deno.run({ cmd: ['git', 'config', '--get', 'user.homepage'], stdout: 'piped' }).output()).trim()
  return `${name} <${email}> ${homepage ? `(${homepage})` : ''}`.trim()
}

const gfc = new Map<string, Promise<any>>()

export function getGHData(name: string, user = '@worker-tools') {
  const url = `https://api.github.com/repos/${user}/${name}`
  return gfc.get(url) ?? gfc.set(url, (async () => {
    console.log('[^dnt] Getting data from GitHub...')
    const resp = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } })
    if (resp.ok) {
      console.log('[^dnt] Getting data from GitHub OK.')
      return await resp.json()
    } 
    throw Error('Couldn\'t reach GitHub API')
  })()).get(url)!
}

export const getGHTopics = async (name: string, user?: string) => (await getGHData(name, user)).topics;
export const getGHLicense = async (name: string, user?: string) => (await getGHData(name, user)).license?.spdx_id
export const getGHHomepage = async (name: string, user?: string) => (await getGHData(name, user)).homepage
export const getGHDescription = async (name: string, user?: string) => (await getGHData(name, user)).description

await emptyDir("./npm");

const name = basename(Deno.cwd())

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {},
  test: false,
  package: {
    // package.json properties
    name,
    version: await latestVersion(),
    description: await getDescription(),
    license: await getGHLicense(name, 'qwtel') ?? 'MIT',
    publishConfig: {
      access: "public"
    },
    author: "Florian Klampfer <mail@qwtel.com> (https://qwtel.com/)",
    repository: {
      type: "git",
      url: `git+https://github.com/qwtel/${name}.git`,
    },
    bugs: {
      url: `https://github.com/qwtel/${name}/issues`,
    },
    homepage: await getGHHomepage(name, 'qwtel') ?? `https://github.com/qwtel/${name}#readme`,
    keywords: await getGHTopics(name, 'qwtel') ?? [],
  },
  packageManager: 'pnpm',
  compilerOptions: {
    sourceMap: true,
    target: 'ES2021'
  },
  mappings: {
    "https://ghuc.cc/qwtel/typed-array-utils/index.ts": {
      name: "typed-array-utils",
      version: "^0.2.2",
    },
  },
});

// post build steps
await copyMdFiles();
