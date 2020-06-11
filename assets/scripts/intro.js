function startIntro() {
	$('#intro').style.display = 'block';
	$t(16, function () {$rmclass($('#intro'), 'hidden')});
	function hideIntro () {
		$addclass($('#intro'), 'hidden');
		$t(200, function () {$("#intro").style.display = 'none'});
	}

	var countryID = -1;
	function selectCountry(i) {
		countryID = i;
		$('.inputSelect.country input').value = countries[i].name;
		$addclass($('.inputSelect.country'), 'typed');
		$addclass($('.input.phone'), 'typed');
		$('.input.phone input').value = countries[i].phoneCode + ' ';
		$('.input.phone input').focus();
		updateLoginReady();
	}

	var Monkey, monkey;
	var countries = [];
	$onload(function () {
		var select = $('#intro .inputSelect.country');
		var selectContainer = select.querySelector('.select div');
		load('assets/numbers.txt', function (status, data) {
			if (status) {
				var numbers = data.split('\n');
				for (var i = 0; i < numbers.length; ++i) {
					var numberData = numbers[i].split(';');
					if (numberData.length < 3)
						continue;

					var phonecode = '+'+numberData[0];
					var countrycode = numberData[1];
					var country = numberData[2];
					var template = numberData[3]||'';
					var phonelen = parseInt(numberData[4]);

					countries.push({
						phoneCode: phonecode,
						code: countrycode,
						name: country,
						len: phonelen
					});
					selectContainer.appendChild($new('div#c'+i, null, [
						$new('span.flag', null, [], flag(i)),
						$new('span.label', null, [
							$new('span', null, [
								$new('span.country', country),
								$new('span.code', phonecode)
							])
						])
					], UI.addRipple, $click(function (evt) {
						var el = evt.target;
						while (el.id[0] != 'c' && typeof el !== 'undefined')
							el = el.parentElement;
						var i = el.id.slice(1);
						selectCountry(i);
						$run(select, 'Close');
					})));
				}
			}
		});

		function flag(i) {
			return function (element) {
				element.style.backgroundPosition = i*-28 + 'px 0';
			}
		}
		function range(x,min,max) {
			return Math.min(Math.max(x, min), max);
		}
		Monkey = Class.extend({
			constructor: function (container) {
				this.container = container || $("#monkey");
				this._active = 0;

				var self = this;
				this.data = [];
				this.anims = [];
				this.loaded = false;

				this.status = 'idle'; // should be
				this._status = 'idle'; // real status
				this.trackTo = 0;
				this.trackFrom = 0;

				this.updating = false;
				loadAll(map(Monkey.animationNames, function (name) {
					return Monkey.src.replace(/\{animationName\}/g, name);
				}), function (data) {
					for (var i = 0; i < data.length; ++i) {
						var animData = JSON.parse(data[i]);
						self.data[i] = animData;

						self.anims[i] = bodymovin.loadAnimation(self.options(i));
						self.anims[i].renderer.svgElement.style.display = self._active == i ? 'block' : 'none';
					}

					self.loaded = true;
				});
			},
			set: function (i) {
				if (!this.loaded) {
					this._active = i;
					return;
				}

				this.anims[this._active].pause();
				this.anims[this._active].renderer.svgElement.style.display = 'none';
				this.anims[i].renderer.svgElement.style.display = 'block';
				this.anims[i].play();

				this._active = i;
			},
			track: function (x) {
				this.status = 'tracking';
				this.trackTo = 20 + range(x,0,1) * 140;
			},
			idle: function (x) {
				if (this.status == 'tracking') {
					this.trackTo = 0;
				}
				this.status = 'idle';
			},
			close: function (x) {
				if (this.status == 'tracking') {
					this.trackTo = 0;
				}
				this.status = 'closed'
			},
			peek: function (x) {
				if (this.status == 'tracking') {
					this.trackTo = 0;
				}
				this.status = 'peek';
			},
			options: function (i) {
				return {
					container: this.container,
					renderer: 'svg',
					loop: true,
					autoplay: i == this._active,
					animationData: this.data[i]
				};
			},
			id: function () {
				// return this.status == 'idle' ? 0 : (this.status == 'tracking' ? 1 : )
			},
			update: function () {
				if (!this.updating)
					return;

				requestAnimationFrame(this.update.bind(this));
				if (this.status != this._status) {
					if (this._status === 'idle') {
						if (~~this.anims[0].currentFrame < 3) {
							if (this.status == 'tracking') {
								this.set(1);
								this.anims[0].setDirection(1);
								this.anims[1].stop();
								this._status = 'tracking';
								this.trackFrom = 0;
							} else if (this.status === 'closed') {
								this.set(2);
								this.anims[2].goToAndPlay(0);
								this.anims[2].loop = false;
								this._status = this.status;
							}
						} else if (this.anims[0].currentFrame < 90) {
							this.anims[0].setDirection(-1);
						}
					} else if (this._status === 'tracking') {
						if (this.trackFrom < 1) {
							if (this.status === 'idle') {
								this.set(0);
								this._status = this.status;
							} else if (this.status === 'closed') {
								this.set(2);
								this.anims[2].goToAndPlay(0);
								this.anims[2].loop = false;
								this._status = this.status;
							} else if (this.status === 'closed') {
								this.set(2);
								this.anims[2].goToAndPlay(0);
								this.anims[2].loop = false;
								this._status = this.status;
							}
						}
					} else if (this._status === 'closed') {
						if (this.status === 'peek') {
							if (this.anims[2].currentFrame >= 49) {
								this.set(3);
								this.anims[3].goToAndPlay(0);
								this.anims[3].loop = false;
								this._status = this.status;
							}
						}
					} else if (this._status === 'peek') {
						if (this.status === 'closed') {
							if (this.anims[3].currentFrame >= 32) {
								this.set(2);
								this.anims[2].pause();
								this._status = this.status
							} else {
								this.anims[3].play();
							}
						}
					}
				}

				if (this.status == 'closed' && this._status == this.status) {
					if (this.anims[2].currentFrame >= 49)
						this.anims[2].pause();
				}
				if (this.status == 'peek' && this._status == this.status) {
					if (this.anims[3].currentFrame >= 16.5)
						this.anims[3].pause();
				}

				if (this._status == 'tracking') {
					this.trackFrom = this.trackFrom + (this.trackTo - this.trackFrom) * 0.1;
					this.anims[1].renderer.renderFrame(this.trackFrom);
				}
			},
			start: function () {
				if (this.updating)
					return;
				this.updating = true;
				this.update();
			},
			stop: function () {
				this.updating = false;
			}
		});
		Monkey.animationNames = [
			'MonkeyIdle',
			'MonkeyTracking',
			'MonkeyClose',
			'MonkeyPeek',
			// 'MonkeyCloseAndPeek',
			// 'MonkeyCloseAndPeekToIdle'
		];
		Monkey.src = 'assets/animations/{animationName}.json';

		monkey = new Monkey();
		var c = $('#intro');
		var phonecode = $('.input.phonecode input'), password = $('.input.password input');
		$ev(phonecode, ['focus', 'change', 'keyup', 'keypress', 'mousedown', 'mouseup'], function () {
			if ($hasclass(c, 'c-phone-code'))
				monkey.track(phonecode.selectionStart / 20);
		});
		$ev(phonecode, ['blur'], function () {
			if ($hasclass(c, 'c-phone-code'))
				monkey.idle();
		});


		proto.sendAPIMethod('help.getNearestDc', {}, function (status, data) {
			if (status) {
				var country = data.country;
				for (var i = 0; i < countries.length; ++i) {
					if (countries[i].code == country) {
						selectCountry(i);
						break;
					}
				}
				// if ()
			}
		})
	});

	$ev($('.input.phone input'), ['change', 'keyup'], function () {
		updateLoginReady();
		var value = $('.input.phone input').value.replace(/[^\d]/g, ''), C = [];
		for (var i = 0; i < value.length; ++i) {
			var u = '+'+value.substring(0, value.length - i);
			for (var c = 0; c < countries.length; ++c)
				if (countries[c].phoneCode == u)
					C.push(countries[c]);
		}
		if (C.length >= 1) {
			var selectedCountry = $('.inputSelect.country input').value;
			for (var c = 0; c < C.length; ++c) {
				if (selectedCountry == C[c].name)
					return;
			}
			$('.inputSelect.country input').value = C[0].name;
			$addclass($('.inputSelect.country'), 'typed');
		}
	});

	function turnPage(name) {
		var intro = $("#intro");
		var active = $('#' + intro.className || 'login');
		$t(5, function() {intro.className = name;});

		$('#'+name).style.display = 'block';
		$t(200, function () { active.style.display = 'none'; });

		if (name == 'c-password')
			monkey.close();

		if (['c-phone-code', 'c-password'].indexOf(name)>=0) {
			monkey.start();

			// $t(5, function () { 
				$('#c-code').style.display = 'block' 
			// });
		} else if (['c-phone-code', 'c-password'].indexOf(active.id)>=0) {
			monkey.stop();
			$t(200, function() { $('#c-code').style.display = 'none' });
		}

		if (name == 'c-phone-code') {
			$('#c-phone-code .input input').focus();
		}
	}
	function formatPhoneNumber(number) {
		return number;
	}
	var phoneNumber = null;
	var phoneCodeHash = null; 
	var lastFloodMsg = null;
	function login() {
		if (!isLoginReady())
			return;
		if ($hasclass($('#c-login button'), 'loading'))
			return;
		$addclass($('#c-login button'),'loading');
		phoneNumber = '+' + $('#c-login .input.phone input').value.replace(/[^\d]/g,'');
		var formatted = formatPhoneNumber(phoneNumber)
		var authOptions = {
			settings: {
				_: 'codeSettings',
				flags: 0
			},
			api_id: API_ID,
			api_hash: API_HASH,
			phone_number: phoneNumber
		};
		proto.sendAPIMethod('auth.sendCode', authOptions, callback);
		function callback(status, data) {
			$rmclass($('#c-login button'), 'loading');
			if (status) {
				turnPage('c-phone-code');
				$('#c-phone-code .input input').value = '';
				$('#c-phone-code h1 span').innerText = formatted;
				phoneCodeHash = data.phone_code_hash;
				console.log(data)
			} else {
				if (data.error_message == 'PHONE_NUMBER_INVALID')
					$run($('#c-login .input.phone'), 'Error', {text: 'Invalid Phone Number'});
				else if (data.error_message == 'AUTH_RESTART') {
					$addclass($('#c-login button'), 'loading');
					proto.sendAPIMethod('auth.sendCode', authOptions, callback);
				} else if (data.error_message.slice(0, 14) == 'PHONE_MIGRATE_') {
					$addclass($('#c-login button'), 'loading');
					var newDC = parseInt(data.error_message.slice(14));
					proto.auth_key = null;
					Storage.set('DC', newDC);
					proto.DC = newDC;
					proto.socket.close();
					proto.connected = false;
					proto.connect();
					proto.sendAPIMethod('auth.sendCode', authOptions, callback);
				} else if (data.error_message.slice(0,11) == 'FLOOD_WAIT_') {
					var sec = parseInt(data.error_message.slice(11));
					var min = ~~(sec / 60);
					sec = sec % 60;
					if (sec < 10) sec = '0'+sec;
					if (min < 10) min = '0'+min;
					$('#c-login .errorText').innerText = 'Flood warning: Wait ' + min+'m:'+sec+'s.';
					$('#c-login .errorText').style.opacity = 0.7;
					lastFloodMsg = Date.now();
					$t(5000, function () {
						if (Date.now() - lastFloodMsg > 4500)
							$('#c-login .errorText').style.opacity = 0;
					})
				} else if (data.error_message == 'PHONE_NUMBER_FLOOD') {
					$('#c-login .errorText').innerText = 'Flood Warning';
					$('#c-login .errorText').style.opacity = 0.7;
					lastFloodMsg = Date.now();
					$t(5000, function () {
						if (Date.now() - lastFloodMsg > 4500)
							$('#c-login .errorText').style.opacity = 0;
					})
				}
				console.warn(data);
			}
		}
		// turnPage('c-phone-code');
	}
	$ev(window, 'keypress', function (evt) {
		if (evt.keyCode == 13 && $hasclass($('#intro'), 'c-login'))
			login();
	})
	$click(login)($('#c-login button'));
	$click(function () {
		turnPage('c-login');
	})($('#c-phone-code .edit'));
	var sentCodes = {};
	$ev($('#c-phone-code .input.phonecode input'), ['change', 'keypress', 'keyup'], function () {
		var val = $('#c-phone-code .input.phonecode input').value.trim();
		if (typeof sentCodes[val] !== 'undefined' && !sentCodes[val])
			$run($('#c-phone-code .input'), 'Error', {text: 'Code'});

		if (val.length == 5 && typeof sentCodes[val] === 'undefined') {
			sentCodes[val] = true;
			proto.sendAPIMethod('auth.signIn', {
				phone_number: phoneNumber,
				phone_code: val,
				phone_code_hash: phoneCodeHash
			}, function (status, data) {
				if (status) {
					if (data._ == "auth.authorizationSignUpRequired") {
						turnPage('c-register');
					} else if (data._ == 'auth.authorization') {
						window.auth = {
							key: S64(proto.auth_key),
							user: data.user
						};
						Storage.set('auth', auth);
						hideIntro();
						startApp();
					} else {
						console.log(data);
					}
				} else {
					if (data.error_message == 'PHONE_CODE_INVALID') {
						$run($('#c-phone-code .input'), 'Error', {text: 'Code'});
						sentCodes[val] = false;
					} else if (data.error_message == 'SESSION_PASSWORD_NEEDED') {
						turnPage('c-password');
						initPassword();
					}
					console.log('err:', data);
				}
			})
		}
	});
	$click(function () {
		var firstName = $('#c-register .input.name input').value;
		var lastName  = $('#c-register .input.last input').value;
		proto.sendAPIMethod('auth.signUp', {
			phone_number: phoneNumber,
			phone_code_hash: phoneCodeHash,
			first_name: firstName,
			last_name: lastName
		}, function (status, data) {
			if (status) {
				if (data._ == 'auth.authorization') {
					window.auth = {
						key: S64(proto.auth_key),
						user: data.user
					};
					Storage.set('auth', auth);
					hideIntro();
					startApp();
				}
			} else {
				console.warn(data);
			}
		})
	})($('#c-register button'))

	function isLoginReady() {
		var number = $('#c-login .input.phone input').value.replace(/[^\d]/g,'');
		return typeof proto !== 'undefined' && proto.connected;
	}
	function updateLoginReady() {
		if (isLoginReady())
			$addclass($('#c-login button'), 'ready');
		else $rmclass($('#c-login button'), 'ready');
	}
	updateLoginReady();

	var passwordInput = $('#c-password .input.password');
	$click(function () {
		var input = passwordInput.querySelector('input');
		var visible = $hasclass(passwordInput, 'visible');
		$setclass(passwordInput, 'visible', !visible);
		input.type = visible ? 'password' : 'text';
		monkey[visible ? 'close' : 'peek']();
	})(passwordInput.querySelector('.button'));

	var salt1, salt2, g, p, g_b, srp_id, x, v, k_v, k;
	var passwordInited = false;
	function initPassword() {
		passwordInited = false;
		$addclass($('#c-password button'), 'loading');
		proto.sendAPIMethod('account.getPassword', {}, function (status, data) {
			if (!status) {
				console.warn('wtf, account.getPassword error');
				return;
			}

			console.log('account.getPassword = ', data);
			if (data.new_algo._ == 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow') {
				salt1 = data.new_algo.salt1;
				salt2 = data.new_algo.salt2;
				g = data.new_algo.g;
				p = data.new_algo.p;

				// TODO: checking p and g

			} else {
				console.warn('new_algo wrong predicate');
				return;
			}
			
			g_b = data.srp_B;
			srp_id = data.srp_id;

			k = H(concat(p, int32(g)));

			$rmclass($('#c-password button'), 'loading');
			$('#c-password .input .placeholder').innerText = /*data.hint ||*/ 'Password';
			passwordInited = true;
		});
	}

	function H(data) {
		console.log('H('+S(data)+')');
		return B(sha256(data));
	}
	function H2(data) {
		console.log('H2('+S(data)+')');
		return B(sha256(data));
	}
	function SH(data, salt) {
		console.log('SH('+S(data)+','+S(salt)+')');
		return H(concat(salt, data, salt));
	}
	function PH1(password, salt1, salt2) {
		console.log('PH1('+S(password)+','+S(salt1)+','+S(salt2)+')');
		return SH(SH(password, salt1), salt2);
	}
	function PH2(password, salt1, salt2, callback) {
		//SH(pbkdf2(PH1(password, salt1, salt2), salt1, 100000), salt2);
		_pbkdf2(PH1(password, salt1, salt2), salt1, 100000, function (p) {
			callback(SH(p, salt2));
		});
	}
	function _pbkdf2(password, salt, iterations, callback) {
		// window.pbkdf2.pbkdf2(Sraw(password), salt, iterations, 256, 'sha256', callback);
		window.crypto.subtle.importKey(
			'raw',
			password, 
			{name: "PBKDF2"},
			false,
			['deriveBits', 'deriveKey']
		).then(function (key) {
			return window.crypto.subtle.deriveKey(
				{
					name: "PBKDF2",
					salt: salt,
					iterations: iterations,
					hash: "SHA-256"
				},
				key,
				{name: "AES-CBC", length: 256},
				true,
				['encrypt', 'decrypt']
			);
		}).then(function (webKey) {
			return window.crypto.subtle.exportKey('raw', webKey);
		}).then(callback)
	}

	$click(submitPassword)($('#c-password button'))

	function submitPassword() {
		if (!passwordInited)
			return;
		
		var password = $('#c-password .input input').value;
		var passBinary = typeof TextEncoder !== 'undefined' ? (new TextEncoder().encode(password)) : Braw(password);

		PH2(passBinary, salt1, salt2, function (x) {
			console.log('x ['+x.byteLength+'] ' + S(x, ' '));
			var xInt = bigInt(S(x), 16);
			console.log('x = ' + xInt.toString(10));
			var pInt = bigInt(S(p), 16);
			console.log('p = ' + pInt.toString(10));
			v = bigInt(g).modPow(xInt, pInt);
			k_v = bigInt(S(k), 16).multiply(v).mod(pInt);

			var A = randomBytes(256);
			console.log('A [' + A.byteLength + "] " + S(A, ' '));
			var a = bigInt(S(A), 16);
			console.log('a = ' + a.toString(10));
			var g_a = bigInt(g).modPow(a, pInt);
			console.log('g_a = ' + g_a.toString(10));

			var u = H(concat(B(g_a.toString(16), p.byteLength), g_b));
			var uInt = bigInt(S(u), 16);
			console.log('u = ' + uInt.toString(10));

			var g_bInt = bigInt(S(g_b), 16);
			console.log('g_b = ' + g_bInt.toString(10));

			var t = g_bInt.minus(k_v).mod(pInt);
			if (t.isNegative())
				t = t.plus(pInt);
			console.log('t = ' + t.toString(10));

			var s_a = t.modPow(a.plus(uInt.multiply(xInt)), pInt);
			var k_a = H(B(s_a.toString(16)));
			console.log('k_a [' +k_a.byteLength + '] ' + S(k_a, ' '));

			var m1cont = concat(xor(H(p), H(int32(g))), H2(salt1), H2(salt2), 
					   B(g_a.toString(16), p.byteLength), 
					   B(g_b.toString(16), p.byteLength),
					   B(k_a.toString(16), p.byteLength));
			var M1 = H(m1cont);
			console.log('m1cont [' + m1cont.byteLength + "] " + S(m1cont));
			console.log('m1 [' + M1.byteLength + '] ' + S(M1));

			proto.sendAPIMethod('auth.checkPassword', {
				password: {
					_: "inputCheckPasswordSRP",
					srp_id: srp_id,
					A: A,
					M1: M1
				}
			}, (status, data) => {
				console.log(status, data);
			});
		});
	}
}