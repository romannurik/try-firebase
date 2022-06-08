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

const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ALLOW_EXISTING_FILES = new Set(['.git', '.gitignore', 'LICENSE', 'README.md']);
const DEFAULT_TEMPLATE = 'vanilla';

yargs
  .command(['init <dir>', '$0'], 'Start a test', yargs => {
    yargs.option('template', {
      description: 'template',
      choices: ['', 'react', 'vanilla'],
      default: '',
      alias: 't',
    });
  }, init)
  .help()
  .argv;

/**
 * Initialize a new plugin in the current folder
 */
async function init({ dir, template }) {
  if (!template) {
    template = DEFAULT_TEMPLATE;
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // const templateDir = path.resolve(__dirname, 'init-templates', template);
  // const templateCommandDir = path.resolve(templateDir, 'command-template');

  process.chdir(dir);
  for (let f of fs.readdirSync('.')) {
    if (ALLOW_EXISTING_FILES.has(f)) {
      continue;
    }

    console.error(`❗️ The target directory "${dir}" isn't empty!`);
    process.exit(1);
  }

  const templateRepo = 'https://github.com/romannurik/try-firebase-demo';

  try {
    console.log(`🐣 Setting up template in directory "${dir}"...`);
    await $(`git clone ${templateRepo} .`);
    console.log('📦 Installing dependencies...');
    await $('npm install');
    console.log(`📦 Starting up Firebase emulators and demo web server.`);
    await $('npm start');
  // 🔧 To start up after you're done:
  
  //     $ cd ${dir}
  //     $ npm start
  // `);
  } catch (e) {
    console.error(`❗️ Error setting up the demo environment: ${e}`);
  }
}

/**
 * Runs a shell command with options, returns a promise.
 */
function $(cmd) {
  return new Promise((resolve, reject) => {
    let args = cmd.split(/\s+/);
    let child;
    try {
      child = spawn(args[0], args.slice(1), {
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: 8000,
        }
      });
    } catch (e) {
      throw new Error(`Error running "${cmd}"`);
    }
    child.on('error', e => reject(`Command "${cmd}" failed (${e.toString()})`));
    child.on('exit', code => {
      (code === 0 ? resolve : reject)(code)
    });
  });
}
