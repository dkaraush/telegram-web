// messages renderer
var contentContainer = $('#content');
function openPeer(peer) {
	if (contentContainer.className.indexOf(peer.id) >= 0)
		return;

	openingPeer = true;
	var active = $('#content .' + contentContainer.className);

	if (active) {
		active.style.display = 'none';
	}

	var peerContent = $('#content .'+peer.id);
	if (!peerContent) {
		peerContent = createPeerWindow(peer);
		contentContainer.appendChild(peerContent);
	}

	peerContent.style.display = 'block';
	contentContainer.className = peer.id;
}

var peerListeners = [];
function svg(name, p) {
	var s = $doc.createElementNS('http://www.w3.org/2000/svg', 'svg'), u = $doc.createElementNS('http://www.w3.org/2000/svg', 'use');
	u.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#'+name);
	if (name != 'corner') {
		s.setAttribute('height', 24);
		s.setAttribute('width', 24);
		s.className.baseVal = p;
	} else
		s.className.baseVal = 'corner';
	s.setAttribute('viewBox', name == 'corner' ? '15 12 11 20' : '0 0 24 24');
	s.appendChild(u);
	return s;
}
function createPeerWindow(peer) {
	var el, msgcontainer, scrcontainer, msgs = [];
	peerListeners.push(peer.id+'-'+peer.listenDialog(function (new_peer) {
		var pic = el.querySelector('.picture');
		if (new_peer.info.photo && new_peer.info.photo.smallLoaded &&
			pic.querySelector('img') == null) {
			var img = _peerImage(new_peer)
			pic.appendChild(img);
		}
	}));
	function updateMessages(p) {
		var wasOnBottom = scrcontainer.scrollTop >= scrcontainer.scrollHeight - scrcontainer.clientHeight - 10*window.devicePixelRatio;
		var lastScrollHeight = scrcontainer.scrollHeight;
		var ps = '#'+p.id+'-';
		for (var k in p.messages) {
			var t = parseInt(k);
			if (msgs.indexOf(t) < 0) {
				var element = messageElement(p.messages[k], p);
				if (element) {
					if (msgcontainer.childElementCount == 0) {
						msgcontainer.appendChild(element);
						msgs.push(t);
					} else {
						var i = binSearch(msgs, t), e = msgs[i];
						if (e != null) {
							var el = $(ps+e);
							if (e < t)
								el = el.nextSibling;
							msgcontainer.insertBefore(element, el);
							msgs.splice(i + (e < t ? 1 : 0), 0, t);
						}
					}
				}
			}
		}
		scrcontainer.scrollTop += (scrcontainer.scrollHeight - lastScrollHeight);
		requestAnimationFrame(checkHoles.bind(this, true));
	}
	peerListeners.push(peer.id + '-' + peer.listenMessages(updateMessages));
	
	var lastHolesCheck = -1;
	function checkHoles(force) {
		if (peer.loadingHole)
			return;
		if (Date.now() - lastHolesCheck < 200 && !force)
			return;
		var ps = '#'+peer.id+'-';
		for (var i = 0; i < peer.holes.length; ++i) {
			var el = $(ps+peer.holes[i].id);
			if (el && isAnyPartOfElementInViewport(el)) {
				peer.loadHole(i);
				break;
			}
		}
		lastHolesCheck = Date.now();
	}
	return el = $new('div.'+peer.id+(peer.type!='C'?'.hasInput':''), null, [
		$new('div.header', null, [
			$new('div.picture', null, peerImage(peer)),
			$new('div.info', null, [
				$new('h2', peer.info.title),
				$new('p', peer.type)
			])
		]),
		$new('div.content', null, [
			scrcontainer=$new('div.messages', null, [
				$new('div', null, [msgcontainer = $new('div')])
			], $evt(['scroll'], checkHoles)),
			(peer.type != 'C' ?
				$new('div.sendbox', null, [
					$new('div', null, [
						$new('div.gradient'),
						$new('div.inputbox', null, [
							$new('div.emoji-select', null, [svg('emoji-select')], UI.addRipple),
							$new('div.text', null, [$new('textarea', {rows: 1, placeholder: "Message"})]),
							$new('div.attach', null, [svg('attach')], UI.addRipple),
							svg('corner')
						]),
						$new('div.btn.voice', null, [
							$new('div.voice', null, [svg('mic')]),
							$new('div.msg', null, [svg('send')])
						], UI.addRipple)
					])
				])
			: null)
		])
	], function () {
		updateMessages(peer);
		if (peer.holes.length == 0)
			peer.load();
		scrcontainer.scrollTop = scrcontainer.scrollHeight - scrcontainer.clientHeight;
	});
}

// thanks, https://gist.github.com/davidtheclark/5515733
function isAnyPartOfElementInViewport(el) {
    var rect = el.getBoundingClientRect(), 
    	h = ($win.innerHeight || $doc.documentElement.clientHeight),
    	w = ($win.innerWidth || $doc.documentElement.clientWidth);
    return (((rect.top <= h) && ((rect.top + rect.height) >= 0)) && (rect.left <= w) && ((rect.left + rect.width) >= 0));
}
function dateToTimeString(t) {
	var d = new Date(t * 1000);
	var h = d.getHours(), m = d.getMinutes();
	if (h < 10) h = '0' + h;
	if (m < 10) m = '0' + m;
	return h + ':' + m;
}
function messageElement(m,p) {
	if (m._ == 'message') {
		return $new('div'+(m.pFlags.out?'.out':'.in')+'#'+p.id+'-'+m.id, null, [
			$new('span', null, [
				$new('span', m.message),
				$new('div', null, [
					$new('span.time', dateToTimeString(m.date))
				]),
				svg('corner')
			])
		]);
	}
}

function correct(arr, i, x) {
	if (arr[i] == x) {
		console.warn('WTF???');
		return true;
	}
	return (arr[i] < x && (i == arr.length-1 || arr[i+1] > x)) ||
		   (arr[i] > x && (i == 0 || arr[i-1] < x));
}
function binsrch(a, l, r, x) {
	if (l == r) {
		if (correct(a, l, x))
			return l;
		return null;
	}
	var m = ~~(l + (r - l + 1) / 2);
	if (correct(a, m, x))
		return m;
	else if (a[m] > x)
		return binsrch(a, l, m-1, x);
	else if (a[m] < x)
		return binsrch(a, m+1, r, x);
	else {
		console.warn('WTF 2???');
		return null;
	}
}
function binSearch(a, x) {
	return binsrch(a, 0, a.length-1, x);
}