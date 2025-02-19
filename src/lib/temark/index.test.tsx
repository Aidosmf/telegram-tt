/* eslint-disable @typescript-eslint/comma-dangle */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable quote-props */
/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * For running tests: "npx tsx src/lib/temark/index.test.tsx"
 */

import { strictEqual } from 'assert';
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

# Strong (bold)

__bold double underscore__

<b>bold tag</b>

**bold2 doulbe star**

# Emphasis (italic)

_italic single underscore_

*italic single star*

<em></em>

# Underline

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

# Code

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

\`\`\`inbalance inline code 1\`\`

\`inbalance inline code 2\`\`\`

<pre>
         \\   ^__^
          \\  (oo)\\_______
             (__)\\       )\\/\\
                 ||----w |
                 ||     ||
</pre>

# Mixed

__* bold and italic*__

_** italic and bold**_

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

const expectedTokens = [
  {
    "type": "Heading",
    "value": "# Link",
    "position": {
      "start": {
        "line": 1,
        "column": 1,
        "offset": 0
      },
      "end": {
        "line": 1,
        "column": 7,
        "offset": 6
      }
    },
    "range": [
      0,
      6
    ],
    "depth": 1
  },
  {
    "type": "Link",
    "value": "[link - text](https://example.com/)",
    "position": {
      "start": {
        "line": 3,
        "column": 3,
        "offset": 8
      },
      "end": {
        "line": 3,
        "column": 36,
        "offset": 43
      }
    },
    "range": [
      8,
      43
    ]
  },
  {
    "type": "Html",
    "value": "<a href=\"https://telegram.org/\" class=\"text-entity-link\" dir=\"auto\">link html</a>",
    "position": {
      "start": {
        "line": 5,
        "column": 1,
        "offset": 45
      },
      "end": {
        "line": 5,
        "column": 82,
        "offset": 126
      }
    },
    "range": [
      45,
      126
    ],
    "tagName": "a",
    "isVoidElement": false
  },
  {
    "type": "Heading",
    "value": "# Image",
    "position": {
      "start": {
        "line": 7,
        "column": 1,
        "offset": 128
      },
      "end": {
        "line": 7,
        "column": 8,
        "offset": 135
      }
    },
    "range": [
      128,
      135
    ],
    "depth": 1
  },
  {
    "type": "Image",
    "value": "![image-alt](https://picsum.photos/id/237/200/300)",
    "position": {
      "start": {
        "line": 9,
        "column": 1,
        "offset": 137
      },
      "end": {
        "line": 9,
        "column": 51,
        "offset": 187
      }
    },
    "range": [
      137,
      187
    ]
  },
  {
    "type": "Html",
    "value": "<img src=\"https://picsum.photos/id/237/200/300\" alt=\"image html alt\">",
    "position": {
      "start": {
        "line": 11,
        "column": 1,
        "offset": 189
      },
      "end": {
        "line": 11,
        "column": 69,
        "offset": 257
      }
    },
    "range": [
      189,
      257
    ],
    "tagName": "img",
    "isVoidElement": true
  },
  {
    "type": "Heading",
    "value": "# Strike",
    "position": {
      "start": {
        "line": 13,
        "column": 1,
        "offset": 260
      },
      "end": {
        "line": 13,
        "column": 9,
        "offset": 268
      }
    },
    "range": [
      260,
      268
    ],
    "depth": 1
  },
  {
    "type": "Strike",
    "value": "strike double tilda",
    "position": {
      "start": {
        "line": 15,
        "column": 1,
        "offset": 270
      },
      "end": {
        "line": 15,
        "column": 24,
        "offset": 293
      }
    },
    "range": [
      270,
      293
    ]
  },
  {
    "type": "Text",
    "value": "~text~",
    "position": {
      "start": {
        "line": 17,
        "column": 1,
        "offset": 295
      },
      "end": {
        "line": 17,
        "column": 7,
        "offset": 301
      }
    },
    "range": [
      295,
      301
    ]
  },
  {
    "type": "Html",
    "value": "<del>strike html (del)</del>",
    "position": {
      "start": {
        "line": 19,
        "column": 1,
        "offset": 303
      },
      "end": {
        "line": 19,
        "column": 29,
        "offset": 331
      }
    },
    "range": [
      303,
      331
    ],
    "tagName": "del",
    "isVoidElement": false
  },
  {
    "type": "Heading",
    "value": "# Strong (bold)",
    "position": {
      "start": {
        "line": 21,
        "column": 1,
        "offset": 333
      },
      "end": {
        "line": 21,
        "column": 16,
        "offset": 348
      }
    },
    "range": [
      333,
      348
    ],
    "depth": 1
  },
  {
    "type": "Strong",
    "value": "bold double underscore",
    "position": {
      "start": {
        "line": 23,
        "column": 1,
        "offset": 350
      },
      "end": {
        "line": 23,
        "column": 27,
        "offset": 376
      }
    },
    "range": [
      350,
      376
    ]
  },
  {
    "type": "Html",
    "value": "<b>bold tag</b>",
    "position": {
      "start": {
        "line": 25,
        "column": 1,
        "offset": 378
      },
      "end": {
        "line": 25,
        "column": 16,
        "offset": 393
      }
    },
    "range": [
      378,
      393
    ],
    "tagName": "b",
    "isVoidElement": false
  },
  {
    "type": "Strong",
    "value": "bold2 doulbe star",
    "position": {
      "start": {
        "line": 27,
        "column": 1,
        "offset": 395
      },
      "end": {
        "line": 27,
        "column": 22,
        "offset": 416
      }
    },
    "range": [
      395,
      416
    ]
  },
  {
    "type": "Heading",
    "value": "# Emphasis (italic)",
    "position": {
      "start": {
        "line": 29,
        "column": 1,
        "offset": 418
      },
      "end": {
        "line": 29,
        "column": 20,
        "offset": 437
      }
    },
    "range": [
      418,
      437
    ],
    "depth": 1
  },
  {
    "type": "Emphasis",
    "value": "italic single underscore",
    "position": {
      "start": {
        "line": 31,
        "column": 1,
        "offset": 439
      },
      "end": {
        "line": 31,
        "column": 27,
        "offset": 465
      }
    },
    "range": [
      439,
      465
    ]
  },
  {
    "type": "Emphasis",
    "value": "italic single star",
    "position": {
      "start": {
        "line": 33,
        "column": 1,
        "offset": 467
      },
      "end": {
        "line": 33,
        "column": 21,
        "offset": 487
      }
    },
    "range": [
      467,
      487
    ]
  },
  {
    "type": "Html",
    "value": "<em></em>",
    "position": {
      "start": {
        "line": 35,
        "column": 1,
        "offset": 489
      },
      "end": {
        "line": 35,
        "column": 10,
        "offset": 498
      }
    },
    "range": [
      489,
      498
    ],
    "tagName": "em",
    "isVoidElement": false
  },
  {
    "type": "Heading",
    "value": "# Underline",
    "position": {
      "start": {
        "line": 37,
        "column": 1,
        "offset": 500
      },
      "end": {
        "line": 37,
        "column": 12,
        "offset": 511
      }
    },
    "range": [
      500,
      511
    ],
    "depth": 1
  },
  {
    "type": "Html",
    "value": "<u>underline html (u)</u>",
    "position": {
      "start": {
        "line": 39,
        "column": 1,
        "offset": 513
      },
      "end": {
        "line": 39,
        "column": 26,
        "offset": 538
      }
    },
    "range": [
      513,
      538
    ],
    "tagName": "u",
    "isVoidElement": false
  },
  {
    "type": "Html",
    "value": "<span style=\"text-decoration: underline;\">underline html (style)</span>",
    "position": {
      "start": {
        "line": 41,
        "column": 1,
        "offset": 540
      },
      "end": {
        "line": 41,
        "column": 72,
        "offset": 611
      }
    },
    "range": [
      540,
      611
    ],
    "tagName": "span",
    "isVoidElement": false
  },
  {
    "type": "Html",
    "value": "<ins>underline html (ins)</ins>",
    "position": {
      "start": {
        "line": 43,
        "column": 1,
        "offset": 613
      },
      "end": {
        "line": 43,
        "column": 32,
        "offset": 644
      }
    },
    "range": [
      613,
      644
    ],
    "tagName": "ins",
    "isVoidElement": false
  },
  {
    "type": "Heading",
    "value": "# html",
    "position": {
      "start": {
        "line": 45,
        "column": 1,
        "offset": 646
      },
      "end": {
        "line": 45,
        "column": 7,
        "offset": 652
      }
    },
    "range": [
      646,
      652
    ],
    "depth": 1
  },
  {
    "type": "Html",
    "value": "<custom>custom html</custom>",
    "position": {
      "start": {
        "line": 47,
        "column": 1,
        "offset": 654
      },
      "end": {
        "line": 47,
        "column": 29,
        "offset": 682
      }
    },
    "range": [
      654,
      682
    ],
    "tagName": "custom",
    "isVoidElement": false
  },
  {
    "type": "Html",
    "value": "<b>\n  <em>\n    <u>\n      <ins>\n        <a href=\"https://telegram.org/\" class=\"text-entity-link\" dir=\"auto\">link html</a>\n        <img src=\"https://picsum.photos/id/237/200/300\" alt=\"image html alt\">\n      </ins>\n    </u>\n  </em>\n</b>",
    "position": {
      "start": {
        "line": 49,
        "column": 1,
        "offset": 684
      },
      "end": {
        "line": 49,
        "column": 234,
        "offset": 917
      }
    },
    "range": [
      684,
      917
    ],
    "tagName": "b",
    "isVoidElement": false
  },
  {
    "type": "Html",
    "value": "<div>broken html closing tag/div></div>",
    "position": {
      "start": {
        "line": 60,
        "column": 1,
        "offset": 919
      },
      "end": {
        "line": 60,
        "column": 40,
        "offset": 958
      }
    },
    "range": [
      919,
      958
    ],
    "tagName": "div",
    "isVoidElement": false
  },
  {
    "type": "Heading",
    "value": "# Blockquote",
    "position": {
      "start": {
        "line": 62,
        "column": 1,
        "offset": 960
      },
      "end": {
        "line": 62,
        "column": 13,
        "offset": 972
      }
    },
    "range": [
      960,
      972
    ],
    "depth": 1
  },
  {
    "type": "Blockquote",
    "value": "> blockquote line 1",
    "position": {
      "start": {
        "line": 64,
        "column": 1,
        "offset": 974
      },
      "end": {
        "line": 64,
        "column": 20,
        "offset": 993
      }
    },
    "range": [
      974,
      993
    ]
  },
  {
    "type": "Text",
    "value": "text line 2",
    "position": {
      "start": {
        "line": 65,
        "column": 1,
        "offset": 994
      },
      "end": {
        "line": 65,
        "column": 12,
        "offset": 1005
      }
    },
    "range": [
      994,
      1005
    ]
  },
  {
    "type": "Text",
    "value": "text line 3",
    "position": {
      "start": {
        "line": 66,
        "column": 1,
        "offset": 1006
      },
      "end": {
        "line": 66,
        "column": 12,
        "offset": 1017
      }
    },
    "range": [
      1006,
      1017
    ]
  },
  {
    "type": "Blockquote",
    "value": "> blockquote single line",
    "position": {
      "start": {
        "line": 68,
        "column": 1,
        "offset": 1019
      },
      "end": {
        "line": 68,
        "column": 25,
        "offset": 1043
      }
    },
    "range": [
      1019,
      1043
    ]
  },
  {
    "type": "Blockquote",
    "value": ">>> blockquote nested",
    "position": {
      "start": {
        "line": 70,
        "column": 1,
        "offset": 1045
      },
      "end": {
        "line": 70,
        "column": 22,
        "offset": 1066
      }
    },
    "range": [
      1045,
      1066
    ]
  },
  {
    "type": "Blockquote",
    "value": "> blockquote 1",
    "position": {
      "start": {
        "line": 72,
        "column": 1,
        "offset": 1068
      },
      "end": {
        "line": 72,
        "column": 15,
        "offset": 1082
      }
    },
    "range": [
      1068,
      1082
    ]
  },
  {
    "type": "Blockquote",
    "value": "> blockquote 2",
    "position": {
      "start": {
        "line": 73,
        "column": 1,
        "offset": 1083
      },
      "end": {
        "line": 73,
        "column": 15,
        "offset": 1097
      }
    },
    "range": [
      1083,
      1097
    ]
  },
  {
    "type": "Heading",
    "value": "# Text",
    "position": {
      "start": {
        "line": 75,
        "column": 1,
        "offset": 1099
      },
      "end": {
        "line": 75,
        "column": 7,
        "offset": 1105
      }
    },
    "range": [
      1099,
      1105
    ],
    "depth": 1
  },
  {
    "type": "Text",
    "value": "paragraph",
    "position": {
      "start": {
        "line": 77,
        "column": 1,
        "offset": 1107
      },
      "end": {
        "line": 77,
        "column": 10,
        "offset": 1116
      }
    },
    "range": [
      1107,
      1116
    ]
  },
  {
    "type": "Text",
    "value": "line1",
    "position": {
      "start": {
        "line": 79,
        "column": 1,
        "offset": 1118
      },
      "end": {
        "line": 79,
        "column": 6,
        "offset": 1123
      }
    },
    "range": [
      1118,
      1123
    ]
  },
  {
    "type": "Text",
    "value": "line2",
    "position": {
      "start": {
        "line": 80,
        "column": 1,
        "offset": 1124
      },
      "end": {
        "line": 80,
        "column": 6,
        "offset": 1129
      }
    },
    "range": [
      1124,
      1129
    ]
  },
  {
    "type": "Heading",
    "value": "# Code",
    "position": {
      "start": {
        "line": 82,
        "column": 1,
        "offset": 1131
      },
      "end": {
        "line": 82,
        "column": 7,
        "offset": 1137
      }
    },
    "range": [
      1131,
      1137
    ],
    "depth": 1
  },
  {
    "type": "InlineCode",
    "value": "inline code",
    "position": {
      "start": {
        "line": 84,
        "column": 1,
        "offset": 1139
      },
      "end": {
        "line": 84,
        "column": 14,
        "offset": 1152
      }
    },
    "range": [
      1139,
      1152
    ]
  },
  {
    "type": "InlineCode",
    "value": "inline code line1\ninline code line2",
    "position": {
      "start": {
        "line": 86,
        "column": 1,
        "offset": 1154
      },
      "end": {
        "line": 87,
        "column": 19,
        "offset": 1191
      }
    },
    "range": [
      1154,
      1191
    ]
  },
  {
    "type": "InlineCode",
    "value": "inline code",
    "position": {
      "start": {
        "line": 89,
        "column": 1,
        "offset": 1193
      },
      "end": {
        "line": 89,
        "column": 18,
        "offset": 1210
      }
    },
    "range": [
      1193,
      1210
    ]
  },
  {
    "type": "Code",
    "value": "js\nconsole.log();\n",
    "position": {
      "start": {
        "line": 91,
        "column": 1,
        "offset": 1212
      },
      "end": {
        "line": 93,
        "column": 4,
        "offset": 1236
      }
    },
    "range": [
      1212,
      1236
    ]
  },
  {
    "type": "Code",
    "value": "python\n  print()\n",
    "position": {
      "start": {
        "line": 95,
        "column": 1,
        "offset": 1238
      },
      "end": {
        "line": 97,
        "column": 4,
        "offset": 1261
      }
    },
    "range": [
      1238,
      1261
    ]
  },
  {
    "type": "InlineCode",
    "value": "inline code\n\nwith space",
    "position": {
      "start": {
        "line": 99,
        "column": 1,
        "offset": 1263
      },
      "end": {
        "line": 101,
        "column": 12,
        "offset": 1288
      }
    },
    "range": [
      1263,
      1288
    ]
  },
  {
    "type": "Text",
    "value": "```inbalance inline code 1``",
    "position": {
      "start": {
        "line": 103,
        "column": 1,
        "offset": 1290
      },
      "end": {
        "line": 103,
        "column": 29,
        "offset": 1318
      }
    },
    "range": [
      1290,
      1318
    ]
  },
  {
    "type": "Text",
    "value": "`inbalance inline code 2```",
    "position": {
      "start": {
        "line": 105,
        "column": 1,
        "offset": 1320
      },
      "end": {
        "line": 105,
        "column": 28,
        "offset": 1347
      }
    },
    "range": [
      1320,
      1347
    ]
  },
  {
    "type": "Html",
    "value": "<pre>\n         \\   ^__^\n          \\  (oo)\\_______\n             (__)\\       )\\/\\\n                 ||----w |\n                 ||     ||\n</pre>",
    "position": {
      "start": {
        "line": 107,
        "column": 1,
        "offset": 1349
      },
      "end": {
        "line": 107,
        "column": 141,
        "offset": 1489
      }
    },
    "range": [
      1349,
      1489
    ],
    "tagName": "pre",
    "isVoidElement": false
  },
  {
    "type": "Heading",
    "value": "# Mixed",
    "position": {
      "start": {
        "line": 115,
        "column": 1,
        "offset": 1491
      },
      "end": {
        "line": 115,
        "column": 8,
        "offset": 1498
      }
    },
    "range": [
      1491,
      1498
    ],
    "depth": 1
  },
  {
    "type": "Strong",
    "value": "* bold and italic*",
    "position": {
      "start": {
        "line": 117,
        "column": 1,
        "offset": 1500
      },
      "end": {
        "line": 117,
        "column": 23,
        "offset": 1522
      }
    },
    "range": [
      1500,
      1522
    ]
  },
  {
    "type": "Emphasis",
    "value": "** italic and bold**",
    "position": {
      "start": {
        "line": 119,
        "column": 1,
        "offset": 1524
      },
      "end": {
        "line": 119,
        "column": 23,
        "offset": 1546
      }
    },
    "range": [
      1524,
      1546
    ]
  },
  {
    "type": "Heading",
    "value": "# Broken HTML",
    "position": {
      "start": {
        "line": 121,
        "column": 1,
        "offset": 1548
      },
      "end": {
        "line": 121,
        "column": 14,
        "offset": 1561
      }
    },
    "range": [
      1548,
      1561
    ],
    "depth": 1
  },
  {
    "type": "Text",
    "value": "textwithstar*",
    "position": {
      "start": {
        "line": 123,
        "column": 1,
        "offset": 1563
      },
      "end": {
        "line": 123,
        "column": 14,
        "offset": 1576
      }
    },
    "range": [
      1563,
      1576
    ]
  },
  {
    "type": "Text",
    "value": "*starwithtext",
    "position": {
      "start": {
        "line": 125,
        "column": 1,
        "offset": 1578
      },
      "end": {
        "line": 125,
        "column": 14,
        "offset": 1591
      }
    },
    "range": [
      1578,
      1591
    ]
  },
  {
    "type": "Emphasis",
    "value": "*textstaritalic",
    "position": {
      "start": {
        "line": 127,
        "column": 1,
        "offset": 1593
      },
      "end": {
        "line": 127,
        "column": 16,
        "offset": 1608
      }
    },
    "range": [
      1593,
      1608
    ]
  },
  {
    "type": "Emphasis",
    "value": "staritalictext*",
    "position": {
      "start": {
        "line": 129,
        "column": 1,
        "offset": 1612
      },
      "end": {
        "line": 129,
        "column": 18,
        "offset": 1629
      }
    },
    "range": [
      1612,
      1629
    ]
  },
  {
    "type": "Emphasis",
    "value": "_textunderscoreitalic",
    "position": {
      "start": {
        "line": 131,
        "column": 1,
        "offset": 1631
      },
      "end": {
        "line": 131,
        "column": 22,
        "offset": 1652
      }
    },
    "range": [
      1631,
      1652
    ]
  },
  {
    "type": "Emphasis",
    "value": "underscoreitalictext_",
    "position": {
      "start": {
        "line": 133,
        "column": 1,
        "offset": 1656
      },
      "end": {
        "line": 133,
        "column": 24,
        "offset": 1679
      }
    },
    "range": [
      1656,
      1679
    ]
  },
  {
    "type": "Text",
    "value": "_text",
    "position": {
      "start": {
        "line": 135,
        "column": 1,
        "offset": 1681
      },
      "end": {
        "line": 135,
        "column": 6,
        "offset": 1686
      }
    },
    "range": [
      1681,
      1686
    ]
  },
  {
    "type": "Text",
    "value": "text_",
    "position": {
      "start": {
        "line": 137,
        "column": 1,
        "offset": 1688
      },
      "end": {
        "line": 137,
        "column": 6,
        "offset": 1693
      }
    },
    "range": [
      1688,
      1693
    ]
  },
  {
    "type": "Html",
    "value": "<div broken open html tag<div>\n",
    "position": {
      "start": {
        "line": 139,
        "column": 1,
        "offset": 1695
      },
      "end": {
        "line": 139,
        "column": 32,
        "offset": 1726
      }
    },
    "range": [
      1695,
      1726
    ],
    "tagName": "div",
    "isVoidElement": false
  }
];

const root = parse(input);

try {
  strictEqual(JSON.stringify(root.tokens), JSON.stringify(expectedTokens));
  console.log('All tests passed!');
} catch (error) {
  console.error('Error:', error);
}

writeFileSync('ast.json', JSON.stringify(root, undefined, 2));
writeFileSync('tokens.json', JSON.stringify(root.tokens, undefined, 2));
