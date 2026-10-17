// Keeps src/version.ts in step with package.json after `changeset version`.
const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');
fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'version.ts'),
  `// Written by scripts/write-version.js after \`changeset version\`; keep in step with package.json.\nexport const version = '${version}';\n`
);
