"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importDefault(require("@actions/core"));
const fs_1 = __importDefault(require("fs"));
try {
    const dockerFile = core_1.default.getInput('docker-file');
    core_1.default.debug(`docker-file: ${dockerFile}`);
    let release = core_1.default.getInput('meteor-version');
    core_1.default.debug(`meteor-version: ${release}`);
    if (!release) {
        const releaseFile = core_1.default.getInput('meteor-release-file');
        core_1.default.debug(`meteor-release-file: ${releaseFile}`);
        if (!releaseFile) {
            throw new Error('Meteor version missing');
        }
        const releaseFile_ = '' + fs_1.default.readFileSync(releaseFile);
        const m = releaseFile_.match(/^METEOR@([\d\.]+)/);
        if (m && m[1])
            release = m && m[1];
    }
    const METEOR_VERSION = release;
    // https://github.com/disney/meteor-base/blob/master/test.sh#L59
    const NODE_VERSION = METEOR_VERSION.match(/^1\.[678]\./) ? '8' : '12';
    const NPM_PACKAGE_TOKEN = '${NPM_PACKAGE_TOKEN}';
    const TEMPLATE = `FROM geoffreybooth/meteor-base:${METEOR_VERSION} as builder
ARG NPM_PACKAGE_TOKEN
COPY ./package*.json ./.npmrc $APP_SOURCE_FOLDER/
RUN echo "//npm.pkg.github.com/:_authToken=${NPM_PACKAGE_TOKEN}" > ~/.npmrc && bash $SCRIPTS_FOLDER/build-app-npm-dependencies.sh
COPY . $APP_SOURCE_FOLDER/
RUN bash $SCRIPTS_FOLDER/build-meteor-bundle.sh

FROM node:${NODE_VERSION}-alpine
ENV APP_BUNDLE_FOLDER /opt/bundle
ENV SCRIPTS_FOLDER /docker
RUN apk --no-cache --virtual .node-gyp-compilation-dependencies add g++ make python && apk --no-cache add bash ca-certificates
COPY --from=builder $SCRIPTS_FOLDER $SCRIPTS_FOLDER/
COPY --from=builder $APP_BUNDLE_FOLDER/bundle $APP_BUNDLE_FOLDER/bundle
RUN bash $SCRIPTS_FOLDER/build-meteor-npm-dependencies.sh && apk del .node-gyp-compilation-dependencies
ENTRYPOINT ["/docker/entrypoint.sh"]
CMD ["node", "main.js"]
EXPOSE 3000`;
    core_1.default.info(`METEOR_VERSION = ${METEOR_VERSION}`);
    core_1.default.info(`NODE_VERSION = ${NODE_VERSION}`);
    core_1.default.info(``);
    core_1.default.info(TEMPLATE);
    fs_1.default.writeFileSync(dockerFile, TEMPLATE);
}
catch (error) {
    core_1.default.setFailed(error.message);
}
//# sourceMappingURL=index.js.map