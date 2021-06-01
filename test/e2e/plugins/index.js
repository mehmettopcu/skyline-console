// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// / <reference types="cypress" />
const { getConfig } = require('../utils');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  const conf = getConfig();
  // eslint-disable-next-line no-unused-vars
  const { baseUrl, testFiles = [], translate, env = {} } = conf;
  if (baseUrl) {
    config.baseUrl = baseUrl;
  }
  if (testFiles && testFiles.length) {
    config.testFiles = testFiles;
  }
  if (translate) {
    config.env.translate = translate;
  }
  config.env = {
    ...(config.env || {}),
    ...env,
  };

  // eslint-disable-next-line global-require
  require('@cypress/code-coverage/task')(on, config);
  // eslint-disable-next-line global-require
  on('file:preprocessor', require('@cypress/code-coverage/use-babelrc'));

  return config;
};