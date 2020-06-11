/*
	Mady by @dkaraush (dkaraush@gmail.com, dkaraush.me)
*/

var UI = window.UI = {
	addRipple: function (element) {
		function down(event) {
			var rect = element.getBoundingClientRect();
			var x = (event.clientX - rect.left), y = (event.clientY - rect.top);
			var R = max(
						sqrt(pow(x, 2) + pow(y, 2)),
						sqrt(pow(x-rect.width, 2) + pow(y, 2)),
						sqrt(pow(x, 2) + pow(y-rect.height, 2)),
						sqrt(pow(x-rect.width, 2) + pow(y-rect.height, 2))
					);

			var ripple = document.createElement('div');
			ripple.className = 'ripple';
			ripple.style.position = 'absolute';
			ripple.style.transition = 'all 0.25s cubic-bezier(0.215, 0.61, 0.355, 1)';
			ripple.style.borderRadius = '50%';
			ripple.style.opacity = '1';
			ripple.style.top = y + "px";
			ripple.style.left = x + "px";
			ripple.style.width = ripple.style.height = '0px';
			ripple.id = 's' + Date.now();
			setTimeout(function () {
				ripple.style.opacity = '0.75';
				ripple.style.top = (y-R) + "px";
				ripple.style.left = (x-R) + "px";
				ripple.style.width = ripple.style.height = R*2 + 'px';
			}, 10);

			element.appendChild(ripple);
		}
		function up() {
			var ripples = element.querySelectorAll('.ripple');
			if (ripples == null)
				return;

			for (var i = 0; i < ripples.length; ++i) {
				var ripple = ripples[i];
				var start = parseInt(ripple.id.substring(1));
				if (Date.now() - start > 250) {
					ripple.style.opacity = '0';
					$t(250, function(){ripple.remove()}, 250);
				} else {
					$t(250 - Date.now() + start, function () {
						ripple.style.opacity = '0';
						$t(250, function(){ripple.remove()});
					})
				}
			}
		}
		element.addEventListener('mousedown', down);
		element.addEventListener('mouseup', up);
		window.addEventListener('mouseup', up);
	},
	IntroButton: function (el) {
		UI.addRipple(el);
		$ev(el, 'Hide', function () {
			$addclass(el, 'hidden');
		});
		$ev(el, 'Loading', function () {
			$addclass(el, 'loading');
		});
		$ev(el, 'Idle', function () {
			$rmclass(el, 'hidden');
			$rmclass(el, 'loading');
		});
	},
	input: function (div) {
		var input = div.querySelector('input'), placeholder = div.querySelector('.placeholder');
		var defText = div.querySelector('.placeholder').innerHTML;
		$ev(input, ['click','focus','keyup','keydown','keypress','change'], function () {
			$addclass(div, 'focus');
			$setclass(div, 'typed', input.value.length > 0);
			if (input.value.length == 0 && $hasclass(div, 'error')) {
				$rmclass(div, 'error');
				placeholder.innerHTML = defText;
			}
		});
		$ev(input, 'blur', function (evt) {
			$rmclass(div, 'focus');
		});
		$ev(div, 'Error', function (evt) {
			$addclass(div, 'error');
			placeholder.innerHTML = evt.text;
		});
	},
	inputSelect: function (div) {
		var input = div.querySelector('input'),
			select = div.querySelector('.select');
		$ev(input, ['click','focus','keyup','keydown','keypress','change'], function () {
			$addclass(div, 'focus');
			$setclass(div, 'typed', input.value.length > 0);
			$t(16, function () { select.style.display = 'block' });
		});
		function close() {
			$rmclass(div, 'focus');
			$t(100, function () { select.style.display = 'none'; });
		}
		$ev(div, 'Close', close);
		$ev($win, ['click', 'touchend', 'mouseup', 'keydown'], function (evt) {
			if (evt.type == 'keypress') { 
				if (evt.keyCode == 27)
					close();
				return;
			}

			var e = evt.target, f = true;
			while (e != null && !$hasclass(e, 'inputSelect'))
				e = e.parentElement;
			if (e == null)
				close();
		});

	}
};

for (var key in UI) {
	var elements = $arr('.'+key);
	for (var i = 0; i < elements.length; ++i)
		UI[key](elements[i]);
}