/*
	Mady by @dkaraush (dkaraush@gmail.com, dkaraush.me)
*/

var UI = {
	ripple: function (element) {
		function down(event) {
			var rect = element.getBoundingClientRect();
			var x = (event.clientX - rect.left), y = (event.clientY - rect.top);
			var R = Math.max(
						Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
						Math.sqrt(Math.pow(x-rect.width, 2) + Math.pow(y, 2)),
						Math.sqrt(Math.pow(x, 2) + Math.pow(y-rect.height, 2)),
						Math.sqrt(Math.pow(x-rect.width, 2) + Math.pow(y-rect.height, 2))
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
					setTimeout(function(){ripple.remove()}, 250);
				} else {
					setTimeout(function () {
						ripple.style.opacity = '0';
						setTimeout(function(){ripple.remove()}, 250);
					}, 250 - (Date.now() - start))
				}
			}
		}

		element.addEventListener('mousedown', down);
		element.addEventListener('mouseup', up);
		window.addEventListener('mouseup', up);
	},
	input: function (element) {
		
	}
};

for (var key in UI) {
	var elements = $arr('.'+key);
	for (var i = 0; i < elements.length; ++i)
		UI[key](elements[i]);
}