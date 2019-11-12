var ids = {u:'user_id',C:'channel_id',c:'chat_id'};
var peerType = {peerUser: 'u', peerChannel: 'C', peerChat: 'c'};
var peerName = {u:'peerUser',C:'peerChannel',c:'peerChat'};
var inputPeerName = {u:'inputPeerUser',C:'inputPeerChannel',c:'inputPeerChat'};
function peerID(peer) {
	return peerType[peer._]+peer[ids[peerType[peer._]]];
}

var exportingAuthorization = false;
var exportingAuthorizationCallbacks = [];
var exportedAuthorization = null;
var ext = {};
var ExternalMTProto = MTProto.extend({
	constructor: function (options) {
		var self = this;
		this.id = S(options.photo_id);
		this._super(options);
		this.before = function (callback) {
			function importAuth() {
				self.sendAPIMethod('auth.importAuthorization', {
					id: exportedAuthorization.id,
					bytes: exportedAuthorization.bytes
				}, function (status, data) {
					if (status && data._ == "auth.authorization") {
						callback();
					} else {
						self.warn('failed to import authorization', data);
					}
				}, true);
			}

			if (exportedAuthorization == null) {
				if (exportingAuthorization) {
					exportingAuthorizationCallbacks.push(importAuth);
					return;
				}

				exportingAuthorization = true;
				proto.sendAPIMethod('auth.exportAuthorization', {
					dc_id: self.DC
				}, function (status, data) {
					if (status && data._ == 'auth.exportedAuthorization') {
						exportingAuthorization = false;
						exportedAuthorization = data;
						importAuth(exportedAuthorization);
						map(exportingAuthorizationCallbacks, function (f) {
							f(exportedAuthorization);
						});
						exportingAuthorizationCallbacks = [];
					} else {
						self.warn('failed to export authorization', data);
					}
				})
			} else {
				importAuth(exportedAuthorization);
			}
		}
		this.connect();
	}
})
var Photo = Class.extend({
	constructor: function (data, peer) {
		this.conn = proto;
		if (data.dc_id && proto.DC != data.dc_id && !ext[data.dc_id]) {
			ext[data.dc_id] = new ExternalMTProto({
				debug: true,
				DC: data.dc_id
			});
			this.conn = ext[data.dc_id];
		} else
			this.conn = proto;

		this.peer = peer;

		this.smallLoaded = false;
		this.bigLoaded = false;

		this.photo_small = data.photo_small;
		this.photo_big = data.photo_big;

		if (this.photo_small && this.photo_small._ == "fileLocationToBeDeprecated") {
			this.load('small');
		}
	},
	load: function (p) {
		var k = 'photo_'+p;
		var local_id = this[k].local_id;
		var volume_id = this[k].volume_id;
		var inputLocation = {
			_: "inputPeerPhotoFileLocation",
			peer: this.peer.inputPeer(),
			local_id: local_id,
			volume_id: volume_id
		};
		var self = this;
		this.conn.sendAPIMethod('upload.getFile', {
			location: inputLocation,
			offset: 0,
			big: p=='big',
			limit: 1024 * 1024
		}, function (status, data) {
			if (status) {
				if (data._ == 'upload.file') {
					var blob = new Blob([data.bytes]);
					self[p+'Src'] = URL.createObjectURL(blob);
					self[p+'Loaded'] = true;
					self.peer.update();
				}
			}
		});
	},
	update: function (new_data) {

	}
});

