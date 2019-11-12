let style = null;
let usageSrc = 'assets/styles/theme-usage.css';
let palettesSrc = [
	'basic.palette', 
	// 'dark.palette'
];
let colors = {};
loadAll(map(palettesSrc, function (p) {
	return 'assets/themes/' + p;
}).concat(usageSrc), function (res) {
	for (let i = 0; i < res.length-1; ++i)
		addColors(res[i]);
	let usage = res[res.length-1];
	apply(colors, usage);
});

function addColors(palette) {
	let lines = palette.split('\n');
	for (let i = 0; i < lines.length; ++i) {
		let line = lines[i];
		if (line.indexOf('\/\/') >= 0)
			line = line.substring(0, line.indexOf('\/\/'));
		let key, value;
		if (line.indexOf(':') < 0)
			continue;
		key = line.substring(0, line.indexOf(':')).trim();
		value = line.substring(line.indexOf(':')+1).trim();
		if (value.indexOf(';') >= 0)
			value = value.substring(0, value.indexOf(';')).trim();
		if (value[0] == '#') {
			if (value.length == 4)
				value = '#' + value[1].repeat(2) + value[2].repeat(2) + value[3].repeat(2) + 'ff';
			else if (value.length == 5)
				value = '#' + value[1].repeat(2) + value[2].repeat(2) + value[3].repeat(2) + value[4].repeat(2);
			else if (value.length == 7)
				value += 'ff';
		}
		colors[key] = value;
	}
}
function apply(colors, usage) {
	let styletext = usage;
	for (let colorname in colors) {
		let color = colors[colorname];
		while (typeof color !== 'undefined' && color[0] != '#')
			color = colors[color];
		if (typeof color === 'undefined')
			continue;

		styletext = styletext.replace(
			new RegExp(colorname+'(\\([^\\)]+\\)){0,1}', 'g'), 
			function (func, type) {return formColor(color, type)});
	}

	if (style == null) {
		style = document.createElement('style');
		document.head.appendChild(style);
	}
	style.innerHTML = styletext;
}
function formColor(input, type) {
	switch (type) {
		case '(rgb)':
			return 'rgb(' + parseInt(input.substring(1, 3), 16) + ',' +
							parseInt(input.substring(3, 5), 16) + ',' +
							parseInt(input.substring(5, 7), 16) + ')';
		case '(hex)':
			return input;
		case '(alpha)':
		case '(opacity)':
			return parseInt(input.substring(7,9),16)/255+"";
		case '(rgba)':
		default:
			return 'rgba(' + parseInt(input.substring(1, 3), 16) + ',' +
							 parseInt(input.substring(3, 5), 16) + ',' +
							 parseInt(input.substring(5, 7), 16) + ',' + 
							(parseInt(input.substring(7, 9), 16)/255) + ')';
	}
}
