$isMobile = /Android|webOS|iPhone|iPad|iPod|pocket|psp|kindle|avantgo|blazer|midori|Tablet|Palm|maemo|plucker|phone|BlackBerry|symbian|IEMobile|mobile|ZuneWP7|Windows Phone|Opera Mini/i.test(navigator.userAgent);
$doc = document;
$win = window;
$body = document.body;
$ = $doc.querySelector.bind($doc);
$html = $('html');
$arr = $doc.querySelectorAll.bind($doc);
$t = function (time, func) {setTimeout(func, time)}
if (!Object.keys) {
    Object.keys = function (obj) {
        var keys = [], k;
        for (k in obj)
            if (Object.prototype.hasOwnProperty.call(obj, k))
                keys.push(k);
        return keys;
    };
}
$rmclass = function (el, name) {
	var classes = (el.className||'').split(/ /g), i;
	while ((i = classes.indexOf(name)) >= 0)
		classes.splice(i, 1);
	el.className = classes.join(' ');
}
$setclass = function (el, name, bool) {
	if (bool) $addclass(el, name);
	else $rmclass(el, name);
}
$hasclass = function (el, name) {
	var classes = (el.className||'').split(/ /g);
	return classes.indexOf(name) >= 0;
}
$addclass = function (el, name) {
	var classes = (el.className||'').split(/ /g);
	if (classes.indexOf(name) >= 0)
		return;
	classes.push(name);
	el.className = classes.join(' ');
}
$append = function (el, els) {
	if (els)
		for (var i = 0; i < els.length; ++i)
			if (els[i] != null)
				el.appendChild(els[i])
}
$new = function (query, content, els, cb1, cb2, cb3) {
	function removeFirstSymbol(s) {
		return s.substring(1)
	}
	var el = $doc.createElement(query.match(/^(\w+)/)[0]);
	var classes = query.match(/(\.[\w\d-]+)/g),
		ids = query.match(/(#[\w\d-]+)/g);
	if (classes)
		el.className = classes.map(removeFirstSymbol).join(' ');
	if (ids)
		el.id = ids.map(removeFirstSymbol).join(' ');
	if (typeof content === 'object' && content != null) {
		for (var k in content)
			el.setAttribute(k, content[k]);
	} else if (content)
		el.innerText = content;
	$append(el, els);
	var cbs = arr(arguments).slice(3);
	for (var i = 0; i < cbs.length; ++i)
		if (typeof cbs[i] === 'function')
			cbs[i](el);
	return el;
}
$ev = function (el, m, cb) {
	if (typeof m === 'string')
		return $ev(el, [m], cb);
	for (var i = 0; i < m.length; ++i)
		el.addEventListener(m[i], cb);
}
var $loaded = false, $_onload = [];
$ev($win, 'load', function () {
	$loaded = true;
	for (var i = 0; i < $_onload.length; ++i)
		$_onload[i]();
	$_onload = [];
})
$onload = function (func) {
	if ($loaded) func();
	else $_onload.push(func);
}
$n = function (func) {
	if (window.requestAnimationFrame)
		window.requestAnimationFrame(func);
	else $t(16, func);
}
$run = function (el, name, data) {
	// el.dispatchEvent(new Event(name, {bubbles:true}));
	var ev;
	if ($doc.createEvent) {
		ev = $doc.createEvent('Event');
		ev.initEvent(name, true, true);
		if (typeof data === 'object')
			for (var key in data)
				ev[key] = data[key];
	} else {
		// wtf
	}

	el.dispatchEvent(ev);
}
$evt = function (names, cb) {
	return function (el) {
		$ev(el, names, cb);
	}
}
$click = $evt.bind(this, 'click');
function arr(args) {
	return Array.prototype.slice.apply(args);
}
function now(sec) {
	var t = +new Date() + (window.tsOffset || 0);
	return sec ? Math.floor(t / 1000) : t;
}
function load(url, cb) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function () {
		if (xhr.readyState !== 4)
			return;
		cb(xhr.status === 200, xhr.responseText);
	}
	xhr.send();
}
function loadAll(urls, cb) {
	var l = 0, n = urls.length, results = [];
	urls.forEach(function (url, i) {
		load(url, function (status, data) {
			l++;
			results[i] = data;
			if (l == n)
				cb(results);
		});
	});
}
function all() {
	var functions = arr(arguments), results = [];
	var i = 0, n = functions.length-1;
	for (var j = 0; j < functions.length-1; ++j) {
		functions[j](function () {
			results[i] = arr(arguments);
			i++;
			if (i == n)
				functions[functions.length-1](results);
		});
	}
}
function map(arr, func) {
	var results = new Array(arr.length);
	for (var i = 0; i < arr.length; ++i)
		results[i] = func(arr[i]);
	return results;
}
function filter(arr, func) {
	for (var i = 0; i < arr.length; ++i) {
		if (!func(arr[i])) {
			arr.splice(i, 1);
			i--;
		}
	}
	return arr;
}
function has(arr, func) {
	for (var i = 0; i < arr.length; ++i)
		if (func(arr[i]))
			return true;
	return false;
}
function find(arr, func) {
	for (var i = 0; i < arr.length; ++i)
		if (func(arr[i]))
			return arr[i];
	return null
}
function assign(obj1, obj2) {
	for (var k in obj2)
		obj1[k] = obj2[k];
	return obj1;
}