// translations.telegram.org support
//
// Unfortunately, there is no lang pack for web.
// Other lang packs don't fit into web version.
//
// Now there are hardcoded texts. 
// When lang pack will be available, it could be added here.

var T = $win.T = function (alias, el) {

}
T.lang = 'en';
T.data = {};
T.setLang = function (code) {
	code = code.trim().toLowerCase();

	// T.load(code);

	if (code === 'en') {
		T.data.en = {
			changeLang: 'Change language to English',
			introLoginTitle: 'Sign in to Telegram',
			introLoginDescription: 'Please confirm your country and\nenter your phone number.',
			introLoginCountryInputPlaceholder: 'Country',
			introLoginPhoneNumberInputPlaceholder: 'Phone Number',
			introLoginPhoneNumberInputPlaceholderInvalid: 'Invalid Phone Number',
			introLoginSubmit: 'NEXT',
			introLoginSubmitLoading: 'PLEASE WAIT...',
			introCodeDescription: 'We have sent you an SMS\nwith the code.',
			introCodeInputPlaceholder: 'Code',
			introCodeInputPlaceholderInvalid: 'Invalid Code',
			introPasswordTitle: 'Enter a Password',
			introPasswordDescription: 'Your account is protected with\nan additional password.',
			introPasswordInputPlaceholder: 'Password',
			introPasswordInputPlaceholderError: 'Wrong Password',
			introPasswordSubmit: 'NEXT',
			introPasswordSubmitLoading: 'PLEASE WAIT...',
			introRegisterTitle: 'Your name',
			introRegisterDescription: 'Enter your name and add\na profile picture.',
			introRegisterFirstNameInputPlaceholder: 'Name',
			introRegisterLastNameInputPlaceholder: 'Last Name (optional)',
			introRegisterSubmit: 'START MESSAGING',
			introRegisterSubmitLoading: 'PLEASE WAIT...'
		}
	} else if (code === 'ua') {
		T.data.ua = {
			changeLang: 'Змінити мову на Українську',
			introLoginTitle: 'Вхід в Telegram',
			introLoginDescription: 'Будь ласка, перевірте вашу країну та\nвведіть ваш номер телефону.',
			introLoginCountryInputPlaceholder: 'Країна',
			introLoginPhoneNumberInputPlaceholder: 'Номер телефону',
			introLoginPhoneNumberInputPlaceholderInvalid: 'Недійсний номер телефону',
			introLoginSubmit: 'ДАЛІ',
			introLoginSubmitLoading: 'ЗАЧЕКАЙТЕ...',
			introCodeDescription: 'Ми відправили вам SMS з кодом.',
			introCodeInputPlaceholder: 'Код',
			introCodeInputPlaceholderInvalid: 'Неправильний код',
			introPasswordTitle: 'Введіть пароль',
			introPasswordDescription: 'Ваш профіль захищен додатковим паролем.',
			introPasswordInputPlaceholder: 'Пароль',
			introPasswordInputPlaceholderError: 'Неправильний пароль',
			introPasswordSubmit: 'ДАЛІ',
			introPasswordSubmitLoading: 'ЗАЧЕКАЙТЕ...',
			introRegisterTitle: 'Ваше ім\'я',
			introRegisterDescription: 'Введіть ваше ім\'я та додайте\nфото профілю.',
			introRegisterFirstNameInputPlaceholder: 'Ім\'я',
			introRegisterLastNameInputPlaceholder: 'Прізвище (необов\'язково)',
			introRegisterSubmit: 'ПОЧАТИ СПІЛКУВАННЯ',
			introRegisterSubmitLoading: 'ЗАЧЕКАЙТЕ...'
		}
	} else if (code === 'ru') {
		T.data.ru = {
			changeLang: 'Сменить язык на русский',
			introLoginTitle: 'Войти в Telegram',
			introLoginDescription: 'Пожалуйста, проверьте вашу страну и\nвведите свой номер телефона.',
			introLoginCountryInputPlaceholder: 'Страна',
			introLoginPhoneNumberInputPlaceholder: 'Номер телефона',
			introLoginPhoneNumberInputPlaceholderInvalid: 'Недопустимый номер телефона',
			introLoginSubmit: 'ДАЛЕЕ',
			introLoginSubmitLoading: 'ПОЖАЛУЙСТА, ПОДОЖДИТЕ...',
			introCodeDescription: 'Мы отправили вам SMS с кодом.',
			introCodeInputPlaceholder: 'Код',
			introCodeInputPlaceholderInvalid: 'Неправильний код',
			introPasswordTitle: 'Введите пароль',
			introPasswordDescription: 'Ваш аккаунт защищен дополнительным паролем.',
			introPasswordInputPlaceholder: 'Пароль',
			introPasswordInputPlaceholderError: 'Неправильний пароль',
			introPasswordSubmit: 'ДАЛЕЕ',
			introPasswordSubmitLoading: 'ПОЖАЛУЙСТА, ПОДОЖДИТЕ...',
			introRegisterTitle: 'Ваше имя',
			introRegisterDescription: 'Введите ваше имя и добавьте\nфото профиля.',
			introRegisterFirstNameInputPlaceholder: 'Имя',
			introRegisterLastNameInputPlaceholder: 'Фамилия (необязательно)',
			introRegisterSubmit: 'НАЧАТЬ ОБЩЕНИЕ',
			introRegisterSubmitLoading: 'ПОЖАЛУЙСТА, ПОДОЖДИТЕ...'
		}
	}
}
// T.load = function (code) {
	// var localData = localStorage.getItem('langpack_'+code);
	// if (localData != null) {
	// 	T.data[code] = localData;
	// 	T.lang = code;
	// 	return;
	// }

	// proto.sendAPIMethod('langpack.getLangPack', {
	// 	lang_code: code,
	// 	lang_pack: 'ios' // 'web'
	// }, function (status, data) {
	// 	if (status) {
	// 		var _data = {};
	// 		for (var i = 0; i < data.strings.length; ++i) {
	// 			_data[data.strings[i].key] = data.strings[i].value;
	// 		}
	// 		T.data[code] = _data;
	// 		T.lang = code;
	// 		localStorage.setItem('langpack_'+code, JSON.stringify(_data));
	// 	} else {
	// 		if (data.error_message == 'LANG_PACK_INVALID') {
	// 			console.error('Language pack was not found.');
	// 		} else if (data.error_message == "LANG_CODE_NOT_SUPPORTED") {
	// 			console.warn('Language "' + code + '" is not supported.');
	// 			T.load('en');

	// 		}
	// 	}
	//})

// }