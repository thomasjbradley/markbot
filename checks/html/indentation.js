'use strict';

var
  util = require('util'),
  beautifier = require('js-beautify').html
;

const notProperLineBreaks = function (line) {
  var
    forceLineBreak = [
      // HTML
      'header', 'nav', 'footer', 'main', 'section', 'article', 'aside',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
      'figure', 'figcaption', 'picture', 'video', 'audio', 'source', 'track',
      'div', 'hr', 'canvas',
      'html', 'head', 'body', 'title', 'link', 'meta', 'script', 'noscript', 'template',
      'iframe', 'embed', 'object', 'param', 'map', 'area',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'td',
      'form', 'fieldset', 'label', 'input', 'button', 'select', 'datalist',
      'option', 'optgroup', 'textarea', 'keygen', 'output', 'progress',
      'meter', 'legend', 'details', 'summary', 'menu', 'menuitem', 'dialog',
      // SVG
      'svg', 'circle', 'rect', 'path', 'line', 'image', 'ellipse', 'polyline', 'polygon',
      'tref', 'fePointLight', 'feColorMatrix', 'feGaussianBlur', 'animate', 'animateTransform',
      'mpath', 'clipPath', 'defs', 'linearGradient', 'desc', 'feBlend', 'feComponentTransfer',
      'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
      'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feImage', 'feMerge',
      'feMergeNode', 'feMorphology', 'feOffset', 'feSpecularLighting', 'feSpotlight',
      'feTile', 'feTurbulence', 'filter', 'g', 'marker', 'mask', 'pattern', 'radialGradient',
      'stop', 'symbol', 'text', 'textPath',
      // <p> & <th> needs to be last because they're really grabby
      'p', 'th'
    ],
    lineRegEx = '\<\/?(' + forceLineBreak.join('|') + ')[^>]*\>\\s*\<\/?(' + forceLineBreak.join('|') + ')',
    generalChecks = line.match(new RegExp(lineRegEx)),
    specificLineBreakChecks = [
      '\<\/?(figure)[^>]*\>\\s*\<\/?(img)',
      '\<\/?(img)[^>]*\>\\s*\<\/?(figcaption)',
      '\<\/?(div)[^>]*\>\\s*\<\/?(img)'
    ],
    i = 0, total = specificLineBreakChecks.length,
    specificCheck
  ;

  if (generalChecks) return generalChecks;

  for (i ; i < total; i++) {
    specificCheck = line.match(new RegExp(specificLineBreakChecks[i]));

    if (specificCheck) return specificCheck;
  };

  return false;
}

module.exports.check = function (fileContents, lines, group, cb) {
  var
    errors = [],
    beautified = '',
    i = 0,
    total = lines.length,
    orgFrontSpace = false,
    goodFrontSpace = false,
    beautifiedLines
  ;

  cb('indentation', group, 'start', 'Indentation');

  beautified = beautifier(fileContents, {
    indent_size: 2,
    preserve_newlines: true,
    max_preserve_newlines: 10,
    wrap_line_length: 0,
    end_with_newline: true,
    extra_liners: [],
    unformatted: [
      // Replace all unformatted to support newer elements and SVG
      'a', 'span', 'img', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'data', 'time',
      'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'small', 'u', 's', 'strike',
      'var', 'ins', 'del', 'pre', 'address', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'path', 'use', 'ruby', 'rt', 'rp', 'mark', 'bdi', 'br', 'wbr'
    ]
  });

  for (i; i < total; i++) {
    let lineBreakIssues = notProperLineBreaks(lines[i]);

    if (lineBreakIssues) {
      errors.push(util.format('Line %d: The %s and %s elements should be on different lines—further indentation checks skipped', i+1, lineBreakIssues[1], lineBreakIssues[2]));
      break;
    }

    orgFrontSpace = lines[i].match(/^(\s*)/);
    beautifiedLines = beautified.toString().split('\n');

    if (!beautifiedLines[i]) continue;

    goodFrontSpace = beautifiedLines[i].match(/^(\s*)/);

    if (orgFrontSpace[1].length != goodFrontSpace[1].length) {
      errors.push(util.format('Line %d: Expected indentation depth of %d spaces', i+1, goodFrontSpace[1].length));
    }
  }

  cb('indentation', group, 'end', 'Indentation', errors);
};
