const API_ID = 777307;
const API_HASH = '6d792ccd89d1daacd3c6dd41069a8b72';
const servers = ['pluto', 'venus', 'aurora', 'vesta', 'flora'];
var publicKeys = [
	{modulus: 'c150023e2f70db7985ded064759cfecf0af328e69a41daf4d6f01b538135a6f91f8f8b2a0ec9ba9720ce352efcf6c5680ffc424bd634864902de0b4bd6d49f4e580230e3ae97d95c8b19442b3c0a10d8f5633fecedd6926a7f6dab0ddb7d457f9ea81b8465fcd6fffeed114011df91c059caedaf97625f6c96ecc74725556934ef781d866b34f011fce4d835a090196e9a5f0e4449af7eb697ddb9076494ca5f81104a305b6dd27665722c46b60e5df680fb16b210607ef217652e60236c255f6a28315f4083a96791d7214bf64c1df4fd0db1944fb26a2a57031b32eee64ad15a8ba68885cde74a5bfc920f6abf59ba5c75506373e7130f9042da922179251f',exponent: '010001'},
	{modulus: 'aeec36c8ffc109cb099624685b97815415657bd76d8c9c3e398103d7ad16c9bba6f525ed0412d7ae2c2de2b44e77d72cbf4b7438709a4e646a05c43427c7f184debf72947519680e651500890c6832796dd11f772c25ff8f576755afe055b0a3752c696eb7d8da0d8be1faf38c9bdd97ce0a77d3916230c4032167100edd0f9e7a3a9b602d04367b689536af0d64b613ccba7962939d3b57682beb6dae5b608130b2e52aca78ba023cf6ce806b1dc49c72cf928a7199d22e3d7ac84e47bc9427d0236945d10dbd15177bab413fbf0edfda09f014c7a7da088dde9759702ca760af2b8e4e97cc055c617bd74c3d97008635b98dc4d621b4891da9fb0473047927',exponent: '010001'},
	{modulus: 'bdf2c77d81f6afd47bd30f29ac76e55adfe70e487e5e48297e5a9055c9c07d2b93b4ed3994d3eca5098bf18d978d54f8b7c713eb10247607e69af9ef44f38e28f8b439f257a11572945cc0406fe3f37bb92b79112db69eedf2dc71584a661638ea5becb9e23585074b80d57d9f5710dd30d2da940e0ada2f1b878397dc1a72b5ce2531b6f7dd158e09c828d03450ca0ff8a174deacebcaa22dde84ef66ad370f259d18af806638012da0ca4a70baa83d9c158f3552bc9158e69bf332a45809e1c36905a5caa12348dd57941a482131be7b2355a5f4635374f3bd3ddf5ff925bf4809ee27c1e67d9120c5fe08a9de458b1b4a3c5d0a428437f2beca81f4e2d5ff',exponent: '010001'},
	{modulus: 'b3f762b739be98f343eb1921cf0148cfa27ff7af02b6471213fed9daa0098976e667750324f1abcea4c31e43b7d11f1579133f2b3d9fe27474e462058884e5e1b123be9cbbc6a443b2925c08520e7325e6f1a6d50e117eb61ea49d2534c8bb4d2ae4153fabe832b9edf4c5755fdd8b19940b81d1d96cf433d19e6a22968a85dc80f0312f596bd2530c1cfb28b5fe019ac9bc25cd9c2a5d8a0f3a1c0c79bcca524d315b5e21b5c26b46babe3d75d06d1cd33329ec782a0f22891ed1db42a1d6c0dea431428bc4d7aabdcf3e0eb6fda4e23eb7733e7727e9a1915580796c55188d2596d2665ad1182ba7abf15aaa5a8b779ea996317a20ae044b820bff35b6e8a1',exponent: '010001'},
	{modulus: 'be6a71558ee577ff03023cfa17aab4e6c86383cff8a7ad38edb9fafe6f323f2d5106cbc8cafb83b869cffd1ccf121cd743d509e589e68765c96601e813dc5b9dfc4be415c7a6526132d0035ca33d6d6075d4f535122a1cdfe017041f1088d1419f65c8e5490ee613e16dbf662698c0f54870f0475fa893fc41eb55b08ff1ac211bc045ded31be27d12c96d8d3cfc6a7ae8aa50bf2ee0f30ed507cc2581e3dec56de94f5dc0a7abee0be990b893f2887bd2c6310a1e0a9e3e38bd34fded2541508dc102a9c9b4c95effd9dd2dfe96c29be647d6c69d66ca500843cfaed6e440196f1dbe0e2e22163c61ca48c79116fa77216726749a976a1c4b0944b5121e8c01',exponent: '010001'}
];
for (var i = 0; i < publicKeys.length; ++i)
	publicKeys[i].fingerprint = publicKeyFingerprint(publicKeys[i]);

