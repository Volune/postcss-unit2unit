const postcss = require('postcss');
const plugin = require('../index');
const expect = require('chai').expect;

var processor = postcss(plugin({
	fromUnit: 'pt',
	toUnit: 'vw',
	ignoreRules: ['font-size'],
	ignoreComments: ['pt'],
	factor: 100 / 375
}));

const test = (source, expected) => (
	processor
		.process(source)
		.then((result) => {
			expect(result.css).to.equal(expected);
		})
);

it("convert value (375pt)", () => {
	const source = `p { width: 375pt; }`;
	const expected = `p { width: 100vw; }`;

	return test(source, expected);
});

it("convert value (37.5pt)", () => {
	const source = `p { width: 37.5pt; }`;
	const expected = `p { width: 10vw; }`;

	return test(source, expected);
});

it("ignore value if comment", () => {
	const source = `p { width: 375pt /*pt*/; }`;
	const expected = `p { width: 375pt /*pt*/; }`;

	return test(source, expected);
});

it("ignore value if comment after rule", () => {
	const source = `p { width: 375pt; /*pt*/ }`;
	const expected = `p { width: 375pt; /*pt*/ }`;

	return test(source, expected);
});

it("ignore rule", () => {
	const source = `p { font-size: 20pt; }`;
	const expected = `p { font-size: 20pt; }`;

	return test(source, expected);
});

it("handle multiple values in rule (0 37.5pt 16pt/*pt*/)", () => {
	const source = `p { padding: 0 37.5pt 16pt/*pt*/; }`;
	const expected = `p { padding: 0 10vw 16pt; }`;

	return test(source, expected);
});

it("handle multiple values in rule (0 16pt/*pt*/ 37.5pt)", () => {
	const source = `p { padding: 0 16pt/*pt*/ 37.5pt; }`;
	const expected = `p { padding: 0 16pt 10vw; }`;

	return test(source, expected);
});
