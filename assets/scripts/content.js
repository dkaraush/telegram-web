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
		createPeerWindow(peer);
		peerContent = $('#content .'+peer.id);
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
		if (p)
			s.className.baseVal = p;
	} else
		s.className.baseVal = 'corner';
	s.setAttribute('viewBox', name == 'corner' ? '15 12 11 20' : '0 0 24 24');
	s.appendChild(u);
	return s;
}
function lastSeen(date) {
	var diff = Math.abs((Date.now()/1000) - date);

	if (diff < 60) {
		return 'just now';
	} else if (diff < 3600) {
		var d = Math.floor(diff / 60);
		return d + ' minute'+(d>1?'s':'')+' ago';
	} else if (diff < 86400) {
		var d = Math.floor(diff / 3600)
		return d + ' hour'+(d>1?'s':'')+' ago';
	} else {
		var d = new Date(date*1000);
		var date = d.getDate();
		var month = d.getMonth()+1;
		var year = d.getFullYear()-2000;
		var hours = d.getHours();
		var minutes = d.getMinutes();
		if (date < 10) date = '0'+date;
		if (month < 10) month = '0'+month;
		if (hours < 10) hours = '0'+hours;
		if (minutes < 10) minutes = '0'+minutes;
		return [hours,minutes].join(':') + ' ' + [month,date,year].join('.');
	}

}
function userStatus(status) {
	if (!status || status._ == 'userStatusEmpty')
		return [];
	if (status._ == 'userStatusOnline')
		return 'online';
	if (status._ == 'userStatusOffline') 
		return 'last seen ' + lastSeen(status.was_online)
	if (status._ == 'userStatusRecently')
		return 'last seen recently';
	if (status._ == 'userStatusLastWeek')
		return 'last seen last week';
	if (status._ == 'userStatusLastMonth')
		return 'last seen last month'; 
}
function createPeerWindow(peer) {
	var el, msgcontainer, scrcontainer, estatus, etextarea, esend, msgs = [];
	var info = peer.user || peer.chat;
	peerListeners.push(peer.id+'-'+peer.listenDialog(function (new_peer) {
		var pic = el.querySelector('.picture'),
			info = new_peer.chat || new_peer.user;
		if (info.photo && info.photo.smallLoaded &&
			pic.querySelector('img') == null) {
			var img = _peerImage(new_peer)
			pic.appendChild(img);
		}

		if (new_peer.chat) {
			estatus.innerText = (peer.chat.membersCount==null ? "" : peer.chat.membersCount.toLocaleString() + " members");
		} else {
			$setclass(estatus, 'online', new_peer.user.status && new_peer.user.status._ == 'userStatusOnline');
			estatus.innerText = userStatus(new_peer.user.status)
		}
	}));
	function updateMessages(p, todelete) {
		console.log('updateMessages()');
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
		if (todelete) {
			for (var i = 0; i < todelete.length; ++i) {
				if ($(ps+todelete[i]))
					$(ps+todelete[i]).remove();
			}
		}
		scrcontainer.scrollTop += (scrcontainer.scrollHeight - lastScrollHeight);
		$n(function () {
			if ($("#content").className.indexOf(p.id) >= 0) {
				checkHoles(true);
			}
		});
	}
	peerListeners.push(peer.id + '-' + peer.listenMessages(updateMessages));
	
	var lastHolesCheck = -1;
	function checkHoles(force) {
		console.log('checkHoles()');
		if (peer.loadingHole) {
			console.log('peer loades hole')
			return;
		}
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

	var hasInput = peer.type!='C'||(peer.chat&&peer.chat.creator);
	$('#content > div').appendChild(
		el=$new('div.'+peer.id+(hasInput?'.hasInput':''), null, [
			$new('div.header', null, [
				$new('div.picture', null, peerImage(peer)),
				$new('div.info', null, [
					$new('h2', info.title, [info.verified ? svg('verified', 'verified') : null]),
					estatus=$new('p'+(peer.user&&peer.user.status&&peer.user.status._=='userStatusOnline'?'.online':''), 
						peer.chat ? 
							(peer.chat.membersCount==null ? "" : peer.chat.membersCount + " members") : 
							userStatus(peer.user.status))
				])
			]),
			$new('div.content', null, [
				scrcontainer=$new('div.messages', null, [
					$new('div', null, [msgcontainer = $new('div')])
				], $evt(['scroll'], checkHoles)),
				(hasInput ?
					$new('div.sendbox', null, [
						$new('div', null, [
							$new('div.gradient'),
							$new('div.inputbox', null, [
								$new('div.emoji-select', null, [svg('emoji-select')], UI.addRipple),
								$new('div.text', null, [
									etextarea=$new('textarea', {
										rows: 1, 
										placeholder: "Message",
										'max-rows': 10
									}, [], $evt(['click', 'keyup', 'keypress', 'keydown', 'change'], sendMessage.bind(this, false)))
								]),
								$new('div.attach', null, [svg('attach')], UI.addRipple),
								svg('corner')
							]),
							esend=$new('div.btn.voice', null, [
								$new('div.voice', null, [svg('mic')]),
								$new('div.msg', null, [svg('send')])
							], UI.addRipple, $click(sendMessage.bind(this, true)))
						])
					])
				: null)
			])
		])
	);
	function sendMessage(button, e) {
		if (!etextarea || !esend)
			return;
		var val = etextarea.value.trim();
		if ((button || (e.keyCode == 13 && !e.ctrlKey && !e.metaKey)) && val.length > 0) {
			var message = val;
			call("messages.sendMessage", {
				peer: peer.inputPeer,
				message: message,
				random_id: randomBytes(8),
				clear_draft: true
			}, function (status, data) {
				if (status && data._ == "updateShortSentMessage") {
					data._ = 'message';
					data.from_id = auth.user.id;
					data.message = message;
					peer.putMessages([data], true);
				}
			})
			etextarea.value = val = "";
			$n(function () {etextarea.value = ''})
		} else if (e.keyCode == 13 && e.metaKey) {
			etextarea.value += '\n';
			etextarea.focus();
		}

		etextarea.style.height = 'auto';
		etextarea.style.height = range(etextarea.scrollHeight-4, 24, 128) + 'px';

		$setclass(esend, 'voice', val.length == 0);
		$setclass(esend, 'msg', val.length > 0);
	}

	if (peer.chat && !peer.chat.infoLoaded) {
		peer.chat.loadInfo();
	}
	updateMessages(peer);
	if (peer.holes.length == 0)
		peer.load();
	scrcontainer.scrollTop = scrcontainer.scrollHeight;
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
var emptyPhoto = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
function messageElement(m,p) {
	if (m._ == 'message') {
		var hasMediaPhoto = m.media && m.media.type == 'photo',
			onlyPhoto = hasMediaPhoto&&m.message.length==0,
			hasUsername = !m.pFlags.out && p.type == 'c' && users[m.from_id],
			hasViews = typeof m.views === 'number';
		var photoPreviewImg;
		if (hasMediaPhoto) {
			m.media.onUpdate = function () {
				if (photoPreviewImg) {
					photoPreviewImg.src = m.media.previewSrc;
					photoPreviewImg.className = 'photo';
				}
			}
		}
		return $new('div'+(m.pFlags.out?'.out':'.in')+(onlyPhoto?'.photo':'')+(hasUsername?'.usertitle':'')+(hasViews?'.views':'')+'#'+p.id+'-'+m.id, null, [
			$new('span', null, [
				(hasUsername ? $new('h2', users[m.from_id].title, [], function (el) {
					el.style.color = userColors[(parseInt(users[m.from_id].id) % userColors.length)];
				}) : null),
				(typeof m.reply_to_msg_id !== 'undefined' && p.messages[m.reply_to_msg_id] &&
					users[p.messages[m.reply_to_msg_id].from_id] ? 
					$new('span.reply', null, [
						$new("h2", users[p.messages[m.reply_to_msg_id].from_id].title),
						$new('span', shorttext(p.messages[m.reply_to_msg_id].message, 25))
					], UI.addRipple)
				: null),
				(hasMediaPhoto ?
					$new('span.photo'+(m.media.previewSrc == null ? '.loading' : ''), null, [
						photoPreviewImg = $new('img', 
							assign({
								width: m.media.previewSize.w / window.devicePixelRatio,
								height: m.media.previewSize.h / window.devicePixelRatio,
								src: m.media.previewSrc || emptyPhoto
							}), null, function (img) {
								// img.style.width = m.media.previewSize.w / window.devicePixelRatio + "px";
								// img.style.height = m.media.previewSize.h / window.devicePixelRatio + "px";
							})
					])
				: null),
				$new('span', m.message),
				$new('div', null, [
					(hasViews ? 
						$new('span.views', null, [
							svg('eye'),
							$new('span', m.views.toLocaleString())
						])
					: null),
					$new('span.time', dateToTimeString(m.date))
				]),
				(!onlyPhoto ? svg('corner') : null)
			])
		]);
	} else if (m._ == 'messageService') {
		return $new('div.sys#'+p.id+'-'+m.id, null, [
			$new('span', messageServiceContent(m, p))
		])
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