// here should be https://core.telegram.org/schema/json
// but, unfortunately, response doesn't contain CORS headers
// so, I have made a simple proxy in my server
// if schema is changed in core.telegram.org, then it will be also changed here
// 
// it is easily to put back proper url, when CORS headers will be added
// (or when telegram web will be at web.telegram.org and CORS header will link only to this location)
window.Schema = {constructors: [], constructorsIndex: {}, methods: []};
var protos = [];
load('https://tl.dkaraush.me:8080/json', function (status, schema) {
	if (!status) {
		console.error('Error retrieving TL schema.');
		return;
	}
	console.log('schema loaded');
	schema = JSON.parse(schema);

	for (var i = 0; i < schema.constructors.length; ++i) {
		window.Schema.constructorsIndex[schema.constructors[i].id] = window.Schema.constructors.length;
		window.Schema.constructors.push(schema.constructors[i]);
	}
	for (var i = 0; i < schema.methods.length; ++i)
		window.Schema.methods.push(schema.methods[i]);

	for (var i = 0; i < protos.length; ++i)
		protos[i].sendLast();
});
parseTL(
	'resPQ nonce:int128 server_nonce:int128 pq:string server_public_key_fingerprints:Vector long = ResPQ',
	'server_DH_params_fail nonce:int128 server_nonce:int128 new_nonce_hash:int128 = Server_DH_Params',
	'server_DH_params_ok#d0e8075c nonce:int128 server_nonce:int128 encrypted_answer:bytes = Server_DH_Params',
	'server_DH_inner_data#b5890dba nonce:int128 server_nonce:int128 g:int dh_prime:bytes g_a:bytes server_time:int = Server_DH_inner_data',
	'p_q_inner_data#83c95aec pq:bytes p:bytes q:bytes nonce:int128 server_nonce:int128 new_nonce:int256 = P_Q_inner_data',
	'client_DH_inner_data#6643b654 nonce:int128 server_nonce:int128 retry_id:long g_b:bytes = Client_DH_Inner_Data',
	'dh_gen_ok nonce:int128 server_nonce:int128 new_nonce_hash1:int128 = Set_client_DH_params_answer',
	'dh_gen_retry nonce:int128 server_nonce:int128 new_nonce_hash2:int128 = Set_client_DH_params_answer',
	'dh_gen_fail nonce:int128 server_nonce:int128 new_nonce_hash3:int128 = Set_client_DH_params_answer',
	'bad_msg_notification#a7eff811 bad_msg_id:long bad_msg_seqno:int error_code:int = BadMsgNotification;',
	'bad_server_salt#edab447b bad_msg_id:long bad_msg_seqno:int error_code:int new_server_salt:long = BadMsgNotification;',
	'message#0200f00d msg_id:long seqno:int bytes:int body:Object = Message',
	'msg_container#73f1f8dc messages:vector %Message = MessageContainer;',
	'msg_copy#e06046b2 orig_message:Message = MessageCopy;',
	'pong#347773c5 msg_id:long ping_id:long = Pong;',
	'msgs_state_info#04deb57d req_msg_id:long info:string = MsgsStateInfo;',
	'future_salts#ae500895 req_msg_id:long now:int salts:vector future_salt = FutureSalts;',
	'future_salt#0949d9dc valid_since:int valid_until:int salt:long = FutureSalt;',
	'gzip_packed#3072cfa1 packed_data:string = Object;',
	'new_session_created#9ec20908 first_msg_id:long unique_id:long server_salt:long = NewSession',
	'ping_delay_disconnect#f3427b8c ping_id:long disconnect_delay:int = Pong;',
	'rpc_answer_unknown#5e2ad36e = RpcDropAnswer;',
	'rpc_answer_dropped_running#cd78e586 = RpcDropAnswer;',
	'rpc_answer_dropped#a43ad8b7 msg_id:long seq_no:int bytes:int = RpcDropAnswer;',
	'rpc_error#2144ca19 error_code:int error_message:string = RpcError;',
	'rpc_result#f35c6d01 req_msg_id:long result:Object = RpcResult;',
	'msgs_all_info#8cc0d131 msg_ids:Vector long info:string = MsgsAllInfo',
	'msgs_ack#62d6b459 msg_ids:Vector long = MsgsAck;',
	'msg_detailed_info#276d3ec6 msg_id:long answer_msg_id:long bytes:int status:int = MsgDetailedInfo;',
	'msg_new_detailed_info#809db6df answer_msg_id:long bytes:int status:int = MsgDetailedInfo;',
	'---functions---',
	'req_pq_multi nonce:int128 = ResPQ',
	'set_client_DH_params#f5045f1f nonce:int128 server_nonce:int128 encrypted_data:bytes = Set_client_DH_params_answer',
	'req_DH_params#d712e4be nonce:int128 server_nonce:int128 p:bytes q:bytes public_key_fingerprint:long encrypted_data:bytes = Server_DH_Params',
	'ping#7abe77ec ping_id:long = Pong;',
	'msgs_state_req#da69fb52 msg_ids:Vector long = MsgsStateReq;',
	'get_future_salts#b921bd04 num:int = FutureSalts;',
	'rpc_drop_answer#58e4a740 req_msg_id:long = RpcDropAnswer;',
	'msg_resend_req#7d861a08 msg_ids:Vector long = MsgResendReq;',
	'msg_resend_ans_req#8610baeb msg_ids:Vector long = MsgResendReq;',
	'msgs_ack#62d6b459 msg_ids:Vector long = MsgsAck;'
);
var funcs = false;
function parseTL() {
	funcs = false;
	var lines = arr(arguments).join('\n').split(/\n|;/g), funcs = false;
	for (var i = 0; i < lines.length; ++i) {
		var line = lines[i];
		parseTLString(line);
	}
}
function parseTLString(line) {
	if (line.indexOf('---functions---') >= 0)
		funcs = true;
	if (line.indexOf('=') >= 0) {
		line = line.replace(/\/\/.+$/g, '');
		var name = line.substring(0, line.indexOf(' '));
		var paramMatches = line.match(/([\w\d]+\:[%\w\d ]+ )/g);
		var params = [];
		if (paramMatches != null) {
			for (var i = 0; i < paramMatches.length; ++i) {
				var param = paramMatches[i]
				var _name = param.substring(0, param.indexOf(':'));
				var _type = param.substring(param.indexOf(':')+1, param.length-1);
				params.push({name: _name, type: _type})
			}
		}
		var type = line.substring(line.indexOf('=')+2);
		if (funcs)
			putMethod(name, params, type);
		else putType(name, params, type);
	}
}

