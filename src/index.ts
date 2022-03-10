import * as core from '@actions/core';
import * as fs from 'fs';

const nodeVersions = [
  { meteor: '2.6.1', node: '14.18.3', docker: 'geoffreybooth' },
  { meteor: '2.6', node: '14.18.3', docker: 'geoffreybooth' },
  { meteor: '2.5.6', node: '14.18.3', docker: 'geoffreybooth' },
  { meteor: '2.5.3', node: '14.18.2', docker: 'crisis24' },
  { meteor: '2.5', node: '14.18.1', docker: 'geoffreybooth' },
  { meteor: '2.4.1', node: '14.17.6', docker: 'geoffreybooth' },
  { meteor: '2.4', node: '14.17.6', docker: 'geoffreybooth' },
  { meteor: '2.3.6', node: '14.17.6', docker: 'geoffreybooth' },
  { meteor: '2.3.5', node: '14.17.5', docker: 'geoffreybooth' },
  { meteor: '2.3.4', node: '14.17.4', docker: 'geoffreybooth' },
  { meteor: '2.3.3', node: '14.17.4', docker: 'geoffreybooth' },
  { meteor: '2.3.2', node: '14.17.3', docker: 'geoffreybooth' },
  { meteor: '2.3.1', node: '14.17.3', docker: 'geoffreybooth' },
  { meteor: '2.3', node: '14.17.1', docker: 'geoffreybooth' },
  { meteor: '2.2.1', node: '12.22.2', docker: 'geoffreybooth' },
  { meteor: '2.2', node: '12.22.1', docker: 'geoffreybooth' },
  { meteor: '2.1', node: '12.22.1', docker: 'geoffreybooth' },
  { meteor: '2.0', node: '12.22.1', docker: 'geoffreybooth' },
  { meteor: '1.12', node: '12.22.1', docker: 'geoffreybooth' },
  { meteor: '1.11', node: '12.22.1', docker: 'geoffreybooth' },
  { meteor: '1.10', node: '12.22.1', docker: 'geoffreybooth' },
  { meteor: '1.9', node: '12.22.1', docker: 'geoffreybooth' },
  { meteor: '1.8', node: '8.17.0', docker: 'geoffreybooth' },
  { meteor: '1.7', node: '8.17.0', docker: 'geoffreybooth' },
  { meteor: '1.6', node: '8.17.0', docker: 'geoffreybooth' },
];

try {
  const dockerFile = core.getInput('docker-file');
  core.debug(`docker-file: ${dockerFile}`);

  let release = core.getInput('meteor-version');
  core.debug(`meteor-version: ${release}`);
  if (!release) {
    const releaseFile = core.getInput('meteor-release-file');
    core.debug(`meteor-release-file: ${releaseFile}`);
    if (!releaseFile) throw new Error('Meteor version missing');
    const releaseFile_ = '' + fs.readFileSync(releaseFile);
    const m = releaseFile_.match(/^METEOR@([\d.]+)/);
    if (m && m[1]) release = m && m[1];
  }

  const METEOR_VERSION = release;
  const match = nodeVersions.find((conf) => METEOR_VERSION.startsWith(conf.meteor)) || nodeVersions[0];
  const DOCKER_ACCOUNT = match.docker;
  const NODE_IMAGE = `${match.node}-alpine`;

  const NPM_PACKAGE_TOKEN = '${NPM_PACKAGE_TOKEN}';
  const METEOR_PACKAGE_DIRS = '${METEOR_PACKAGE_DIRS}';
  const EXTRA_PACKAGES = '${EXTRA_PACKAGES}';

  const TEMPLATE = `FROM ${DOCKER_ACCOUNT}/meteor-base:${METEOR_VERSION} as builder
ARG NPM_PACKAGE_TOKEN
ARG METEOR_PACKAGE_DIRS
ENV METEOR_PACKAGE_DIRS=${METEOR_PACKAGE_DIRS}
COPY ./package*.json ./.npmrc $APP_SOURCE_FOLDER/
RUN echo "//npm.pkg.github.com/:_authToken=${NPM_PACKAGE_TOKEN}" > ~/.npmrc && bash $SCRIPTS_FOLDER/build-app-npm-dependencies.sh
COPY . $APP_SOURCE_FOLDER/
RUN bash $SCRIPTS_FOLDER/build-meteor-bundle.sh

FROM node:${NODE_IMAGE}
ARG EXTRA_PACKAGES
ENV APP_BUNDLE_FOLDER /opt/bundle
ENV SCRIPTS_FOLDER /docker
ENV NODE_ENV production
RUN apk --no-cache --virtual .node-gyp-compilation-dependencies add g++ make python3 && apk --no-cache add bash ca-certificates ${EXTRA_PACKAGES}
COPY --from=builder $SCRIPTS_FOLDER $SCRIPTS_FOLDER/
COPY --from=builder $APP_BUNDLE_FOLDER/bundle $APP_BUNDLE_FOLDER/bundle
RUN bash $SCRIPTS_FOLDER/build-meteor-npm-dependencies.sh && apk del .node-gyp-compilation-dependencies
ENTRYPOINT ["/docker/entrypoint.sh"]
CMD ["node", "main.js"]
EXPOSE 3000`;

  core.info(`METEOR_VERSION = ${METEOR_VERSION}`);
  core.info(`NODE_VERSION = ${NODE_IMAGE}`);
  core.info(``);
  core.info(TEMPLATE);

  fs.writeFileSync(dockerFile, TEMPLATE);
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message);
}
