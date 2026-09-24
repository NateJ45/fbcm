// scripts/lib/dry-run-upload.mjs
// A DRY RUN NEVER UPLOADS (2026-09-24). Page modules upload their PDFs through
// makeUploader(client).uploadFile(), which skips the network only when this
// checkout's scripts/.asset-map.json already holds the file. In a fresh
// worktree the map is empty, and a dry run used to upload quietly. Hand the
// uploader the client this returns instead: the real one under --apply, and
// otherwise a stand-in whose upload throws, naming the file, so the dry run
// fails loudly instead of writing to the dataset. First written inline in
// wedding.mjs; shared here so beliefs.mjs and blog.mjs get the same guard.

export const applying = () => process.argv.includes('--apply');

/**
 * @param {object} client  the write client from sanity-lib.mjs
 * @param {string} module  the page module's name, for the error
 * @param {string} file    the archive file path the uploader was asked for
 */
export function uploadClient(client, module, file) {
  if (applying()) return client;
  return {
    assets: {
      upload: () => {
        throw new Error(
          `${module}: "${file}" is not in scripts/.asset-map.json, and a dry run never uploads. ` +
            'Copy its file asset id from the live page (or the main checkout) into the map, ' +
            'or run with --apply to upload it once.',
        );
      },
    },
  };
}
