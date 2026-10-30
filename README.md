# meteor-dockerfile-action

GitHub Action that generates a multistage `Dockerfile` for building a Meteor application. The Node.js version of the runtime stage is derived from the Meteor version.

## Usage

```yaml
- uses: org/meteor-dockerfile-action@v2
  with:
    node-patch-image: registry.example.com/org/node:{node}-alpine-patched
```

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `meteor-version` | | Meteor version. Overrides `meteor-release-file`. |
| `meteor-release-file` | `./.meteor/release` | Path to the Meteor release file. |
| `docker-file` | `./Dockerfile` | Path of the generated Dockerfile. |
| `node-patch-image` | | Image providing a patched `node` binary at `/node`. `{node}` is replaced by the resolved Node.js version. Empty means no patch. |

## Patched Node.js

When `node-patch-image` is set, the generated Dockerfile adds a stage from that image and copies its `/node` over `/usr/local/bin/node` in the runtime stage. A `RUN test` line fails the build if the binary's version differs from the one resolved from the Meteor version.

The image must exist for every resolved Node.js version, otherwise the build fails on the missing tag. Use a fixed tag instead of `{node}` to pin a single image.

## Development

```sh
npm install
npm run lint
npm run build
```

Commit `dist/` with every change: the action runs `dist/index.js`.
