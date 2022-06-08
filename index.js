#!/usr/bin/env node
/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const yargsInteractive = require('yargs-interactive');
const fs = require('fs');
const { spawn } = require('child_process');
const MemoryStream = require('memorystream');
const path = require('path');

const ALLOW_EXISTING_FILES = new Set(['.git', '.gitignore', 'LICENSE', 'README.md']);
const DEFAULT_TEMPLATE = 'react';

console.log(`🔥 You're trying out Firebase, entirely on your local computer!`);
yargsInteractive()
  .usage("$0 <dir>")
  .interactive({
    dir: {
      type: "input",
      default: "./firebase-demo",
      describe: "Enter a directory to put your sample project",
      prompt: "if-no-arg"
    },
    interactive: { default: true },
  })
  .then(result => {
    init({ dir: result.dir });
  });


/**
 * Initialize a new plugin in the current folder
 */
async function init({ dir, template }) {
  template = template || DEFAULT_TEMPLATE;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const templateDir = path.resolve(__dirname, 'init-templates', template);

  process.chdir(dir);
  for (let f of fs.readdirSync('.')) {
    if (ALLOW_EXISTING_FILES.has(f)) {
      continue;
    }

    console.error(`❗️ The target directory "${dir}" isn't empty!`);
    process.exit(1);
  }

  try {
    console.log(`🐣 Cloning template in directory "${dir}"...`);
    execTemplateDir(templateDir, '.', {});
    console.log('📦 Installing npm dependencies...');
    await $('npm install --quiet', { silent: true });
    console.log(`🏃‍♂️ Starting up Firebase emulators and demo web server.`);
    $('npm start', { silent: true });
    console.log(`✅ Open these URLs in your browser:

  http://localhost:8000 (The demo app!)
  http://localhost:4000 (Firebase Emulator UI)

👀 When you're ready, check out the code in "${dir}"!
`);
  } catch (e) {
    console.error(`❗️ Error setting up the demo: ${e}`);
  }
}

/**
 * Runs a shell command with options, returns a promise.
 */
function $(cmd, options = {}) {
  let { silent, env } = options;
  return new Promise((resolve, reject) => {
    let args = cmd.split(/\s+/);
    let child;
    let memStream = silent
      ? new MemoryStream(['ErrorOutput', ' '])
      : null;
    try {
      child = spawn(args[0], args.slice(1), {
        stdio: silent
          ? ['ignore', 'ignore', 'pipe']
          : 'inherit',
        env: {
          ...process.env,
          ...(env || {}),
        }
      });
      if (silent) {
        child.stderr.pipe(memStream);
      }
    } catch (e) {
      if (silent) {
        memStream.pipe(process.stderr);
      }
      throw new Error(`Error running "${cmd}": ${e}`);
    }
    child.on('error', e => reject(`Command "${cmd}" failed (${e.toString()})`));
    child.on('exit', code => {
      if (silent && code !== 0) {
        memStream.pipe(process.stderr);
      }
      (code === 0 ? resolve : reject)(code)
    });
  });
}

/**
 * Instantiates a copy of all files in the given template directory to the
 * given output directory.
 */
function execTemplateDir(templateDir, destDir, templateVars) {
  for (let file of fs.readdirSync(templateDir)) {
    let f = path.resolve(templateDir, file);
    if (fs.statSync(f).isDirectory()) {
      let subdirDest = path.resolve(destDir, file);
      fs.mkdirSync(subdirDest);
      execTemplateDir(
        path.resolve(templateDir, file),
        subdirDest,
        templateVars)
      continue;
    }
    let s = fs.readFileSync(f, { encoding: 'utf-8' });
    s = s.replace(/%%(\w+)%%/g, (_, k) => templateVars[k] || '');
    fs.writeFileSync(path.resolve(destDir, file), s);
  }
}