var chats = {};
var users = {};
var Peer = Class.extend({
	constructor: function (peer, dialog) {
		this.onDialogUpdate = {};
		this.onMessagesUpdate = {};

		this.type = peerType[peer._];
		console.log(peer._, this.type);
		this.id = peerID(peer);
		if (typeof peers[this.id] === 'undefined')
			peers[this.id] = this;

		this.access_hash = null;
		this.messages = {};
		this.messagesCount = -1;
		this.holes = [];

		if (dialog)
			this.obtainInfo(dialog);
	},
	load: function () {
		this.loadHole();
	},
	loadHole: function (hole_id) {
		var offset;
		if (typeof hole_id === 'undefined') {
			offset = {
				offset_id: 0,
				offset_date: 0,
				add_offset: 0,
				max_id: 0,
				min_id: 0,
				hash: 0,
				limit: 20
			};
		} else {
			var hole = this.holes[hole_id];
			var msg = this.message[hole.id];
			offset = {
				offset_id: hole.id,
				offset_date: msg.date,
				add_offset: hole.dir ? -20 : 20,
				limit: 20,
				max_id: hole.dir ? hole.id : 0,
				min_id: hole.dir ? 0 : hole.id,
				hash: 0
			};
		}

		var self = this;
		self.loadingHole = true;
		call('messages.getHistory', assign({
			peer: this.inputPeer()
		}, offset), function (status, data) {
			self.loadingHole = false;
			if (status)
				self.receiveHistory(hole_id, data);
		});
	},
	receiveHistory: function (hole_id, data) {
		// TODO: process holes
		if (!data.messages)
			return;
		if (data.count)
			this.messagesCount = data.count;
		this.putMessages(data.messages);
	},
	putMessages: function (messages) {
		for (var i = 0; i < messages.length; ++i) {
			this.messages[messages[i].id] = messages[i];
			if (messages[i].id > this.info.top_message)
				this.info.top_message = messages[i].id;
		}

		this.update();
	},
	update: function() {
		for (var k in this.onDialogUpdate)
			this.onDialogUpdate[k](this);
		for (var k in this.onMessagesUpdate)
			this.onMessagesUpdate[k](this);
	},
	inputPeer: function () {
		var obj = {
			_: inputPeerName[this.type]
		}, id = this.id.slice(1), keyid = ids[this.type];
		obj[keyid] = parseInt(id);
		if (this.access_hash != null)
			obj.access_hash = this.access_hash;
		return obj;
	},
	updateAsDialog: function (dialog) {
		this.obtainInfo(dialog);
	},
	obtainInfo: function (dialog) {
		this.info = {};
		this.info.unread = dialog.unread_count;
		this.info.unread_mentions = dialog.unread_mentions_count;
		this.info.top_message = dialog.top_message;
		if (!this.info.photo)
			this.info.photo = null;
		if (dialog.user) {
			this.access_hash = dialog.user.access_hash;
			this.info.title = (dialog.user.first_name||'') + (dialog.user.last_name ? ' '+dialog.user.last_name : '');
			this.info.short = ((dialog.user.first_name||'').trim()[0] + (dialog.user.last_name ? (dialog.user.last_name||'').trim()[0] : '')).toUpperCase();
			this.info.phone = dialog.user.phone;
			if (dialog.user.photo && dialog.user.photo._ !== 'userProfilePhotoEmpty' &&
				(!this.info.photo || this.info.photo.id !== S(dialog.user.photo.photo_id)))
				this.info.photo = new Photo(dialog.user.photo, this);
		}
		if (dialog.channel || dialog.chat) {
			var d = dialog.channel || dialog.chat;
			this.access_hash = d.access_hash;
			this.info.title = d.title;
			this.info.short = this.info.title.trim().slice(0, 2).toUpperCase();
			if (d.photo && d.photo._ !== 'chatPhotoEmpty' && d.photo._ !== 'channelPhotoEmpty' &&
				(!this.info.photo || this.info.photo.id !== S(d.photo.photo_id)))
				this.info.photo = new Photo(d.photo, this);
		}
		if (dialog.message) {
			this.messages[this.info.top_message] = dialog.message;
			this.holes.push({
				dir: true, // before
				id: dialog.message.id
			});
		}
		this.info.notify = {
			show_priviews: dialog.notify_settings.show_priviews || false,
			silent: dialog.notify_settings.silent || false,
			mute_until: dialog.notify_settings.mute_until || -1,
			sound: dialog.notify_settings.sound || 'def'
		};
		this.existInDialogs = true;
		this.update();
	},
	listenDialog: function (func) {
		var id = ~~(Math.random() * 99999) + "";
		this.onDialogUpdate[id] = func;
		return id;
	},
	forgetDialog: function (id) {
		if (this.onDialogUpdate[id])
			delete this.onDialogUpdate[id];
	},
	listenMessages: function (func) {
		var id = ~~(Math.random() * 99999) + "";
		this.onMessagesUpdate[id] = func;
		return id;
	},
	forgetMessages: function (id) {
		if (this.onMessagesUpdate[id])
			delete this.onMessagesUpdate[id];
	}
});

var dialogsCount = 0;
var dialogs = [];
var peers = {};

function call(name, params, func) {
	proto.sendAPIMethod(name, params, function (status, data) {
		if (!status && data.error_message == 'AUTH_KEY_UNREGISTERED') {
			Storage.remove('auth');
			closeApp();
			startIntro();
			return;
		}

		func.apply(this, arr(arguments));
	})
}

// var dialogsBuffer = {};
// function getDialogs(offset, callback) {
// 	call('messages.getDialogs', {
// 		offset_date: lastMessage.date,
// 		offset_peer: peerObj,
// 		offset_id: lastPeer.id.slice(1),
// 		limit: 12,
// 		hash: 0
// 	}, function (status, result) {
// 		if (status) {

// 		} else {
// 			console.warn('err', result);
// 		}
// 	});
// }

function receiveDialogs(offset, status, result) {
	if (!status)
		return;
	if (result._ == 'messages.dialogsSlice')
		dialogsCount = result.count;
	else dialogsCount = result.dialogs.length;
	for (var i = 0, j = 0; i < result.dialogs.length; ++i) {
		var dialog = result.dialogs[i], peerid = peerID(dialog.peer), type = peerid[0], id = parseInt(peerid.slice(1));
		if (type == 'u') { // user
			dialog.user = find(result.users, function (user) {
				return user.id === dialog.peer.user_id
			});
			if (dialog.user == null) {
				console.warn('didn\'t find user in dialogs response!', result);
				continue;
			}
		} else if (type == 'C' || type == 'c') { // chat or channel
			var key = type == 'c' ? 'chat' : 'channel';
			dialog[key] = find(result.chats, function (c) {
				return c.id == dialog.peer[ids[type]];
			});
			if (dialog[key] == null) {
				console.warn('didn\'t find ' + key + ' in dialogs response!', result);
			}
		}
		dialog.message = find(result.messages, function (m) {
			return m.id == dialog.top_message;
				   // m.to_id._ == peerName[type] && m.to_id[ids[type]] == id;
		});

		if (!peers[peerid]) {
			peer = new Peer(dialog.peer, dialog);
			dialogs[j + offset] = peer.id;
			j++;
		} else {
			peer = peers[peerid];
			peer.updateAsDialog(dialog);
		}
	}

	if (offset == 0)
		clearDialogs();
	appendNewDialogs();
}