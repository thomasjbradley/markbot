module.exports = {
  name: 'adv-attr-lowercase',
  desc: 'Attribute name must be lowercase.',
  target: 'parser',

  lint: function (getCfg, parser, reporter) {
    parser.tokenizer.on('attribname', function (name) {
      var attrs = [
        'attributename', 'attributetype', 'basefrequencey', 'calcmode', 'clippathunits',
        'contentscripttype', 'contentstyletype', 'diffuseconstant', 'edgemode',
        'externalresourcesrequired', 'filterres', 'filterunits', 'gradienttransform',
        'gradientunits', 'kernelmatrix', 'kernalunitlength', 'keysplines', 'keytimes',
        'limitingconeangle', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits',
        'maskunits', 'numoctaves', 'pathlength', 'patterncontentunits', 'patterntransform',
        'patternunits', 'pointsatx', 'pointsaty', 'pointsatz', 'preservealpha',
        'preserveaspectratio', 'primitiveunits', 'repeatcount', 'repeatdir', 'requiredfeatures',
        'specularconstant', 'specularexponent', 'stddeviation', 'stitchtiles',
        'surfacescale', 'targetx', 'targety', 'textlength', 'viewbox', 'xchannelselector',
        'ychannelselector',
      ];

      if (!getCfg()) return;

      if (attrs.indexOf(name.toLowerCase()) > -1) return;

      if (name !== name.toLowerCase()) {
        reporter.warn(
          this._sectionStart,
          '029',
          'Attribute name must be lowercase.'
        );
      }
    });
  }
};
