/* eslint-disable @typescript-eslint/comma-dangle */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable quote-props */
/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * For running tests: "npx tsx src/lib/temark/parse.test.tsx"
 * The output will be written to the file src/lib/temark/ast-test-result-file.json
 *
 * TODO: config JEST with a snapshot test or unit tests
 */

import { writeFileSync } from 'fs';

import { parse } from './parse';

const input = `# Link

[link - text](https://example.com/)

<a href="https://telegram.org/" class="text-entity-link" dir="auto">link html</a>

# Image

![image-alt](https://picsum.photos/id/237/200/300)

<img src="https://picsum.photos/id/237/200/300" alt="image html alt">

# Strike

~~strike double tilda~~

~text~

<del>strike html (del)</del>

# Strong (**bold**)

__bold double underscore__

<b>bold tag</b>

**bold2 doulbe star**

# Emphasis (__italic__)

_italic single underscore_

*italic single star*

<em></em>

# Underline (~~strike~~)

<u>underline html (u)</u>

<span style="text-decoration: underline;">underline html (style)</span>

<ins>underline html (ins)</ins>

# html

<custom>custom html</custom>

<b>
  <em>
    <u>
      <ins>
        <a href="https://telegram.org/" class="text-entity-link" dir="auto">link html</a>
        <img src="https://picsum.photos/id/237/200/300" alt="image html alt">
      </ins>
    </u>
  </em>
</b>

<div>broken html closing tag/div></div>

# Blockquote

> blockquote line 1
text line 2
text line 3

> blockquote single line

>>> blockquote nested

> blockquote 1
> blockquote 2

# Text

paragraph

line1
line2

# Code \`test\`

\`inline code\`

\`inline code line1
inline code line2\`

\`\`\`inline code\`\`\`

\`\`\`js
console.log();
\`\`\`

\`\`\`python
  print()
\`\`\`

\`inline code

with space\`

\`inbalance inline code 1\`\`\`

\`\`\`inbalance inline code 2\`\

<pre>
         \\   ^__^
          \\  (oo)\\_______
             (__)\\       )\\/\\
                 ||----w |
                 ||     ||
</pre>

# Mixed

Lorem Ipsum is simply dummy _text_ of the printing and typesetting industry.
Lorem Ipsum has been the industry's ~**__standard__**~ dummy text ever since the 1500s,
when an [unknown](https://example.com/) printer took a galley of \`type\` and scrambled it to make a type specimen book

# Broken HTML

textwithstar*

*starwithtext

**textstaritalic*

*staritalictext**

__textunderscoreitalic_

_underscoreitalictext__

_text

text_

<div broken open html tag<div>
`;

// const input2 = `__**s**__`;
const nodes = parse(input);

const filePath = './src/lib/temark/ast-test-result-file.json';
writeFileSync(filePath, JSON.stringify(nodes, undefined, 2));
