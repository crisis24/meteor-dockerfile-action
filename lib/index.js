"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
try {
    const dockerFile = core.getInput('docker-file');
    core.debug(`docker-file: ${dockerFile}`);
    let release = core.getInput('meteor-version');
    core.debug(`meteor-version: ${release}`);
    if (!release) {
        const releaseFile = core.getInput('meteor-release-file');
        core.debug(`meteor-release-file: ${releaseFile}`);
        if (!releaseFile) {
            throw new Error('Meteor version missing');
        }
        const releaseFile_ = '' + fs.readFileSync(releaseFile);
        const m = releaseFile_.match(/^METEOR@([\d\.]+)/);
        if (m && m[1])
            release = m && m[1];
    }
    const METEOR_VERSION = release;
    // https://github.com/disney/meteor-base/blob/master/test.sh#L59
    const NODE_VERSION = METEOR_VERSION.match(/^1\.[678]\./) ? '8' : '12';
    const NPM_PACKAGE_TOKEN = '${NPM_PACKAGE_TOKEN}';
    const EXTRA_PACKAGES = '${EXTRA_PACKAGES}';
    const TEMPLATE = `FROM geoffreybooth/meteor-base:${METEOR_VERSION} as builder
ARG NPM_PACKAGE_TOKEN
ARG EXTRA_PACKAGES
COPY ./package*.json ./.npmrc $APP_SOURCE_FOLDER/
RUN echo "//npm.pkg.github.com/:_authToken=${NPM_PACKAGE_TOKEN}" > ~/.npmrc && bash $SCRIPTS_FOLDER/build-app-npm-dependencies.sh
COPY . $APP_SOURCE_FOLDER/
RUN bash $SCRIPTS_FOLDER/build-meteor-bundle.sh

FROM node:${NODE_VERSION}-alpine
ENV APP_BUNDLE_FOLDER /opt/bundle
ENV SCRIPTS_FOLDER /docker
RUN apk --no-cache --virtual .node-gyp-compilation-dependencies add g++ make python && apk --no-cache add bash ca-certificates ${EXTRA_PACKAGES}
COPY --from=builder $SCRIPTS_FOLDER $SCRIPTS_FOLDER/
COPY --from=builder $APP_BUNDLE_FOLDER/bundle $APP_BUNDLE_FOLDER/bundle
RUN bash $SCRIPTS_FOLDER/build-meteor-npm-dependencies.sh && apk del .node-gyp-compilation-dependencies
ENTRYPOINT ["/docker/entrypoint.sh"]
CMD ["node", "main.js"]
EXPOSE 3000`;
    core.info(`METEOR_VERSION = ${METEOR_VERSION}`);
    core.info(`NODE_VERSION = ${NODE_VERSION}`);
    core.info(``);
    core.info(TEMPLATE);
    fs.writeFileSync(dockerFile, TEMPLATE);
}
catch (error) {
    core.setFailed(error.message);
}
//# sourceMappingURL=index.js.map