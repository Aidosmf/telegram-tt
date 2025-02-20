/* eslint-disable @typescript-eslint/comma-dangle */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable quote-props */
/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * For running tests: "npx tsx src/lib/temark/parse.test.tsx"
 */

import { writeFileSync } from 'fs';

import { parse } from './parse';

const input = `# Link

__*bold*__
`;

const ast = parse(input, { tokens: false });

writeFileSync('ast.json', JSON.stringify(ast, undefined, 2));
