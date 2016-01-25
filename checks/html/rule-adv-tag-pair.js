module.exports = {
  name: 'adv-tag-pair',
  desc: 'Tag must be paired.',
  target: 'parser',

  lint: function (getCfg, parser, reporter) {
    var voidElements = [
      // HTML
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'keygen',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
      // SVG
      'use',
      'circle',
      'rect',
      'path',
      'line',
      'image',
      'ellipse',
      'polyline',
      'polygon',
      'tref',
      'fePointLight',
      'feColorMatrix',
      'feGaussianBlur',
      'animate',
      'animateTransform',
      'mpath',
    ];

    var stack = [];

    var check = function (tag) {
      if (voidElements.indexOf(tag.name) < 0) {
        reporter.warn(
          tag.pos,
          '035',
          'Tag ' + tag.name + ' is not paired.'
        );
      }
    };

    parser.on('opentag', function (name) {
      stack.push({
        name: name.toLowerCase(),
        pos: this.startIndex
      });
    });

    // do close & check unclosed tags
    parser.tokenizer.on('closetag', function (name) {
      if (!getCfg()) {
        return;
      }

      name = name.toLowerCase();

      // find the matching tag
      var l = stack.length;
      var i = l - 1;
      for (; i >= 0; i--) {
        if (stack[i].name === name) {
          break;
        }
      }

      // if the matching tag found,
      // all tags after the macthing tag are unpaired
      if (i >= 0) {
        for (var j = i + 1; j < l; j++) {
          check(stack[j]);
        }
        stack = stack.slice(0, i);
      }
    });

    // check left tags
    parser.on('end', function () {
      if (!getCfg()) {
        return;
      }

      // all unclosed tags in the end are unpaired
      stack.forEach(check);
    });
  }
};
