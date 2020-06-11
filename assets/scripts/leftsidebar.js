function closeApp() {
	$addclass($('#app'), 'hidden');
	$t(200, function () {$('#app').style.display = 'none';});
	updateStatus(false);
}
function startApp() {
	$('#app').style.display = 'block';
	$t(16, function () {$rmclass($('#app'), 'hidden');});
	$ev($win, 'beforeunload', closeApp);

	$onload(function () {
		call('messages.getDialogs', {
			offset_id: 0,
			offset_peer: {_: 'inputPeerEmpty'},
			offset_date: 0,
			limit: 12,
			hash: 0
		}, receiveDialogs.bind(this, 0));

		updateStatus(true);
	});
}

function formatLastMessageDate(date, p) {
	var n = new Date();
	var t = Date.now() / 1000, d = new Date(date*1000);
	var ns = n.toDateString(), ds = d.toDateString();
	if (ns == ds) {
		// same day => show time
		var h = d.getHours();
		var m = d.getMinutes();
		if (h < 10) h = '0'+h;
		if (m < 10) m = '0'+m;
		return h+':'+m;
	}
	if (t - date < /*7*/ 6 * 24 * 60 * 60) {
		// ~same week => show week day
		return (['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])[d.getDay()-1];
	}
	if (n.getFullYear() == d.getFullYear()) {
		// same year => show date
		var date = d.getDate();
		var month = d.getMonth();
		return date + ' ' + (['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dev'])[month];
	}
	var date = d.getDate();
	var month = d.getMonth()+1;
	var year = d.getFullYear()-2000;
	if (date < 10) date = '0'+date;
	if (month < 10) month = '0'+month;
	return month+'.'+date+'.'+year;
}

const serviceTitles = {
	ChatCreate: "{ouser} created the group «{title}»",
	ChatEditTitle: "{ouser} changed group name to «{title}»",
	ChatEditPhoto: "{ouser} updated group photo",
	ChatDeletePhoto: "{ouser} removed group photo",
	ChatAddUser: "{users} joined the group",
	ChatDeleteUser: "{user} left group",
	ChatJoinedByLink: "{user} joined by {inviter}'s link",
	ChannelCreate: "Channel created",
	ChatMigrateTo: "Group migrated to supergroup",
	ChannelMigrateFrom: "Channel migrated to «{chat}»",
	PinMessage: "{ouser} pinned message",
	HistoryClear: "History was cleared",
	GameScore: "Scored {score}",
	PaymentSentMe: "Payment sent to you",
	PaymentSent: "Payment sent",
	PhoneCall: "Phone call",
	ScreenshotTaken: "Screenshot taken",
	CustomAction: "{message}",
	BotAllowed: "Logged in {domain}",
	SecureValuesSentMe: "Secure values",
	SecureValuesSent: "Secure values",
	ContactSignUp: "Signed up in Telegram!"
};
function shortMessageElement(message, peer) {
	if (message == null || message._ == 'messageEmpty')
		return '';
	var messagetext = message.message;
	if (message._ == 'message') {
		var m = $new('span', shorttext(messagetext, 100));
		if (peer.type == "u" || peer.type == "c") {
			if (message.pFlags.out) {
				return [$new('span.active', 'You: '), m];
			} else if (peer.type == 'u') {
				return [m];
			} else {
				var user = users[message.from_id];
				if (user)
					return [$new('span.active', title(user) +': '), m]
				else return [m];
			}
		} else {
			return [m];
		}
	} else if (message._ == 'messageService') {
		return [$new('span.active', messageServiceContent(message, peer))];
	} else {
		return [];
	}
}
function shorttext(t, n) {
	return t.length <= (n||20) ? t : t.slice(0, n||20)+'...';
}
function messageServiceContent(message, peer) {
	var a = message.action;
	var s = serviceTitles[a._.slice(13)] || '',
		opts = {
			users: function () {return map(a.users, function (user_id) {
				return title(users[user_id]);
			}).join(', ')},
			ouser: function () {return title(users[message.from_id])},
			user: function () {return title(users[a.user_id])},
			chat: function () {return title(chats[a.chat_id])},
			channel: function () {return title(chats[a.channel_id])},
			message: function () {return shorttext((peer.messages[a.message_id]||{message:''}).message)},
			domain: function () {return a.domain},
			score: function () {return a.score},
			inviter: function () {return title(users[a.inviter_id])},
			title: function () {return a.title}
		};
	for (var k in opts) {
		if (s.indexOf('{'+k+'}') >= 0) {
			s = s.replace(new RegExp('{'+k+'}'), opts[k]());
		}
	}
	return s || '';
}

var dialogListeners = [];
const userColors = ['#8365ab','#539e4f','#ae9661','#4979a3','#b7635d','#b3577a','#5397b4','#c07844'];
function peerImage(peer) {
	var i = peer.user || peer.chat;
	var a = [$new('div.empty', i?i.short:'', [], function (el) {
				el.style.backgroundColor = userColors[(parseInt(peer.id.slice(1)) % userColors.length)];
			}), $new('span')];
	if (i && i.photo != null && i.photo.src != null)
		a.push(_peerImage(peer));
	return a;
}
function _peerImage(peer, appearing) {
	var i = peer.user || peer.chat;
	return $new('img', null, [], function (el) {
					el.src = i.photo.src;
					if (appearing) {
						el.style.opacity = 0;
						$t(16, function () {el.style.opacity = 1});
					}
				});
}
function dialogElement(peer, msg) {
	var inputMessage = msg;
	var message = inputMessage || peer.messages[peer.top_message], el,
		einfo, etitle, edate, elastMessage;
	var inf = peer.user || peer.chat;
	dialogListeners.push(peer.id + '-' + peer.listenDialog(function (new_peer) {
		var pic = el.querySelector('.picture'), inf = new_peer.user || new_peer.chat;
		if (inf.photo && inf.photo.src != null &&
			pic.querySelector('img') == null) {
			var img = _peerImage(new_peer, true)
			pic.appendChild(img);
		}

		if (inf.status)
			$setclass(pic, 'online', inf.status._ == 'userStatusOnline')

		etitle.innerText = inf.title;
		if (inf.verified)
			etitle.appendChild(svg('verified', 'verified'))
		var message = inputMessage || new_peer.messages[new_peer.top_message];
		if (message && einfo.id != 'm--'+message.id) {
			edate.innerText = formatLastMessageDate(message.date);
			elastMessage.innerHTML = '';
			$append(elastMessage, shortMessageElement(message, new_peer));
			einfo.id = 'm--'+message.id;
		}
	}));

	return el = $new('div.dialog#'+peer.id+(inf&&inf.status&&inf.status._=='userStatusOnline'?'.online':''), null, [
		$new('div.picture', null, peerImage(peer)),
		einfo=$new('div.info'+(message?'#m--'+message.id:''), null, [
			etitle=$new('h2', inf?inf.title:'', [inf&&inf.verified ? svg('verified', 'verified') : null]),
			edate=$new('span.date', formatLastMessageDate(message.date, peer)),
			elastMessage=$new('span.content', null, shortMessageElement(message, peer)),
			peer.pinned ? svg('pin', 'pin') : null
		])
	], UI.addRipple, $click(function () {
		openPeer(peer);
	}));
}

var dialogContainer = $('#left-sidebar .dialogs');
function renderDialogs() {
	clearDialogs();
	for (var i = 0; i < dialogs.length; ++i) {
		dialogContainer.appendChild(dialogElement(peers[dialogs[i]]));
	}
}
function clearDialogs() {
	dialogContainer.innerHTML = '';
	for (var i = 0; i < dialogListeners.length; ++i) {
		let id = dialogListeners[i]
		let peerid = id.slice(0, id.indexOf('-'));
		let listenerid = id.slice(id.indexOf('-')+1);
		peers[peerid].forgetDialog(listenerid);
	}
}
function appendNewDialogs() {
	for (var i = 0; i < dialogs.length; ++i) {
		if (!$('#'+dialogs[i]))
			dialogContainer.appendChild(dialogElement(peers[dialogs[i]]));
	}
	loadingNewDialogs = false;
}
var loadingNewDialogs = false;
$ev(dialogContainer, ['scroll'], function () {
	if (dialogContainer.scrollTop+dialogContainer.clientHeight >= dialogContainer.scrollHeight-10*window.devicePixelRatio &&
		!loadingNewDialogs && dialogsCount != dialogs.length) {
		loadingNewDialogs = true;

		var lastPeer = peers[dialogs[dialogs.length-1]];
		var lastMessage = lastPeer.messages[lastPeer.top_message];
		var key = ({u:'User',C:'Channel',c:'Chat'})[lastPeer.id[0]];
		var keyid = ({u:'user_id',C:'channel_id',c:'chat_id'})[lastPeer.id[0]];
		var peerObj = {_: 'inputPeer'+key};
		peerObj[keyid] = (lastPeer.id.slice(1));
		call('messages.getDialogs', {
			offset_date: lastMessage.date,
			offset_peer: peerObj,
			offset_id: lastPeer.id.slice(1),
			limit: 12,
			hash: 0
		}, receiveDialogs.bind(this, dialogs.length));
	}
});

var leftsidebarSwitching = false;
function leftsidebarSwitch(page) {
	if (leftsidebarSwitching) return;
	leftsidebarSwitching = true;
	var active = $('#left-sidebar .' + $('#left-sidebar').className);
	$t(200, function () {
		leftsidebarSwitching = false;
		active.style.display = 'none';
	});
	$('#left-sidebar .'+page).style.display = 'block';
	$n(function () {$("#left-sidebar").className = page;});
}

var lastSearchQuery = "";
var searchInput = $('#left-sidebar .searchbox input');
$ev(searchInput, ['change','keyup','focus'], function () {
	var val = searchInput.value;
	if (lastSearchQuery == val)
		return;
	lastSearchQuery = val;

	if (val.length > 0 && $('#left-sidebar').className != 'search') {
		leftsidebarSwitch('search');
	} else if (val.length == 0 && $('#left-sidebar').className == 'search') {
		leftsidebarSwitch('dialogs');
	}

	if (val.length > 0) {
		proto.sendAPIMethod('messages.searchGlobal', {
			q: val,
			offset_rate: 0,
			offset_peer: {
				_: 'inputPeerEmpty'
			},
			offset_id: 0,
			limit: 20
		}, receiveSearchResult);
	}
});

var searchResults = $('.content .search div');
function receiveSearchResult(status, data) {
	if (!status)
		return;

	if (data.users)
		pushUsers(data.users);
	if (data.chats)
		pushChats(data.chats);

	searchResults.innerHTML = "";
	for (var i = 0; i < data.messages.length; ++i) {
		var peerRaw = data.messages[i].to_id,
			peerid = peerID(peerRaw),
			dialog;
		if (!peers[peerid]) {
			dialog = {};
			if (peerid[0] == 'u') {
				dialog.user = users[peerRaw.user_id];
			} else
				dialog.chat = chats[parseInt(peerid.slice(1))];
			peers[peerid] = new Peer(peerRaw, dialog);
		}

		peers[peerid].putMessages([data.messages[i]], false, true, true);
		searchResults.appendChild(dialogElement(peers[peerid], data.messages[i]));
	}
}