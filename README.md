# telegram-web

Made specially for [Telegram JavaScript Contest](https://t.me/contest/118).
Should be hosted at [telegram.dkaraush.me](https://telegram.dkaraush.me)

Uploaded source (not obfuscated) code recently, since I stopped participating in those JS contests.

## What protocol was used?
Raw [MTProto](https://core.telegram.org/mtproto/description) with WebSockets. For those, like me, who stumbled upon
it and need more source code, I recommend you to watch [this script](https://github.com/dkaraush/telegram-web/blob/master/assets/scripts/mtproto.js).
Also, I recommend you to look at [webogram](https://github.com/zhukov/webogram)'s sources, but, as I remember, 
it doesn't have WebSockets implementation.

## Why code is so ugly?
That's what happens, when you restrict your participants to use any UI framework. 
Needless to say, that in the result there would be an another framework or just 
some strange buildings of HTML and vanilla JS. I chose second variant, because after 
a week of implementing MTProto, I was left with another last week :)

Also, I tried to support older browsers and use polyfills, but at the end just screwed up 
with optimization of decomposizing p and q in Diffie-Hellman. 
So, Internet Explorer freezes after trying to connect to the server.

## How to leave an account?
Minimal contest requirements were about proper login and sending/receiving text messages. In design markups there was a "Leave" button, but it was in settings and I wanted to make them in second stage.

So, the only way to exit in my version of telegram is to launch `Storage.remove("auth");` in console (F12) :D

## What's the result?

[4th place, $1000](https://t.me/contest/146) (Bold Wolf).

This contest, like many others from Telegram, actually gave me a push to study and explore more.
Before [charts contest](https://t.me/contest/6), I did know nothing about WebGL;
before [blockchain contests](https://t.me/contest/102), I did know nothing about blockchains and smart-contracts;
before this contest, I did know a little about cryptography and protocols.

So, personally for me, it's definitely not about prize primarily, but about new knowledge and skills.
