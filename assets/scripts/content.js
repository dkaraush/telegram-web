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
function peerImage(peer) {
	var a = [$new('div.empty', peer.info.short, [], function (el) {
				el.style.backgroundColor = userColors[(parseInt(peer.id.slice(1)) % userColors.length)];
			})];
	if (peer.info.photo != null && peer.info.photo.smallLoaded) {
		a.push(_peerImage(peer));
	}
	return a;
}
function _peerImage(peer) {
	return $new('img', null, [], function (el) {
					el.src = peer.info.photo.smallSrc;
					el.style.opacity = 0;
					$t(16, function () {el.style.opacity = 1});
				});
}
function svg(name, p) {
	var s = $doc.createElementNS('http://www.w3.org/2000/svg', 'svg'), u = $doc.createElementNS('http://www.w3.org/2000/svg', 'use');
	u.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#'+name);
	if (name != 'corner') {
		s.setAttribute('height', 24);
		s.setAttribute('width', 24);
	} else
		s.className.baseVal = p;
	s.setAttribute('viewBox', name == 'corner' ? '15 12 11 20' : '0 0 24 24');
	s.appendChild(u);
	return s;
}
function createPeerWindow(peer) {
	var el, msgcontainer, scrcontainer;
	peerListeners.push(peer.id+'-'+peer.listenDialog(function (new_peer) {
		var pic = el.querySelector('.picture');
		if (new_peer.info.photo && new_peer.info.photo.smallLoaded &&
			pic.querySelector('img') == null) {
			var img = _peerImage(new_peer)
			pic.appendChild(img);
		}
	}))
	peerListeners.push(peer.id + '-' + peer.listenMessages(function (p) {
		var wasOnBottom = scrcontainer.scrollTop >= scrcontainer.scrollHeight - scrcontainer.clientHeight - 10*window.devicePixelRatio;
		for (var k in p.messages) {
			if (!$('#'+p.id+'-'+k)) {
				var element = messageElement(p.messages[k], p);
				if (element)
					msgcontainer.appendChild(element);
			}
		}
		if (wasOnBottom) {
			scrcontainer.scrollTop = scrcontainer.scrollHeight - scrcontainer.clientHeight;
		}
	}));
	peer.load();
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
			]),
			(peer.type != 'C' ?
				$new('div.sendbox', null, [
					$new('div', null, [
						$new('div.gradient'),
						$new('div.inputbox', null, [
							$new('div.emoji-select', null, [svg('emoji-select')], UI.addRipple),
							$new('div.text', null, [$new('textarea', {rows: 1, placeholder: "Message"})]),
							$new('div.attach', null, [svg('attach')], UI.addRipple),
							svg('corner', 'corner')
						]),
						$new('div.btn.voice', null, [
							$new('div.voice', null, [svg('mic')]),
							$new('div.msg', null, [svg('send')])
						], UI.addRipple)
					])
				])
			: null)
		])
	]);
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
				])
			])
		]);
	}
}