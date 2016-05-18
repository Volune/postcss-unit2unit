'use strict';

var postcss = require('postcss');
var DEFAULT_IGNORE_RULES = ['font-size'];
var NUMBER_REGEXP = '[\\d.]+';

module.exports = postcss.plugin('postcss-unit2unit', function (options) {
	options = options || {};
	var fromUnit = options.fromUnit || 'pt';
	var toUnit = options.toUnit || 'vw';
	var ignoreRules = options.ignoreRules || DEFAULT_IGNORE_RULES;
	var factor = parseFloat(options.factor);
	var regexp = new RegExp('(' + NUMBER_REGEXP + ')' + fromUnit, 'g');
	var rawRegexp = new RegExp(NUMBER_REGEXP + fromUnit + '\\s*(/\\*' + fromUnit + '\\*/)?', 'g');

	return function (css) {
		css.walkRules(function (rule) {
			rule.walkDecls(function (decl) {
				if (ignoreRules.indexOf(decl.prop) >= 0) {
					return;
				}
				rawRegexp.lastIndex = 0;
				var sourceValue = decl.value;
				var sourceRawValue = decl.raws.value && decl.raws.value.raw || null;
				decl.value = sourceValue.replace(regexp, function (match, quantity) {
					var rawMatch = sourceRawValue ? rawRegexp.exec(sourceRawValue) : null;
					if (rawMatch && rawMatch[1]) {
						return match;
					} else {
						return (parseFloat(quantity) * factor) + toUnit;
					}
				});
			});
		});
	};
});
