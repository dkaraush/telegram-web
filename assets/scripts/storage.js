var _g = [
	localStorage.getItem.bind(localStorage),
	getCookie,
	function (name) {
		return Storage.data[name];
	}
];
var _s = [
	localStorage.setItem.bind(localStorage),
	setCookie,
	function (name, val) {
		Storage.data[name]=val;
	}
];
function get(name, def) {
	var val, i = 0;
	while (
		(val=_g[i++](name))==null && 
		i < _g.length);
	if (val != null) {
		try {
			return JSON.parse(val)||def;
		} catch (e) {
			console.warn('failed to parse \"' + name + '\" param:', val);
			return def||null;
		}
	}
	return def||null;
}
function set(name, value) {
	value=JSON.stringify(value);
	for (var i = 0; i < _s.length; _s[i++](name,value));
}
function remove(name) {
	set(name, null);
}
var Storage = window.Storage = {
	data: {},
	save: set,
	set: set,
	get: get,
	load: get,
	remove: remove
};

function getCookie(name) {
	var matches = document.cookie.match(new RegExp("(?:^|; )"+name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g,'\\$1')+"=([^;]*)"));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}
function setCookie(name, value, options) {
	if (typeof options === 'undefined')
		options = {};
	options.path='/';

	if (options.expires&&options.expires.toUTCString) {
		options.expires = options.expires.toUTCString();
	}

	var updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
	for (var optionKey in options) {
		updatedCookie += "; " + optionKey;
		var optionValue = options[optionKey];
		if (optionValue !== true) {
			updatedCookie += "=" + optionValue;
		}
	}
	document.cookie = updatedCookie;
}