var MTProto = Class.extend({
	constructor: function (options) {
		protos.push(this);

		this.main = options.main || false;
		this.test = options.test || false;
		this.timeOffset = 0;
		this.socket = null;
		this._debug = options.debug || false;
		this.DC = options.DC || -1;

		this.auth_key = options.auth_key;
		if (typeof this.auth_key === 'string')
			this.auth_key = S64(this.auth_key);
		this.lastMessageID = [0,0];
		this.client_nonce = null;
		this.server_nonce = null;
		this.pq = null;
		this.p = null;
		this.q = null;
		this.serverPublicKey = null;

		this.obfuscate = options.obfuscate || true;
		this.transportName = options.transport || 'intermediate';

		this.encryption = null;
		this.decryption = null;

		this.transportSeqno = 0;
		this.transportHeaders = {
			'abridged': B('ef'),
			'intermediate': B('eeeeeeee'),
			'padded intermediate': B('dddddddd'),
			'full': null
		};

		this.connected = false;
		this.before = null;
		this.ready = false;
		this.buffer = new ArrayBuffer();

		this.acks = [];
		this.pending = {};
		this.sending = [];
		this.sent = {};
		this.lastMsgId = null;
		this.attempts = 0;

		var dcid = this.DC;
		this.load();
		if (this.DC != dcid && dcid != -1) {
			this.auth_key = null;
			this.DC = dcid;
		}

		var self = this;
		self.garbageInterval = setInterval(function () {
			self.collectGarbage();
		}, 5000);
		self.ackInterval = setInterval(function () {
			self.ack();
		}, 2000);

		this.debug('born.');
	},
	debug: function () {
		if (!this._debug)
			return;
		// alert([this.prefix()].concat(arr(arguments)).map(JSON.stringify).join(' ')); // for iOS, lol
		console.log.apply(this, [this.prefix()].concat(arr(arguments)));
	},
	debugBinary: function (name, buff) {
		if (!this._debug)
			return;
		console[console.debug?'debug':'log'](this.prefix(), name, '[' + buff.byteLength + ']', S(buff));
	},
	warn: function () {
		console.warn.apply(this, [this.prefix()].concat(arr(arguments)));
	},
	prefix: function () {
		return '[MTProto-'+(this.DC||'?')+(this.main?'-MAIN':'')+']';
	},
	connect: function (onConnected) {
		var m = this;
		if (m.DC == -1)
			m.DC = 1;

		m.transportSeqno = 0;
		m.buffer = new ArrayBuffer();
		m.retryID = 0;

		m.socket = new WebSocket('wss://' + servers[m.DC-1] + '.web.telegram.org/apiws' + (this.test ? '_test' : ''), ['binary']);
		m.socket.binaryType = "arraybuffer";
		m.connected = false;
		m.inited = false;
		m.socket.onopen = function onOpen() {
			m.debug('socket opened. ('+m.socket.readyState+')');
			if (!m.socket.readyState) {
				setTimeout(onOpen, 500);
				return;
			}

			var header = m.transportHeader();
			if (header)
				m.sendRaw(header);

			if (m.auth_key == null) {
				m.client_nonce = secureRandomBytes(16);
				m.sendMethod('req_pq_multi', {nonce: m.client_nonce});
			} else {
				if (typeof onConnected === 'function')
					onConnected();
				m.connected = true;
				if (typeof m.before === 'function') {
					m.before(function () {
						if (m.connected)
							m.ready = true;
						m.sendLast();
					})
				} else m.ready = true;
				m.sendLast();
			}
		}
		m.socket.onclose = function () {
			m.debug('socket closed.');
			m.connect(m.connected ? onConnected : false);
			m.ready = false;
			m.connected = false;
		}
		m.socket.onmessage = function (evt) {
			readAsArrayBuffer(evt.data, function (chunk) {
				if (m.obfuscate)
					chunk = m.decrypt(chunk);

				m.buffer = concat(m.buffer, chunk);
				m.readMessages();
			});
		}
	},
	sendLast: function () {
		if (!this.connected || window.Schema.constructors.length < 50 || !this.ready) {
			return;
		}

		for (var i = 0; i < this.sending.length; ++i)
			this.sendAPIMethod.apply(this, this.sending[i]);
		this.sending = [];
		// while (this.sending.length > 0) {
		// 	this.sendAPIMethod.apply(this, this.sending[0]);
		// 	this.sending.splice(0, 1);
		// }
	},
	readMessages: function () {
		if (this.transportName == 'intermediate' ||
			this.transportName == 'padded intermediate') {
			while (this.buffer.byteLength > 4) {
				var len = new Int32Array(this.buffer.slice(0, 4))[0];
				if (len+4 <= this.buffer.byteLength) {
					this.parseMessage(this.buffer.slice(4, 4+len));
					this.buffer = this.buffer.slice(4+len);
				} else
					break;
			}
		} else if (this.transportName == 'abridged') {
			while (this.buffer.byteLength > 1) {
				var byte1 = this.buffer.slice(0, 1), len, offset;
				if (S(byte1) == '7f') {
					if (this.buffer.byteLength < 4)
						return;
					len = new Int32Array(concat(this.buffer.slice(1, 4), zeroBytes(1)))[0] * 4;
					offset = 4;
				} else {
					len = new Int8Array(byte1);
					offset = 2;
				}
				if (len+offset <= this.buffer.byteLength) {
					this.parseMessage(this.buffer.slice(offset, offset+len));
					this.bffer = this.buffer.slice(offset+len);
				} else
					break;
			}
		} else {
			// TODO
		}
	},
	collectGarbage: function () {
		for (var k in this.sent) {
			if (Date.now() - this.sent[k].t > 1000 * 60) {
				delete this.sent[k];
			}
		}
	},
	parseMessage: function (msg) {
		// this.debug('<= [' + msg.byteLength + '] ' + S(msg, ' '));

		if (msg.byteLength == 4) {
			var error = new Int32Array(msg)[0];
			this.warn('received error:', error);
			if (error == -404 && this.auth_key == null && this.attempts < 2) {
				this.attempts++;
				this.connect();
			} else if (error == -404 && this.auth_key != null) {
				this.auth_key = null;
				if (this.sent[this.lastMsgId]) {
					this.sending.push(this.sent[this.lastMsgId].args);
					this.lastMsgId = null;
				}
				this.connect();
			}
			return;
		}

		if (this.auth_key == null) {
			var auth_key_id = msg.slice(0, 8);
			var message_id = msg.slice(8, 16);
			var message_length = new Int32Array(msg.slice(16, 20))[0];
			var message_data = msg.slice(20, 20 + message_length);

			var TL = new TLDeserialization(message_data);
			var message = TL.fetchObject('Object');

			this.debug('received "' + message._ + '"', message);
			this.onMessage(message);
		} else {
			var auth_key_id = msg.slice(0, 8);
			var msg_key = msg.slice(8, 24);
			var encrypted_data = msg.slice(24);

			this.debugBinary('auth_key_id:', auth_key_id);
			this.debugBinary('msg_key:', msg_key);
			this.debugBinary('encrypted_data:', encrypted_data);

			if (S(auth_key_id) != S(B(sha1(this.auth_key)).slice(-8)))
				console.warn('wrong auth_key_id received');
			
			var x = 8;
			var sha256_a = B(sha256(concat(msg_key, this.auth_key.slice(x, x+36))));
			var sha256_b = B(sha256(concat(this.auth_key.slice(40+x,76+x), msg_key)));
			var aes_key = concat(sha256_a.slice(0, 8), sha256_b.slice(8, 24), sha256_a.slice(24, 32));
			var aes_iv =  concat(sha256_b.slice(0, 8), sha256_a.slice(8, 24), sha256_b.slice(24, 32));

			var data = new Uint8Array(bytesFromWords(
							CryptoJS.AES.decrypt(
									{ ciphertext: bytesToWords(encrypted_data) }, 
									bytesToWords(aes_key), 
									{
										iv: bytesToWords(aes_iv),
										padding: CryptoJS.pad.NoPadding,
										mode: CryptoJS.mode.IGE
									}))).buffer;
			this.debugBinary('data:', data);

			var server_salt = data.slice(0, 8);
			var session_id = data.slice(8, 16);
			var message_id = data.slice(16, 24);
			var msg_id = S(message_id);
			var message_seqno = data.slice(24, 28);
			var length = new Int32Array(data.slice(28, 32))[0];
			this.debugBinary('server_salt:', server_salt);
			this.debugBinary('session_id:', session_id);
			this.debugBinary('message_id:', message_id);
			this.debugBinary('message_seqno:', message_seqno);

			var message_data = data.slice(32, 32 + length);
			this.debugBinary('message_data:', message_data);

			var TL = new TLDeserialization(message_data);
			var message = TL.fetchObject('Object');
			this.debug('received "' + message._ + '"', message);
			if (message._ == 'bad_server_salt') {
				this.server_salt = message.new_server_salt;
				this.save({server_salt: this.server_salt});
				this.debug('saved new server_salt');

				var msg_id = S(message.bad_msg_id)
				if (this.sent[msg_id]) {
					this.sendAPIMethod.apply(this, this.sent[msg_id].args);
					delete this.sent[msg_id];
				}

			} else if (message._ == 'bad_msg_notification') {
				this.warn('bad_msg_notification', message);
			} else if (message._ == 'msg_container') {
				for (var i = 0; i < message.messages.length; ++i)
					this.onMessage(message.messages[i], msg_id);
				// for (var i = 0; i < message.messages.length; ++i) {
				// 	var msg = message.messages[i];
				// 	this.debug('msg', msg);
				// 	var body = new Uint8Array(msg.body).buffer;
				// 	this.debugBinary('msg['+i+'].body:', body);
				// 	try {
				// 		TL = new TLDeserialization(body.slice(0, body.byteLength - (body.byteLength % 4)));
				// 		this.debug(TL.fetchObject('Object'))
				// 	} catch (e) { console.warn(e) }
				// }
			} else
				this.onMessage(message, msg_id);
		}
	},
	ack: function () {
		if (!this.connected) {
			this.acks = [];
			return;
		}
		if (this.acks.length > 0) {
			this.sendMethod('msgs_ack', {
				msg_ids: map(this.acks, B)
			});
			this.acks = [];
		}
	},
	onMessage: function (msg, msg_id) {
		if (this.auth_key != null) {
			if (msg._ == 'rpc_result') {
				var result = msg.result;
				var req_msg_id = S(msg.req_msg_id);

				if (typeof this.pending[req_msg_id] !== 'undefined') {
					var type = this.pending[req_msg_id].type;
					var predicate = result._;
					if (result._ == 'rpc_error') {
						this.acks.push(msg_id);
						this.pending[req_msg_id].callback(false, result);
						delete this.pending[req_msg_id];
						return;
					}
					for (var i = 0; i < window.Schema.constructors.length; ++i) {
						var constructor = window.Schema.constructors[i];
						if (constructor.predicate == predicate && constructor.type == type) {
							this.acks.push(msg_id);
							this.pending[req_msg_id].callback(true, result);
							delete this.pending[req_msg_id];
							return;
						}
					}

					this.warn('wrong type received', result._, '(should be', this.pending[req_msg_id].type, ')');
					this.acks.push(msg_id);
					this.pending[req_msg_id].callback(false, new Error('wrong type'));
					delete this.pending[req_msg_id];
				}
			} else if (msg._ == 'new_session_created') {
				this.server_salt = new Uint8Array(msg.server_salt).buffer;
				this.save({server_salt: this.server_salt});
				this.acks.push(msg_id);
			} else if (msg._ == 'updates' || msg._ == 'updateShort') {

			}

			return;
		}

		if (msg._ === 'resPQ' && this.auth_key == null) {
			if (S(msg.nonce) !== S(this.client_nonce))
				this.warn('received different client nonce');
			this.server_nonce = msg.server_nonce;

			this.pq = Braw(msg.pq);
			this.debugBinary('PQ:', this.pq);
			var self = this;
			decomposePQ(this.pq, function (pqDecomposed) {
				self.p = B(pqDecomposed.p, 4);
				self.q = B(pqDecomposed.q, 4);

				var p = bigInt(pqDecomposed.p, 16);
				var q = bigInt(pqDecomposed.q, 16);
				if (p.compareTo(q) > 0) {
					var temp = self.q;
					self.q = self.p;
					self.p = temp;
					self.debug('q should be bigger!');
				}

				self.debugBinary('P:', self.p);
				self.debugBinary('Q:', self.q);

				self.serverPublicKey = selectPublicKey(publicKeys, msg.server_public_key_fingerprints);
				self.debug('selected public key:', self.serverPublicKey);

				self.new_nonce = secureRandomBytes(32);
				var data = serializeObject('p_q_inner_data', {
					pq: (self.pq),
					p: (self.p),
					q: (self.q),
					nonce: self.client_nonce,
					server_nonce: self.server_nonce,
					new_nonce: self.new_nonce
				});

				self.debugBinary('inner_data:',data);
				self.debug(new Uint8Array(B(sha1(data))));
				self.debugBinary('inner_data_hash:', B(sha1(data)));
				var data_with_hash = concat(B(sha1(data)), data, randomBytes(255 - 20 - data.byteLength));
				self.debugBinary('data_with_hash:', data_with_hash);

				// if (S(data_with_hash.slice(0, 20)) != sha1(data_with_hash.slice(20, data.byteLength+20)))
				// 	console.warn('WTF?')

				var encrypted_data = encryptRSA(data_with_hash, self.serverPublicKey);
				self.debugBinary('encrypted_data: ', encrypted_data);

				self.sendMethod('req_DH_params', {
					nonce: self.client_nonce,
					server_nonce: self.server_nonce,
					p: self.p,
					q: self.q,
					public_key_fingerprint: B(self.serverPublicKey.fingerprint),
					encrypted_data: encrypted_data
				});
			});
		} else if (msg._ == 'server_DH_params_ok' && msg.auth_key == null) {
			if (S(msg.nonce) !== S(this.client_nonce))
				this.warn('received different client nonce');
			if (S(msg.server_nonce) !== S(this.server_nonce))
				this.warn('received different server nonce');

			var encrypted_answer = msg.encrypted_answer;
			this.tmp_aes_key = concat(
								B(sha1(concat(this.new_nonce, this.server_nonce))),
							  	B(sha1(concat(this.server_nonce, this.new_nonce))).slice(0, 12));
			this.debugBinary('tmp_aes_key', this.tmp_aes_key);
			this.tmp_aes_iv = concat(
								B(sha1(concat(this.server_nonce, this.new_nonce))).slice(12, 20),
								B(sha1(concat(this.new_nonce, this.new_nonce))),
								this.new_nonce.slice(0, 4));
			this.debugBinary('tmp_aes_iv', this.tmp_aes_iv);
			var answer_decrypted = new Uint8Array(bytesFromWords(CryptoJS.AES.decrypt(
											{ ciphertext: bytesToWords(encrypted_answer) }, 
											bytesToWords(this.tmp_aes_key), 
											{
												iv: bytesToWords(this.tmp_aes_iv),
												padding: CryptoJS.pad.NoPadding,
												mode: CryptoJS.mode.IGE
											})
										)).buffer;
			var answer_hash = answer_decrypted.slice(0, 20);
			var answer_data = answer_decrypted.slice(20);
			this.debugBinary('answer_hash:', answer_hash);
			this.debugBinary('answer_data:', answer_data);
			var TL = new TLDeserialization(answer_data);
			var answer = TL.fetchObject('server_DH_inner_data');
			this.debug('answer:', answer);

			var newTimeOffset =  (answer.server_time - ~~(Date.now()/1000));
			if (Math.abs(newTimeOffset) > 10) {
				this.timeOffset = newTimeOffset;
				this.debug('time offset:', this.timeOffset, 'seconds');
				this.save({
					timeOffset: this.timeOffset
				});
			}
			this.lastMessageID = [0,0];

			this.g = bigInt(answer.g);

			if (S(answer.nonce) != S(this.client_nonce))
				this.warn('client_nonce are different');
			if (S(answer.server_nonce) != S(this.server_nonce))
				this.warn('server_nonce are different');

			this.debug('dh_prime:', S(answer.dh_prime));
			if (S(answer.dh_prime) !== 'c71caeb9c6b1c9048e6c522f70f13f73980d40238e3e21c14934d037563d930f48198a0aa7c14058229493d22530f4dbfa336f6e0ac925139543aed44cce7c3720fd51f69458705ac68cd4fe6b6b13abdc9746512969328454f18faf8c595f642477fe96bb2a941d5bcd1d4ac8cc49880708fa9b378e3c4f3a9060bee67cf9a4a4a695811051907e162753b56b0f6b410dba74d8a84b2a14b3144e0ef1284754fd17ed950d5965b4b9dd46582db1178d169c6bc465b0d6ff9ca3928fef5b9ae4e418fc15e83ebea0f87fa9ff5eed70050ded2849f47bf959d956850ce929851f0d8115f635b105ee2e4e15d04b2454bf6f4fadf034b10403119cd8e3b92fcc5b')
				this.warn('dh_prime is unknown');

			this.gA = bigInt(S(answer.g_a), 16);
			this.dh_prime = bigInt(S(answer.dh_prime), 16);

			if (this.gA.compare(bigInt(1)) <= 0)
				this.warn('g_a <= 1');

			if (this.gA.compare(this.dh_prime.minus(1)) >= 0)
				this.warn('g_a >= dh_prime - 1');

			var two1984 = bigInt("1"+repeatString("0",496),16); // 2^1948
			if (this.gA.compare(two1984) < 0)
				this.warn('g_a < 2^1984');
			if (this.gA.compare(this.dh_prime.minus(two1984)) >= 0)
				this.warn('g_a > dh_prime - 2^1984');

			if (sha1(answer_data.slice(0, TL.offset)) != S(answer_hash))
				this.warn('hash of data mismatch');

			this.b = bigInt(S(secureRandomBytes(256)), 16);
			this.debug('B:', this.b.toString(16));
			var self = this;
			EuclideanModPow(this.g, this.b, this.dh_prime, function (gB) {
				self.gB = gB;
			
				var innerData = serializeObject('client_DH_inner_data', {
					nonce: self.client_nonce,
					server_nonce: self.server_nonce,
					retry_id: B(str(self.retryID), 8),
					g_b: B(self.gB.toString(16), 256)
				});
				self.debugBinary('inner_data:', innerData);
				var paddingLength = 16 - ((innerData.byteLength+20) % 16);
				var data_with_hash = concat(B(sha1(innerData)), innerData, randomBytes(paddingLength));
				self.debugBinary('data_with_hash:', data_with_hash);
				var encrypted_data = new Uint8Array(bytesFromWords(
										CryptoJS.AES.encrypt(
												bytesToWords(data_with_hash), 
												bytesToWords(self.tmp_aes_key), 
												{
													iv: bytesToWords(self.tmp_aes_iv),
													padding: CryptoJS.pad.NoPadding,
													mode: CryptoJS.mode.IGE
												}).ciphertext
									)).buffer;

				self.sendMethod('set_client_DH_params', {
					nonce: self.client_nonce,
					server_nonce: self.server_nonce,
					encrypted_data: encrypted_data
				});
			});
		} else if (msg._ == "dh_gen_ok" && this.auth_key == null) {
			if (S(msg.nonce) !== S(this.client_nonce))
				this.warn('received different client nonce');
			if (S(msg.server_nonce) !== S(this.server_nonce))
				this.warn('received different server nonce');

			this.auth_key = B(str(this.gA.modPow(this.b, this.dh_prime)), 256);
			this.debugBinary('auth_key:', this.auth_key);
			this.auth_key_hash = B(sha1(this.auth_key.slice(0, 64)), 20);
			this.debugBinary('auth_key_hash:', this.auth_key_hash);

			this.server_salt = xor(this.new_nonce.slice(0, 8), this.server_nonce.slice(0, 8));
			this.debugBinary('server_salt:', this.server_salt);

			this.attempts = 0;
			this.save({
				auth_key: this.auth_key,
				server_salt: this.server_salt,
				msg_seqno: 0,
				DC: this.DC
			});
			this.connected = true;
			if (typeof this.before === 'function') {
				var self = this;
				self.before(function () {
					if (self.connected)
						self.ready = true;
					self.sendLast();
				})
			} else
				this.ready = true;
			this.sendLast();
		}
	},
	save: function (params) {
		var config = Storage.get('mtproto-'+this.DC,{});
		for (var key in params) {
			if (params[key] instanceof ArrayBuffer)
				params[key] = 'x'+S(params[key]);
			config[key] = params[key];
		}
		Storage.set('mtproto-'+this.DC,config);
	},
	load: function () {
		var config = Storage.get('mtproto-'+this.DC,{});
		for (var key in config) {
			if (config[key].length > 1 &&
				config[key][0] == 'x')
				config[key] = B(config[key].slice(1));
			this[key] = config[key];
		}
	},
	sendRaw: function (buffer) {
		// this.debug('=> [' + buffer.byteLength + '] ' + S(buffer, ' '));
		this.socket.send(buffer);
	},
	send: function (buffer, isAPI) {
		if (this.socket.readyState >= 2) {
			var self = this;
			self.connect(function () {
				self.send(buffer, isAPI)
			});	
			return
		}
		var msg_id;
		var res = this.message(buffer, isAPI);
		buffer = res.buffer;
		msg_id = res.msg_id;
		buffer = this.transport(buffer);
		// this.debug('=> [' + buffer.byteLength + '] ' + S(buffer, ' '));
		if (this.obfuscate)
			buffer = this.encrypt(buffer);
		this.socket.send(buffer);

		return msg_id;
	},
	sendMethod: function (methodname, params, isAPI) {
		this.lastMethodSent = methodname;
		this.debug('sending "' + methodname + '"', params);
		var data = serializeMethod(methodname, params);
		this.debugBinary('binary message:', data);
		return this.send(data, isAPI);
	},
	sendAPIMethod: function (methodname, params, callback, ignoreReady) {
		if (!this.connected || (!ignoreReady && !this.ready) || window.Schema.constructors.length < 50) {
			this.sending.push(arr(arguments));
			return;
		}

		var method = null;
		for (var i = 0; i < window.Schema.methods.length; ++i) {
			if (window.Schema.methods[i].method == methodname) {
				method = window.Schema.methods[i];
				break;
			}
		}
		if (method == null) {
			this.warn('failed to find method:', methodname);
			callback(false, new Error('Failed to find method.'));
			return;
		}
		var msg_id = this.sendMethod(methodname, params, true);
		this.pending[msg_id] = {
			type: method.type,
			callback: callback
		};
		this.sent[msg_id] = {args: arr(arguments), t: Date.now()};
	},
	encrypt: function (buffer) {
		if (!this.obfuscate)
			return buffer;
		return this.encryption.encrypt(new Uint8Array(buffer)).buffer;
	},
	decrypt: function (buffer) {
		if (!this.obfuscate)
			return buffer;
		return this.decryption.decrypt(new Uint8Array(buffer)).buffer;
	},
	message: function (message_data, isAPI) {
		if (this.auth_key == null) {
			// Unencrypted message
			var message_id = this.messageID();
			return {
				buffer: concat(zeroBytes(8), message_id, int32(message_data.byteLength), message_data),
				msg_id: message_id
			};
		} else {
			if (this.session_id == null)
				this.session_id = randomBytes(8);

			if (!this.inited && isAPI) {
				var s = new TLSerialization();
				s.storeInt(0xda9b0d0d, 'invokeWithLayer')
		        s.storeInt(105, 'layer')
		        s.storeInt(0xc7481da6, 'initConnection')
		        s.storeInt(API_ID, 'api_id')
		        s.storeString(navigator.userAgent || 'Unknown UserAgent', 'device_model')
		        s.storeString(navigator.platform || 'Unknown Platform', 'system_version')
		        s.storeString('0.1.0', 'app_version')
		        s.storeString(navigator.language || 'en', 'system_lang_code')
		        s.storeString('', 'lang_pack')
		        s.storeString(navigator.language || 'en', 'lang_code');
		        message_data = concat(s.getBuffer(), message_data);

		        this.inited = true;
			}

			var message_id = this.messageID();
			var message_seqno = this.messageSeqno(!isAPI);
			this.debugBinary('salt:', this.server_salt);
			this.debugBinary('session_id:', this.session_id);
			this.debugBinary('message_id:', message_id);
			this.debugBinary('message_seqno:', message_seqno);
			var data = concat(
							this.server_salt,
							this.session_id,
							message_id,
							message_seqno,
							int32(message_data.byteLength),
							message_data);
			var message = concat(data, randomBytes((16 - (data.byteLength % 16)) + 16 * rand(1,50)));
			this.debugBinary('message:', message);

			var x = 0; // from client to server
			var msg_key = B(sha256(concat(this.auth_key.slice(88+x, 120+x), message))).slice(8, 24);
			var auth_key_id = B(sha1(this.auth_key)).slice(-8);

			var sha256_a = B(sha256(concat(msg_key, this.auth_key.slice(x,x+36))));
			this.debugBinary('sha256_content:', concat(msg_key, this.auth_key.slice(x,x+36)));
			this.debugBinary('sha256_a:', sha256_a);
			var sha256_b = B(sha256(concat(this.auth_key.slice(40+x, 40+36+x), msg_key)));
			this.debugBinary('sha256_content:', concat(this.auth_key.slice(40+x, 40+36+x), msg_key));
			this.debugBinary('sha256_b:', sha256_b);

			var aes_key = concat(sha256_a.slice(0, 8), sha256_b.slice(8, 24), sha256_a.slice(24, 32));
			var aes_iv =  concat(sha256_b.slice(0, 8), sha256_a.slice(8, 24), sha256_b.slice(24, 32));


			var encrypted_data = new Uint8Array(bytesFromWords(
									CryptoJS.AES.encrypt(
											bytesToWords(message), 
											bytesToWords(aes_key), 
											{
												iv: bytesToWords(aes_iv),
												padding: CryptoJS.pad.NoPadding,
												mode: CryptoJS.mode.IGE
											}).ciphertext)).buffer;

			this.debugBinary('auth_key_id:', auth_key_id);
			this.debugBinary('msg_key:', msg_key);
			this.debugBinary('encrypted_data:', encrypted_data);
			this.lastMsgId = S(message_id);
			return {
				buffer: concat(auth_key_id, msg_key, encrypted_data),
				msg_id: S(message_id)
			}
		}
	},
	messageSeqno: function (notContentRelated) {
		if (this.msg_seqno == null)
			this.msg_seqno = 0;
		var seqno = this.msg_seqno * 2;
		if (!notContentRelated) {
			seqno++;
			this.msg_seqno++;
		}
		return int32([seqno]);
	},
	messageID: function () {
		var t = now(),
			ts = Math.floor(t / 1000) + this.timeOffset,
			tms = t % 1000,
			random = ~~(Math.random() * 0xFFFF);

		var messageID = [ts, (tms << 21) | (random << 3) | 4];
		// if (this.lastMessageID[0] > messageID[0] || 
		// 	(this.lastMessageID[0] == messageID[0] && this.lastMessageID[1] >= messageID[1])) {
		// 	messageID = [this.lastMessageID[0], this.lastMessageID[1] + 4];
		// }

		this.lastMessageID = messageID;
		this.debug('messageID: ', messageID);
		return new Int32Array(messageID.reverse()).buffer//B(bigInt(messageID[0]).shiftLeft(32).add(bigInt(messageID[1])).toString(16), 8);
	},
	transport: function (payload) {
		if (this.transportName === 'abridged') {
			if (payload.byteLength / 4 >= 127)
				return concat(B('7f'), int32(payload.byteLength / 4).slice(0, 3), payload);
			return concat(int8(payload.byteLength / 4), payload);
		} else if (this.transportName === 'intermediate') {
			this.debugBinary('payload:', payload);
			return concat(int32(payload.byteLength), payload);
		} else if (this.transportName === 'padded intermediate') {
			var paddingLength = rand(0, 15);
			var padding = randomBytes(paddingLength);
			return concat(int32(payload.byteLength + paddingLength), payload, padding);
		} else if (this.transportName === 'full') {
			var seqno = this.transportSeqno++;
			var data = concat(int32(4 + 4 + payload.byteLength + 4),
							  int32(seqno), 
							  payload);
			var crc = crc32(data);
			return concat(data, crc);
		}
	},
	transportHeader: function () {
		if (!this.obfuscate)
			return this.transportHeaders[this.transportName];

		var transportHeader = this.transportHeaders[this.transportName];
		if (transportHeader == null)
			transportHeader = randomBytes(4);
		if (transportHeader.byteLength == 1)
			transportHeader = repeatByte(transportHeader, 4);
		this.debugBinary('transportHeader:', transportHeader)

		var dcHeader = int16(this.DC);

		var random;
		while (true) {
			random = concat(randomBytes(56), transportHeader, dcHeader, randomBytes(2));
			if (S(random.slice(0, 1)) == 'ef')
				continue;
			if (['44414548', '54534f50', '20544547', '4954504f', 'dddddddd', 'eeeeeeee',
				 '9a974148', 'efefefef'].indexOf(S(random.slice(0, 4))) >= 0)
				continue;
			if (S(random.slice(4, 8)) == '00000000')
				continue;
			break;
		}

		var randomRev = reverse(random);

		var encryptKey = random.slice(8, 40);
		var encryptIV =  random.slice(40, 56);

		var decryptKey = randomRev.slice(8, 40);
		var decryptIV =  randomRev.slice(40, 56);

		this.encryption = new aesjs.ModeOfOperation.ctr(
			new Uint8Array(encryptKey), new Uint8Array(encryptIV)
		);
		this.decryption = new aesjs.ModeOfOperation.ctr(
			new Uint8Array(decryptKey), new Uint8Array(decryptIV)
		);

		return concat(random.slice(0, 56), this.encrypt(random).slice(56, 56+8));
	}
});

