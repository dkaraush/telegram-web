var auth = Storage.get('auth'), DC = Storage.get('DC')||2;
var proto = new MTProto({
	debug: true,
	auth_key: (auth||{key:null}).key,
	test: false	,
	DC: DC,
	main: true
});
proto.connect();

if (auth) {
	startApp();
} else {
	startIntro();
}