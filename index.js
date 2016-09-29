'use strict';

var postcss = require('postcss');
var _ = require('lodash');
var NUMBER_REGEXP = '[\\d.]+';
var UNIT_REGEXP = '[a-zA-Z]+';

module.exports = postcss.plugin('postcss-unit2unit', function (options) {
	options = options || [];
	if (!Array.isArray(options)) {
		options = [options];
	}

	var processors = options.map(function (processorOptions) {
		var toUnit = processorOptions.toUnit;
		var factor = parseFloat(processorOptions.factor);

		return {
			fromUnit: processorOptions.fromUnit,
			restrictRules: processorOptions.restrictRules || [],
			ignoreRules: processorOptions.ignoreRules || [],
			restrictComments: processorOptions.restrictComments || [],
			ignoreComments: processorOptions.ignoreComments || [],
			replace: function (quantity) {
				return (parseFloat(quantity) * factor) + toUnit;
			}
		};
	});

	var getProcessor = _.memoize(function (rule, fromUnit, comment) {
		return _.find(processors, function (processor) {
				if (fromUnit !== processor.fromUnit) {
					return false;
				}
				if (processor.ignoreRules.indexOf(rule) >= 0) {
					return false;
				}
				if (processor.restrictRules.length > 0 && processor.restrictRules.indexOf(rule) < 0) {
					return false;
				}
				if (processor.ignoreComments.indexOf(comment) >= 0) {
					return false;
				}
				if (processor.restrictComments.length > 0 && processor.restrictComments.indexOf(comment) < 0) {
					return false;
				}
				// processor can be applied
				return true;
			}) || null;
	}, function resolver(rule, fromUnit, comment) {
		return rule + '+' + fromUnit + '+' + comment;
	});

	var regexp = new RegExp('(' + NUMBER_REGEXP + ')(' + UNIT_REGEXP + ')', 'g');
	var rawRegexp = new RegExp(NUMBER_REGEXP + UNIT_REGEXP + '\\s*(?:/\\*\\s*([^*]+)\\s*\\*/)?', 'g');

	return function (css) {
		css.walkRules(function (rule) {
			rule.nodes.forEach(function (node, index, nodes) {
				if (node.type !== 'decl') {
					// ignore node
					return;
				}
				regexp.lastIndex = 0;
				rawRegexp.lastIndex = 0;
				var sourceValue = node.value;
				var sourceRawValue = node.raws.value && node.raws.value.raw || null;
				if (!sourceRawValue && index < nodes.length - 1 && nodes[index + 1].type == 'comment') {
					sourceRawValue = sourceValue + ' /*' + nodes[index + 1].text + '*/';
				}
				node.value = sourceValue.replace(regexp, function (match, quantity, fromUnit) {
					var rawMatch = sourceRawValue ? rawRegexp.exec(sourceRawValue) : null;
					var comment = rawMatch && rawMatch[1] || "";
					var processor = getProcessor(node.prop, fromUnit, comment);
					if (processor) {
						return processor.replace(quantity);
					} else {
						return match;
					}
				});
			});
		});
	};
});
