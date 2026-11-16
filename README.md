# meteor-dockerfile-action

GitHub Action that generates a multistage `Dockerfile` for building a Meteor application. The Node.js version of the runtime stage is derived from the Meteor version.

## Usage

```yaml
- uses: org/meteor-dockerfile-action@v2
  with:
    node-patch-image: registry.example.com/org/node:{node}-alpine-patched
    ca-cert: certs/extra-ca.pem
```

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `meteor-version` | | Meteor version. Overrides `meteor-release-file`. |
| `meteor-release-file` | `./.meteor/release` | Path to the Meteor release file. |
| `docker-file` | `./Dockerfile` | Path of the generated Dockerfile. |
| `node-patch-image` | | Image providing a patched `node` binary at `/node`. `{node}` is replaced by the resolved Node.js version. Empty means no patch. |
| `context` | `.` | Docker build context directory. `ca-cert` is resolved against it, so it must match the `context` of your `docker build`. |
| `ca-cert` | | Path of a PEM file with extra CA certificates, relative to the build context. Empty means none. |

## Patched Node.js

When `node-patch-image` is set, the generated Dockerfile adds a stage from that image and copies its `/node` over `/usr/local/bin/node` in the runtime stage. A `RUN test` line fails the build if the binary's version differs from the one resolved from the Meteor version.

The image must exist for every resolved Node.js version, otherwise the build fails on the missing tag. Use a fixed tag instead of `{node}` to pin a single image.

## Extra CA certificates

When `ca-cert` is set, the generated Dockerfile copies that file to `/etc/ssl/extra/ca.pem` in the runtime stage and sets `NODE_EXTRA_CA_CERTS` to it. Node.js then trusts those roots in addition to its bundled store, which fixes `self signed certificate in certificate chain` errors against hosts whose root CA is newer than the Node.js release (typical for end-of-life Node.js). To trust several CAs, concatenate them in one PEM file.

The path is relative to `context` and must stay inside it (no absolute path, no `..`, no symlink escaping it). Every certificate in the file must parse as a valid PEM certificate, and the file must not contain a private key, otherwise the action fails. The destination in the image is fixed, whatever the file is called. Commit only public certificates.

## Development

```sh
npm install
npm run lint
npm run build
```

Commit `dist/` with every change: the action runs `dist/index.js`.