function putMethod(methodname, params, type) {
	var id;
	if (methodname.indexOf('#') >= 0) {
		id = new Int32Array(reverse(B(methodname.substring(methodname.indexOf('#')+1))))[0];
		methodname = methodname.substring(0, methodname.indexOf('#'));
	} else
		id = obtainID(methodname, params, type);
	window.Schema.methods.push({
		id: id.toString(),
		method: methodname,
		params: params,
		type: type
	});
}
function putType(predicate, params, type) {
	// console.log('putType('+arr(arguments).join(', ')+')');
	var id;
	if (predicate.indexOf('#') >= 0) {
		id = new Int32Array(reverse(B(predicate.substring(predicate.indexOf('#')+1))))[0];
		predicate = predicate.substring(0, predicate.indexOf('#'));
	} else
		id = obtainID(predicate, params, type);
	// console.log('id='+id)
	window.Schema.constructorsIndex[id] = window.Schema.constructors.length;
	window.Schema.constructors.push({
		id: id.toString(),
		predicate: predicate,
		params: params,
		type: type
	});
}
function readAsArrayBuffer(ab, cb) {
	if (ab instanceof ArrayBuffer) {
		cb(ab);
	} else if (ab instanceof Blob) {
		readBlob(ab, cb);
	} else {
		console.warn('received unknown message type:', ab);
	}
}
function readBlob(blob, cb) {
	if (typeof blob.arrayBuffer === 'function') {
		blob.arrayBuffer().then(cb);
		return;
	}

	var reader = new FileReader();
	reader.onloadend = function (evt) {
		if (evt.target.readyState == FileReader.DONE) {
			cb(evt.target.result);
		}
	}
	reader.readAsArrayBuffer(blob);
}
function obtainID(name, params, type) {
	var stringarr = [name];
	for (var i = 0; i < params.length; ++i)
		stringarr.push(params[i].name + ":" + params[i].type);
	stringarr.push('=', type);
	return CRC32.str(stringarr.join(' '));
}
function serializeMethod(name, params) {
	var TL = new TLSerialization();
	TL.storeMethod(name, params);
	return TL.getBuffer();
}
function serializeObject(predicate, params) {
	var type = null;
	for (var i = 0; i < window.Schema.constructors.length; ++i) {
		if (window.Schema.constructors[i].predicate === predicate) {
			type = window.Schema.constructors[i].type;
			break;
		}
	}
	if (type == null) {
		console.warn('no type for "' + predicate + '" found');
		return null;
	}
	var TL = new TLSerialization(), o = params;
	o._ = predicate;
	TL.storeObject(o, type);
	return TL.getBuffer();
}
function selectPublicKey(publicKeys, fingerprints) {
	for (var i = 0; i < fingerprints.length; ++i) {
		var fingerprint = S(fingerprints[i]);
		for (var j = 0; j < publicKeys.length; ++j) {
			if (publicKeys[j].fingerprint == fingerprint)
				return publicKeys[j];
		}
	}
	return null;
}
function publicKeyFingerprint(key) {
	var o = new TLSerialization();
	o.storeBytes(B(key.modulus), 'n');
	o.storeBytes(B(key.exponent), 'e');
	return S(B(sha1(o.getBuffer())).slice(-8));
}
function crc32(buffer) {
	return int32(CRC32.buf(new Uint8Array(buffer)));
}
function encryptRSA(data, public_key) {
	var N = bigInt(public_key.modulus, 16);
	var E = bigInt(public_key.exponent, 16);
	var X = bigInt(S(data), 16);
	// console.log(S(B(EuclideanModPow(X, E, N).toString(16), 256)));
	// console.log(S(B(X.modPow(E, N).toString(16), 256)));
	return B(EuclideanModPow(X, E, N).toString(16), 256);
}
function xor(a, b) {
	var _a = new Uint8Array(a),
		_b = new Uint8Array(b);
	var _c = new Uint8Array(_a.length);
	for (var i = 0; i < _a.length; ++i)
		_c[i] = _a[i] ^ _b[i];
	return _c.buffer;
}
function or(a, b) {
	var _a = new Uint8Array(a),
		_b = new Uint8Array(b);
	var _c = new Uint8Array(_a.length);
	for (var i = 0; i < _a.length; ++i)
		_c[i] = _a[i] | _b[i];
	return _c.buffer;
}

