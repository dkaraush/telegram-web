function closeApp() {
	$addclass($('#app'), 'hidden');
	$t(200, function () {$('#app').style.display = 'none';});
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
	});
}

function formatLastMessageDate(date) {
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
	if (t - date < 7 * 24 * 60 * 60) {
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
	var year = d.getFullYear();
	if (date < 10) date = '0'+date;
	if (month < 10) month = '0'+month;
	return month+'.'+date+'.'+year;
}

const actionTitles = {
	ChatCreated: "Chat was created",
	ChatEditTitle: "Chat's title was changed",
	ChatEditPhoto: "Chat's photo was changed",
	ChatDeletePhoto: "Chat's photo was deleted",
	ChatAddUser: "{user} joined",
	ChatDeleteUser: "{user} was deleted",
	ChatJoinedByLink: "{user} joined by link",
	ChannelCreate: "Channel was created",
	ChatMigrateTo: "Chat migrated to {channel}",
	ChannelMigrateFrom: "Channel migrated from {chat}",
	PinMessage: "Message pinned",
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
}
function shortMessageElement(message, peer) {
	if (message == null || message._ == 'messageEmpty')
		return '';
	if (message._ == 'message') {
		var m = $new('span', message.message);
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
		var s = actionNames[message.action._.slice(12)];
		if (message.user_id)
			s = s.replace('{user}', title(users[message.user_id])||'');
		if (message.chat_id)
			s = s.replace('{chat}', title(chats[message.chat_id])||'');
		if (message.channel_id)
			s = s.replace('{chat}', title(chats[message.channel_id])||'');
		if (message.message)
			s = s.replace('{message}', message.message);
		if (message.domain)
			s = s.replace('{domain}', message.domain);
		if (message.score)
			s = s.replace('{score}', message.score);
		return [$new('span.active', s)];
	}
}

var dialogListeners = [];
const userColors = ['#8365ab','#539e4f','#ae9661','#4979a3','#b7635d','#b3577a','#5397b4','#c07844'];
function peerImage(peer) {
	var a = [$new('div.empty', peer.info.short, [], function (el) {
				el.style.backgroundColor = userColors[(parseInt(peer.id.slice(1)) % userColors.length)];
			})];
	if (peer.info.photo != null && peer.info.photo.src != null)
		a.push(_peerImage(peer));
	return a;
}
function _peerImage(peer, appearing) {
	return $new('img', null, [], function (el) {
					el.src = peer.info.photo.src;
					if (appearing) {
						el.style.opacity = 0;
						$t(16, function () {el.style.opacity = 1});
					}
				});
}
function dialogElement(peer) {
	var message = peer.messages[peer.info.top_message], el,
		einfo, etitle, edate, elastMessage;
	dialogListeners.push(peer.id + '-' + peer.listenDialog(function (new_peer) {
		var pic = el.querySelector('.picture');
		if (new_peer.info.photo && new_peer.info.photo.src != null &&
			pic.querySelector('img') == null) {
			var img = _peerImage(new_peer, true)
			pic.appendChild(img);
		}

		etitle.innerText = new_peer.info.title;
		var message = new_peer.messages[new_peer.info.top_message];
		if (message && einfo.id != 'm--'+message.id) {
			edate.innerText = formatLastMessageDate(message.date);
			elastMessage.innerHTML = '';
			$append(elastMessage, shortMessageElement(message, new_peer));
			einfo.id = 'm--'+message.id;
		}
	}));
	return el = $new('div.dialog#'+peer.id, null, [
		$new('div.picture', null, peerImage(peer)),
		einfo=$new('div.info'+(message?'#m--'+message.id:''), null, [
			etitle=$new('h2', peer.info.title),
			edate=$new('span.date', formatLastMessageDate(message.date)),
			elastMessage=$new('span.content', null, shortMessageElement(message, peer))
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
		var lastMessage = lastPeer.messages[lastPeer.info.top_message];
		var key = ({u:'User',c:'Channel',C:'Chat'})[lastPeer.id[0]];
		var keyid = ({u:'user_id',c:'channel_id',C:'chat_id'})[lastPeer.id[0]];
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

function leftsidebarSwitch(page) {
	var active = $('#left-sidebar .' + $('#left-sidebar').className);
	$t(200, function () {active.style.display = 'none';});
	$('#left-sidebar .'+page).style.display = 'block';
	$t(16, function () {$("#left-sidebar").className = page;});
}

var searchInput = $('#left-sidebar .searchbox input');
$ev(searchInput, ['keyup','change','focus'], function () {
	var val = searchInput.value;
	if (val.length > 0 && $('#left-sidebar').className != 'search') {
		leftsidebarSwitch('search');
	} else if (val.length == 0 && $('#left-sidebar').className == 'search') {
		leftsidebarSwitch('dialogs');
	}
});