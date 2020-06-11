var ids = {u:'user_id',C:'channel_id',c:'chat_id'};
var peerType = {peerUser: 'u', peerChannel: 'C', peerChat: 'c'};
var peerName = {u:'peerUser',C:'peerChannel',c:'peerChat'};
var inputPeerName = {u:'inputPeerUser',C:'inputPeerChannel',c:'inputPeerChat'};
function peerID(peer) {
	return peerType[peer._]+peer[ids[peerType[peer._]]];
}

var ext = {};
var ExternalMTProto = MTProto.extend({
	constructor: function (options) {
		var self = this;
		this.id = S(options.photo_id);
		this._super(options);
		this.before = function (callback) {
			function importAuth(data) {
				self.sendAPIMethod('auth.importAuthorization', {
					id: data.id,
					bytes: data.bytes
				}, function (status, data) {
					if (status && data._ == "auth.authorization") {
						callback();
					} else {
						self.warn('failed to import authorization', data);
					}
				}, true);
			}
			
			proto.sendAPIMethod('auth.exportAuthorization', {
				dc_id: self.DC
			}, function (status, data) {
				if (status && data._ == 'auth.exportedAuthorization') {
					importAuth(data);
				} else {
					self.warn('failed to export authorization', data);
				}
			})
		}
		this.connect();
	}
})
var ProfilePhoto = Class.extend({
	constructor: function (data, inputPeer, onUpdate) {
		this.conn = proto;

		this.dc_id = data.dc_id || 2;

		this.filename = null;
		this.size = null;
		this.isSticker = false;
		this.isAnimatedSticker = false;

		this.onUpdate = onUpdate;
		this.inputPeer = inputPeer;
		this.blob = null;
		this.src = null;

		if (data._.toLowerCase().indexOf('empty') >= 0)
			return;
		this.volume_id = data.photo_small.volume_id;
		this.local_id = data.photo_small.local_id;
		this.load();
	},
	load: function () {
		var self = this;
		loadDeprecatedLocation(this.dc_id, {
			_: "inputPeerPhotoFileLocation",
			peer: this.inputPeer,
			local_id: this.local_id,
			volume_id: this.volume_id
		}, (blob, src) => {
			self.blob = blob;
			self.src = src;
			if (typeof self.onUpdate === 'function') {
				self.onUpdate();
			}
		});
	}
});
function title(data) {
	if (data && data._ == 'user')
		return data.first_name + (data.last_name ? ' ' + data.last_name : '');
	return data ? data.title : ''
}

var Media = Class.extend({
	constructor: function (data, message, peer) {
		this.onUpdate = null;
		this.type = data._.slice(12).toLowerCase();
		this.raw = data;
		this.message = message;
		this.peer = peer;

		this.ready = true;
		if (this.type == 'empty') {
			// ok...
		} else if (this.type == 'photo') {
			this.photoRaw = data.photo;
			if (this.photoRaw._ == 'photoEmpty') {
				// ehm, ok...
				return;
			}

			this.photo = this.photoRaw;
			this.photo.src = null;
			this.photo.previewSrc = null;
			this.ready = false;
			this.loadPreviewPhoto();
		} else {
			// TODO
		}
	},
	loadPreviewPhoto: function () {
		var sizes = this.photo.sizes;
		var preferableSizes = "xmyswabcd";
		var types = map(sizes, function (size) {return size.type});
		var size = null;
		for (var p = 0; p < preferableSizes.length; ++p) {
			if (types.indexOf(preferableSizes[p]) >= 0) {
				size = sizes[types.indexOf(preferableSizes[p])];
				break;
			}
		}
		if (size == null) {
			console.warn("size for preview not found");
			return;
		}
		this.previewSize = size;
		if (!size.location) {
			console.warn("location in size object is missing");
			return;
		}

		var self = this;
		loadDeprecatedLocation(this.photo.dc_id, {
			_: "inputPhotoFileLocation",
			access_hash: this.photo.access_hash,
			file_reference: this.photo.file_reference,
			thumb_size: size.type,
			id: this.photo.id
		}, (blob, src) => {
			self.previewSrc = src;
			self.previewBlob = blob;
			if (typeof self.onUpdate === 'function')
				self.onUpdate();
		});
	},
	loadPhoto: function () {

	}
});