function EuclideanModPow(a, b, m, cb) {
	if (cb) {
		a.modPow(b, m, function (x) {
			cb(x.isNegative() ? x.add(m) : x);
		});
	} else {
		var x = a.modPow(b, m);
		return x.isNegative() ? x.add(m) : x;
	}
}
function reverse(buff) {
	var a = new Uint8Array(buff),
		b = new Uint8Array(buff.byteLength);
	for (var i = 0; i < buff.byteLength; ++i)
		b[buff.byteLength - 1 - i] = a[i];
	return b.buffer;
}
function str(x) {
	let s = x.toString(16);
	if (s.length % 2 == 1)
		s = "0" + s;
	return s;
}
function B(hex, n) {
	var bytes = hex.match(/[0-9a-f]{2}/gi);
	if (bytes == null)
		return new ArrayBuffer();
	if (typeof n !== 'number') n = bytes.length;
	var arr = new Uint8Array(n);
	for (var j = 0; j < (n - bytes.length); ++j)
		arr[j] = 0;
	for (var i = 0; i < bytes.length; ++i) {
		arr[i + (n - bytes.length)] = parseInt(bytes[i], 16);
	}
	return arr.buffer;
}
function B64(base64) {
	var raw = window.atob(base64);
	var arr = new Uint8Array(raw.length);
	for (var i = 0; i < raw.length; ++i)
		arr[i] = raw.charCodeAt(i);
	return arr.buffer;
}
function S(buffer, separator) {
	return arr(new Uint8Array(buffer)).map(function (b) {
		var s = b.toString(16);
		return repeatString('0', 2 - s.length) + s;
	}).join(separator || '');
}
function S64(binary) {
	return window.btoa(binary);
}
function Braw(string) {
	var arr = new Uint8Array(string.length);
	for (var i = 0; i < arr.length; ++i)
		arr[i] = string.charCodeAt(i);
	return arr.buffer;
}
function Sraw(buffer) {
	var string = "", arr = new Uint8Array(buffer);
	for (var i = 0; i < arr.length; ++i)
		string += String.fromCharCode(arr[i]);
	return string;
}
function concat() {
	var buffers = arr(arguments), n = 0;
	for (var i = 0; i < buffers.length; ++i)
		n += buffers[i].byteLength;
	var buff = new Uint8Array(n);
	for (var i = 0, j = 0; i < buffers.length; ++i) {
		buff.set(new Uint8Array(buffers[i]), j);
		j += buffers[i].byteLength;
	}
	return buff.buffer;
}
function repeatString(str, n) {
	if (str.repeat)
		return str.repeat(n);
	var string = "";
	for (var i = 0; i < n; ++i)
		string += str;
	return string;
}
function zeroBytes(n) {
	return new Uint8Array(n).buffer;
}
function rand(from, to) {
	return Math.round(Math.random() * (to - from)) + from;
}
function randomBytes(n) {
	var b = new Uint8Array(n);
	for (var i = 0; i < n; ++i)	
		b[i] = rand(0, 255);
	return b.buffer;
}
function secureRandomBytes(n) {
	if (window.crypto && window.crypto.getRandomValue) {
		var arr = new Uint8Array(n);
		window.crypto.getRandomValue(arr);
		return arr.buffer;
	}
	return randomBytes(n);
}
function repeatByte(byte, n) {
	if (byte instanceof ArrayBuffer)
		byte = new Uint8Array(byte);
	var arr = new Uint8Array(n);
	for (var i = 0; i < n; ++i)
		arr[i] = byte;
	return arr.buffer;
}
function bytesToWords (bytes) {
	if (bytes instanceof ArrayBuffer) {
		bytes = new Uint8Array(bytes)
	}
	var len = bytes.length
	var words = []
	var i
	for (i = 0; i < len; i++) {
		words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8)
	}

	return new CryptoJS.lib.WordArray.init(words, len)
}
function bytesFromWords (wordArray) {
  var words = wordArray.words
  var sigBytes = wordArray.sigBytes
  var bytes = []

  for (var i = 0; i < sigBytes; i++) {
    bytes.push((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)
  }

  return bytes
}
function decomposePQ(pq, callback) {
	var n = bigInt(typeof pq === 'string' ? pq : S(pq), 16);

	if (n.divmod(2).remainder == 0) {
		callback({p: (2).toString(16), q: n.divmod(2).quotient.toString(16)});
		return;
	}

	var y = bigInt(rand(1, 1000)),
		c = bigInt(rand(1, 1000)),
		m = bigInt(rand(1, 1000)),
		g = bigInt(1), r = bigInt(1), q = bigInt(1);
		x = bigInt(), ys = bigInt();

	// while (g == 1) {
	function sub(cb) {
		if (g.compare(bigInt(1)) != 0) {
			cb();
			return;
		}

		x = y;
		for (var i = bigInt(1); i.compare(r) < 1; i = i.plus(1))
			y = y.multiply(y).divmod(n).remainder.plus(c).divmod(n).remainder;
		var k = bigInt(0);
		while (k < r && g == 1) {
			ys = y;
			for (var i = bigInt(1); i.compare(bigInt.min(m, r.minus(k))) < 1; i = i.plus(1)) {
				y = y.multiply(y).divmod(n).remainder.plus(c).divmod(n).remainder;
				q = q.multiply(x.minus(y).abs()).divmod(n).remainder;
			}
			g = bigInt.gcd(q, n);
			k = k.plus(m)
		}
		r = r.multiply(2);
		$n(function () {sub(cb)});
	}
	sub(function () {
		if (g == n) {
			function sub2(cb) {
				ys = ys.multiply(ys).divmod(n).remainder.plus(c).divmod(n).remainder;
				g = g.multiply(x.minus(ys).abs()).divmod(n).remainder;
				if (g.compare(1) != -1)
					$n(function(){sub2(cb)});
				else cb();
			}
			sub2(function () {
				callback({p: g.toString(16), q: n.divmod(g).quotient.toString(16)});	
			});
		} else
			callback({p: g.toString(16), q: n.divmod(g).quotient.toString(16)});
	})
}
function uint8(x) {
	return new Uint8Array([x]).buffer;
}
function int8(x) {
	return new Int8Array([x]).buffer;
}
function int16(x) {
	return new Int16Array([x]).buffer;
}
function int32(x) {
	return new Int32Array([x]).buffer;
}