function loadDeprecatedLocation(dcid, location, callback) {
	var conn;
	if (dcid == proto.DC) {
		conn = proto;
	} else {
		if (proto.DC != dcid && !ext[dcid]) {
			ext[dcid] = new ExternalMTProto({
				debug: true,
				DC: dcid
			});
			conn = ext[dcid];
		} else if (dcid != proto.DC && ext[dcid])
			conn = ext[dcid];
	}

	conn.sendAPIMethod('upload.getFile', {
		location: location,
		offset: 0,
		limit: 1024 * 1024
	}, (status, data) => {
		if (status) {
			if (data._ == 'upload.file') {
				var blob = new Blob([data.bytes]);
				var src = URL.createObjectURL(blob);
				callback(blob, src);
			}
		} else {
			console.warn('upload.getFile: bad response');
		}
	})
}

var chats = {};
var users = {};
var User = Class.extend({
	constructor: function (data, peer) {
		this.peers = peer ? [peer] : [];

		this.id = data.id;
		this.access_hash = data.access_hash;
		if (data.pFlags.deleted) {
			this.title = 'Deleted Account';
			this.short = ':(';
			this.photo = null;
		} else {
			this.title = title(data);
			this.short = data.last_name ? (data.first_name[0]+data.last_name[0]).toUpperCase() :
										   data.first_name[0].toUpperCase();
			this.phone = data.phone || false;
			this.photo = data.photo && data.photo._ != 'chatPhotoEmpty' ? new ProfilePhoto(data.photo, {
				_: "inputPeerUser",
				user_id: this.id,
				access_hash: this.access_hash
			}, this.update.bind(this)) : null;

			this.status = data.status;
		}
		this.verified = data.pFlags ? data.pFlags.verified : false;	

		this.raw = data;
	},
	addPeer: function (peer) {
		this.peers.push(peer);
	},
	forgetPeer: function (peer) {
		for (var i = 0; i < this.peers.length; ++i) {
			if (this.peers[i].id == peer.id) {
				this.peers.splice(i, 1);
				i--;
			}
		}
	},
	updInfo: function (new_data) {
		this.update();
	},
	update: function () {
		for (var i = 0; i < this.peers.length; ++i)
			this.peers[i].update();
	}
});
var Chat = Class.extend({
	constructor: function (data, peer) {
		this.peers = peer ? [peer] : [];

		this.id = data.id;
		this.access_hash = data.access_hash || null;
		this.title = title(data);

		this.short = this.title.split(' ').length > 1 ? map(this.title.split(' ').slice(0,2),function(s){return s[0]}).join('').toUpperCase() :
														this.title.slice(0, 2).toUpperCase();

		this.creator = data.pFlags ? data.pFlags.creator : false;
		this.isChat = data._ == 'chat';
		this.isChannel = data._ == 'channel';

		var inputPeer;
		if (data._ == 'chat') {
			inputPeer = {
				_: "inputPeerChat",
				chat_id: data.id,
				access_hash: this.access_hash
			}
		} else if (data._ == 'channel') {
			inputPeer = {
				_: "inputPeerChannel",
				channel_id: data.id,
				access_hash: this.access_hash
			};
		}
		this.photo = data.photo && inputPeer ? new ProfilePhoto(data.photo, inputPeer, this.update.bind(this)) : null;

		this.raw = data;

		this.members = null;
		this.membersCount = data.participants_count || null;
		this.status = null;

		this.verified = data.pFlags ? data.pFlags.verified : false;

		this.infoLoaded = false;
		this.info = null;
	},
	addPeer: function (peer) {
		this.peers.push(peer);
	},
	forgetPeer: function (peer) {
		for (var i = 0; i < this.peers.length; ++i) {
			if (this.peers[i].id == peer.id) {
				this.peers.splice(i, 1);
				i--;
			}
		}
	},
	update: function () {
		for (var i = 0; i < this.peers.length; ++i)
			this.peers[i].update();
	},
	updInfo: function (new_data) {

	},
	loadInfo: function () {
		if (this.infoLoaded)
			return;

		console.log('loading info')

		var self = this;
		call(this.isChat ? 'messages.getFullChat' : 'channels.getFullChannel', {
			chat_id: this.id,
			channel: {
				_: 'inputChannel',
				channel_id: this.id,
				access_hash: this.access_hash
			}
		}, function (status, data) {
			if (!status) {
				console.warn('failed to load chat/channel info');
				return;
			}

			console.log('info loaded: ', data);

			self.infoLoaded = true;
			if (data.users)
				pushUsers(data.users);
			if (data.chats)
				pushChats(data.chats);

			self.info = data.full_chat;
			if (self.info.participants_count)
				self.membersCount = self.info.participants_count;
			else {
				self.membersCount = self.info.participants.length;
			}

			self.update();
		})
	}
})
var Peer = Class.extend({
	constructor: function (peer, dialog) {
		this.onDialogUpdate = {};
		this.onMessagesUpdate = {};

		this.type = peerType[peer._];
		this.id = peerID(peer);
		if (typeof peers[this.id] === 'undefined')
			peers[this.id] = this;

		this.access_hash = null;
		this.messages = {};
		this.messagesCount = -1;
		this.holes = [];

		if (dialog)
			this.obtainInfo(dialog);
		this.inputPeer = this._inputPeer();
		if (dialog.channel && dialog.channel.raw.pFlags.megagroup)
			this.type = 'c';
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
			var msg = this.messages[hole.id];
			offset = {
				offset_id: hole.id,
				offset_date: 0,//hole.dir ? 0 : msg.date,
				add_offset: hole.dir ? 0 : -20,
				limit: 20,
				max_id: 0,//hole.dir ? hole.id : 0,
				min_id: 0,//hole.dir ? 0 : hole.id,
				hash: 0
			};
		}

		var self = this;
		self.loadingHole = true;
		call('messages.getHistory', assign({
			peer: this.inputPeer
		}, offset), function (status, data) {
			if (status) {
				self.loadingHole = false;
				self.receiveHistory(hole_id, data);
			} else {
				if (data.error_message.slice(0, 11) == 'FLOOD_WAIT_') {
					var s = parseInt(data.error_message.slice(11));
					console.warn('getHistory: FLOOD (waiting ' + s + " seconds)");
					$t(s * 1000, self.loadHole.bind(self, hole_id));
				} else 
					self.loadingHole = false;
			}
		});
	},
	receiveHistory: function (hole_id, data) {
		if (data.users) {
			pushUsers(data.users);
		}

		if (!data.messages)
			return;
		if (data.count)
			this.messagesCount = data.count;
		this.putMessages(data.messages);

		if (typeof hole_id === 'undefined') {
			this.holes.push({
				id: data.messages[data.messages.length-1].id,
				dir: true
			});
			hole_id = this.holes.length-1;
		}

		var hole = this.holes[hole_id];
		for (var i = 0; i < this.holes.length; ++i) {
			if (i == hole_id) continue;
			for (var j = 0; j < data.messages.length; ++j) {
				if (data.messages[j].id == this.holes[i].id &&
					(this.holes[i].dir ? j != data.messages.length-1 : j != 0)) {
					this.holes.splice(i, 1);
					i--;
					continue;
				}
			}
		}
		if (hole && hole.dir && data.messages.length > 0) {
			if (data.messages[data.messages.length-1].id != 0 &&
				Object.keys(this.messages).length != this.messagesCount)
				this.holes.push({
					id: data.messages[data.messages.length-1].id,
					dir: true
				})	
		} else if (hole && !hole.dir && data.messages.length > 0) {
			if (data.messages[0].id != this.top_message &&
				Object.keys(this.messages).length != this.messagesCount)
				this.holes.push({
					id: data.messages[0].id,
					dir: false
				})
		}

		if (hole) {
			for (var i = 0; i < this.holes.length; ++i) {
				if (this.holes[i].id == hole.id && 
					this.holes[i].dir == hole.dir) {
					this.holes.splice(i, 1);
				}
			}
		}

		this.update();
	},
	processMessage: function (msg) {
		if (msg.media) {
			msg.mediaRaw = msg.media;
			msg.media = new Media(msg.media, msg, this);
		}
		return msg;
	},
	putMessages: function (messages, update, holeBefore, holeAfter) {
		for (var i = 0; i < messages.length; ++i) {
			var message = this.processMessage(messages[i]);
			this.messages[messages[i].id] = message;
			if (message.id > this.top_message)
				this.top_message = message.id;
		}
		if (holeBefore) {
			this.holes.push({
				dir: true,
				id: messages[0].id
			})
		}
		if (holeAfter) {
			this.holes.push({
				dir: false,
				id: messages[messages.length-1].id
			})
		}
		if (update)
			this.update();
	},
	deleteMessages: function (ids) {
		for (var i = 0; i < ids.length; ++i) {
			delete this.messages[ids[i]];
		}

		for (var i = 0; i < ids.length; ++i) {
			for (var j = 0; j < this.holes.length; ++j) {
				var hole = this.holes[j];
				if (hole.id == ids[i]) {
					for (var u = hole.id; hole.dir ? u >= 0 : u <= this.top_message; hole.dir ? u-- : u++) {
						if (this.messages[u]) {
							this.holes[j].id = u;
							break;
						}
					}
				}
			}
		}

		this.update(ids);
	},
	update: function(todelete) {
		for (var k in this.onDialogUpdate)
			this.onDialogUpdate[k](this, todelete);
		for (var k in this.onMessagesUpdate)
			this.onMessagesUpdate[k](this, todelete);
	},
	_inputPeer: function () {
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
		this.unread = dialog.unread_count;
		this.unread_mentions = dialog.unread_mentions_count;
		this.top_message = dialog.top_message || -1;
		if (dialog.user) {
			if (this.user && this.user.id != dialog.user.id) {
				this.user.forgetPeer(this);
			}
			if (!this.user || this.user.id != dialog.user.id) {
				this.user = dialog.user;
				this.user.addPeer(this);
			}
			this.access_hash = dialog.user.access_hash;
		}
		if (dialog.channel || dialog.chat) {
			var chat = dialog.channel || dialog.chat;
			if (this.chat && this.chat.id != chat.id) {
				this.chat.forgetPeer(this);
			}
			if (!this.chat || this.chat.id != chat.id) {
				this.chat = chat;
				this.chat.addPeer(this);
			}
			this.access_hash = (dialog.channel || dialog.chat).access_hash;
		}
		if (dialog.message) {
			this.messages[this.top_message] = this.processMessage(dialog.message);
			this.holes.push({
				dir: true, // before
				id: dialog.message.id
			});
		}
		this.pinned = dialog.pFlags ? dialog.pFlags.pinned || false : false;
		this.notify = dialog.notify_settings ? {
			show_priviews: dialog.notify_settings.show_priviews || false,
			silent: dialog.notify_settings.silent || false,
			mute_until: dialog.notify_settings.mute_until || -1,
			sound: dialog.notify_settings.sound || 'def'
		} : null;
		if (dialog._ == 'dialog')
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

proto.listenUpdates(receiveUpdates);

function receiveUpdates(updMsg) {
	pushUsers(updMsg.users);
	pushChats(updMsg.chats);

	if (updMsg._ == 'updates') {
		var toput = {}, todelete = {};
		for (var i = 0; i < updMsg.updates.length; ++i) {
			var upd = updMsg.updates[i], t = upd._.slice(6);
			if (t == 'NewMessage') {
				var pid = peerID(upd.message.to_id);
				if (!toput[pid])
					toput[pid] = [];
				toput[pid].push(upd.message);
			} else if (t == 'DeleteMessages') {
				for (var i = 0; i < upd.messages.length; ++i) {
					for (var pid in peers) {
						if (peers[pid].messages[upd.messages[i]]) {
							if (!todelete[pid])
								todelete[pid] = [];
							todelete[pid].push(upd.messages[i]);
						}
					}
				}
			} else
				processUpdate(upd);
		}
		for (var pid in toput) {
			console.log(pid);
			console.log(peers)
			peers[pid].putMessages(toput[pid])
		}
		for (var pid in todelete) {
			peers[pid].deleteMessages(todelete[pid]);
		}

	} else if (updMsg._ == "updateShortChatMessage") {
		newmessage('c'+updMsg.chat_id, updMsg);
	} else if (updMsg._ == 'updateShortMessage') {
		newmessage('u'+updMsg.user_id, updMsg);
	} else if (updMsg._ == 'updateShort') {
		processUpdate(updMsg.update);
	}
}
function processUpdate(upd) {
	var t = upd._.slice(6);
	if (t == 'UserStatus') {
		if (users[upd.user_id]) {
			users[upd.user_id].status = upd.status;
			if (typeof users[upd.user_id].update !== 'function') {
				console.error("WTF????????");
				console.log(users[upd.user_id], upd)
			} else
				users[upd.user_id].update();
		}
	}
}
function newmessage(peerid, message) {
	if (peers[peerid]) {
		if (['message','messageService','messageEmpty'].indexOf(message._) < 0)
			message._ = 'message';
		peers[peerid].putMessages([message], true);
	}
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

function pushUsers(uarr) {
	if (!Array.isArray(uarr))
		return;
	for (var i = 0; i < uarr.length; ++i) {
		if (!users[uarr[i].id])
			users[uarr[i].id] = new User(uarr[i]);
		// else users[uarr[i].id].updInfo(uarr[i]);
	}
}
function pushChats(carr) {
	if (!Array.isArray(carr))
		return;
	for (var i = 0; i < carr.length; ++i) {
		if (!chats[carr[i].id])
			chats[carr[i].id] = new Chat(carr[i]);
		// else chats[carr[i].id].updInfo(carr[i]);
	}
}

function receiveDialogs(offset, status, result) {
	if (!status)
		return;
	if (result._ == 'messages.dialogsSlice')
		dialogsCount = result.count;
	else dialogsCount = result.dialogs.length;

	pushUsers(result.users);
	pushChats(result.chats);

	for (var i = 0, j = 0; i < result.dialogs.length; ++i) {
		var dialog = result.dialogs[i], peerid = peerID(dialog.peer), type = peerid[0], id = parseInt(peerid.slice(1));
		if (type == 'u') { // user
			dialog.user = users[dialog.peer.user_id]
		} else if (type == 'C' || type == 'c') { // chat or channel
			var key = type == 'c' ? 'chat' : 'channel';
			dialog[key] = chats[dialog.peer[key+'_id']];
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

function updateStatus(isOnline) {
	call('account.updateStatus', {
		offline: !isOnline ? {_: 'boolTrue'} : {_: 'boolFalse'}
	}, function (status, data) {
		if (!status) {
			console.warn('failed to update status');
			return
		}

		var isOnline = data._ == 'boolFalse';
		if (users[auth.user.id]) {
			users[auth.user.id].status = {_: "userStatusOnline"};
			users[auth.user.id].update();
		}
	})
}