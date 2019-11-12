/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

var TLSerialization = window.TLSerialization = function (options) {
  options = options || {}
  this.maxLength = options.startMaxLength || 2048 // 2Kb
  this.offset = 0 // in bytes

  this.createBuffer()

  // this.debug = options.debug !== undefined ? options.debug : Config.Modes.debug
  this.mtproto = options.mtproto || false
  return this
}

TLSerialization.prototype.createBuffer = function () {
  this.buffer = new ArrayBuffer(this.maxLength)
  this.intView = new Int32Array(this.buffer)
  this.byteView = new Uint8Array(this.buffer)
}

TLSerialization.prototype.getArray = function () {
  var resultBuffer = new ArrayBuffer(this.offset)
  var resultArray = new Int32Array(resultBuffer)

  resultArray.set(this.intView.subarray(0, this.offset / 4))

  return resultArray
}

TLSerialization.prototype.getBuffer = function () {
  return this.getArray().buffer
}

TLSerialization.prototype.getBytes = function (typed) {
  if (typed) {
    var resultBuffer = new ArrayBuffer(this.offset)
    var resultArray = new Uint8Array(resultBuffer)

    resultArray.set(this.byteView.subarray(0, this.offset))

    return resultArray
  }

  var bytes = []
  for (var i = 0; i < this.offset; i++) {
    bytes.push(this.byteView[i])
  }
  return bytes
}

TLSerialization.prototype.checkLength = function (needBytes) {
  if (this.offset + needBytes < this.maxLength) {
    return
  }

  console.trace('Increase buffer', this.offset, needBytes, this.maxLength)
  this.maxLength = Math.ceil(Math.max(this.maxLength * 2, this.offset + needBytes + 16) / 4) * 4
  var previousBuffer = this.buffer
  var previousArray = new Int32Array(previousBuffer)

  this.createBuffer()

  new Int32Array(this.buffer).set(previousArray)
}

TLSerialization.prototype.writeInt = function (i, field) {
  this.debug && console.log('>>>', i.toString(16), i, field)

  this.checkLength(4)
  this.intView[this.offset / 4] = i
  this.offset += 4
}

TLSerialization.prototype.storeInt = function (i, field) {
  this.writeInt(i, (field || '') + ':int')
}

TLSerialization.prototype.storeBool = function (i, field) {
  if (i) {
    this.writeInt(0x997275b5, (field || '') + ':bool')
  } else {
    this.writeInt(0xbc799737, (field || '') + ':bool')
  }
}

TLSerialization.prototype.storeLongP = function (iHigh, iLow, field) {
  this.writeInt(iLow, (field || '') + ':long[low]')
  this.writeInt(iHigh, (field || '') + ':long[high]')
}

TLSerialization.prototype.storeLong = function (sLong, field) {
	if (sLong instanceof ArrayBuffer) {
		return this.storeIntBytes(sLong, 64, field);
	}

  if (Array.isArray(sLong)) {
    if (sLong.length == 2) {
      return this.storeLongP(sLong[0], sLong[1], field)
    } else {
      return this.storeIntBytes(sLong, 64, field)
    }
  }

  if (typeof sLong != 'string') {
    sLong = sLong ? sLong.toString() : '0'
  }
  var divRem = bigStringInt(sLong).divmod(bigint(0x100000000))

  this.writeInt(intToUint(divRem.remainder.toJSNumber()), (field || '') + ':long[low]')
  this.writeInt(intToUint(divRem.quotient.toJSNumber()), (field || '') + ':long[high]')
}

TLSerialization.prototype.storeDouble = function (f, field) {
  var buffer = new ArrayBuffer(8)
  var intView = new Int32Array(buffer)
  var doubleView = new Float64Array(buffer)

  doubleView[0] = f

  this.writeInt(intView[0], (field || '') + ':double[low]')
  this.writeInt(intView[1], (field || '') + ':double[high]')
}

TLSerialization.prototype.storeString = function (s, field) {
  this.debug && console.log('>>>', s, (field || '') + ':string')

  if (s === undefined) {
    s = ''
  }
  var sUTF8 = unescape(encodeURIComponent(s))

  this.checkLength(sUTF8.length + 8)

  var len = sUTF8.length
  if (len <= 253) {
    this.byteView[this.offset++] = len
  } else {
    this.byteView[this.offset++] = 254
    this.byteView[this.offset++] = len & 0xFF
    this.byteView[this.offset++] = (len & 0xFF00) >> 8
    this.byteView[this.offset++] = (len & 0xFF0000) >> 16
  }
  for (var i = 0; i < len; i++) {
    this.byteView[this.offset++] = sUTF8.charCodeAt(i)
  }

  // Padding
  while (this.offset % 4) {
    this.byteView[this.offset++] = 0
  }
}

TLSerialization.prototype.storeBytes = function (bytes, field) {
  if (bytes instanceof ArrayBuffer) {
    bytes = new Uint8Array(bytes)
  }
  else if (bytes === undefined) {
    bytes = []
  }
  this.debug && console.log('>>>', bytesToHex(bytes), (field || '') + ':bytes')

  var len = bytes.byteLength || bytes.length
  this.checkLength(len + 8)
  if (len <= 253) {
    this.byteView[this.offset++] = len
  } else {
    this.byteView[this.offset++] = 254
    this.byteView[this.offset++] = len & 0xFF
    this.byteView[this.offset++] = (len & 0xFF00) >> 8
    this.byteView[this.offset++] = (len & 0xFF0000) >> 16
  }

  this.byteView.set(bytes, this.offset)
  this.offset += len

  // Padding
  while (this.offset % 4) {
    this.byteView[this.offset++] = 0
  }
}

TLSerialization.prototype.storeIntBytes = function (bytes, bits, field) {
  if (bytes instanceof ArrayBuffer) {
    bytes = new Uint8Array(bytes);
  }
  var len = bytes.length;
  if ((bits % 32) || (len * 8) != bits) {
    throw new Error('Invalid bits: ' + bits + ', ' + bytes.length + " (field: " + field + ")")
  }

  this.debug && console.log('>>>', bytesToHex(bytes), (field || '') + ':int' + bits)
  this.checkLength(len)

  this.byteView.set(bytes, this.offset)
  this.offset += len
}

TLSerialization.prototype.storeRawBytes = function (bytes, field) {
  if (bytes instanceof ArrayBuffer) {
    bytes = new Uint8Array(bytes)
  }
  var len = bytes.length

  this.debug && console.log('>>>', bytesToHex(bytes), (field || ''))
  this.checkLength(len)

  this.byteView.set(bytes, this.offset)
  this.offset += len
}

TLSerialization.prototype.storeMethod = function (methodName, params) {
  var schema = window.Schema;
  var methodData = false,
    i

  for (i = 0; i < schema.methods.length; i++) {
    if (schema.methods[i].method == methodName) {
      methodData = schema.methods[i]
      break
    }
  }
  if (!methodData) {
    throw new Error('No method ' + methodName + ' found')
  }

  this.storeInt(intToUint(methodData.id), methodName + '[id]')

  var param, type
  var i, condType
  var fieldBit
  var len = methodData.params.length
  for (i = 0; i < len; i++) {
    param = methodData.params[i]
    type = param.type
    if (type.indexOf('?') !== -1) {
      condType = type.split('?')
      fieldBit = condType[0].split('.')
      if (!(params[fieldBit[0]] & (1 << fieldBit[1]))) {
        continue
      }
      type = condType[1]
    }
    this.storeObject(params[param.name], type, methodName + '[' + param.name + ']')
  }

  return methodData.type
}

TLSerialization.prototype.storeObject = function (obj, type, field) {
  switch (type) {
    case '#':
    case 'int':
      return this.storeInt(obj, field)
    case 'long':
      return this.storeLong(obj, field)
    case 'int128':
      return this.storeIntBytes(obj, 128, field)
    case 'int256':
      return this.storeIntBytes(obj, 256, field)
    case 'int512':
      return this.storeIntBytes(obj, 512, field)
    case 'string':
      return this.storeString(obj, field)
    case 'bytes':
      return this.storeBytes(obj, field)
    case 'double':
      return this.storeDouble(obj, field)
    case 'Bool':
      return this.storeBool(obj, field)
    case 'true':
      return
  }

  if (Array.isArray(obj)) {
    if (type.substr(0, 6) == 'Vector') {
      this.writeInt(0x1cb5c415, field + '[id]')
    }
    else if (type.substr(0, 6) != 'vector') {
      throw new Error('Invalid vector type ' + type)
    }
    var itemType;
    itemType = type.substr(7, type.length - 8 + (type[type.length-1]!='>'?1:0)); // for "Vector<itemType>"
    this.writeInt(obj.length, field + '[count]')
    for (var i = 0; i < obj.length; i++) {
      this.storeObject(obj[i], itemType, field + '[' + i + ']')
    }
    return true
  }
  else if (type.substr(0, 6).toLowerCase() == 'vector') {
    throw new Error('Invalid vector object')
  }

  if (typeof obj != 'object' || obj == null || Array.isArray(obj)) {
    throw new Error('Invalid object for type ' + type)
  }

  var schema = window.Schema;
  var predicate = obj['_']
  var isBare = false
  var constructorData = false, i;

  if (isBare = (type.charAt(0) == '%')) {
    type = type.substr(1)
  }

  for (i = 0; i < schema.constructors.length; i++) {
    if (schema.constructors[i].predicate == predicate) {
      constructorData = schema.constructors[i]
      break
    }
  }
  if (!constructorData) {
    throw new Error('No predicate ' + predicate + ' found')
  }

  if (predicate == type) {
    isBare = true
  }

  if (!isBare) {
    this.writeInt(intToUint(constructorData.id), field + '[' + predicate + '][id]')
  }

  var param, type
  var i, condType
  var fieldBit
  var len = constructorData.params.length
  for (i = 0; i < len; i++) {
    param = constructorData.params[i]
    type = param.type
    if (type.indexOf('?') !== -1) {
      condType = type.split('?')
      fieldBit = condType[0].split('.')
      if (!(obj[fieldBit[0]] & (1 << fieldBit[1]))) {
        continue
      }
      type = condType[1]
    }

    this.storeObject(obj[param.name], type, field + '[' + predicate + '][' + param.name + ']')
  }

  return constructorData.type
}

var TLDeserialization = window.TLDeserialization = function (buffer, options) {
  options = options || {}

  this.offset = 0 // in bytes
  this.override = options.override || {}

  this.buffer = buffer
  this.intView = new Uint32Array(this.buffer)
  this.byteView = new Uint8Array(this.buffer)

  // this.debug = options.debug !== undefined ? options.debug : Config.Modes.debug
  this.mtproto = options.mtproto || false
  return this
}

TLDeserialization.prototype.readInt = function (field) {
  if (this.offset >= this.intView.length * 4) {
    throw new Error('Nothing to fetch: ' + field)
  }

  var i = this.intView[this.offset / 4]

  this.debug && console.log('<<<', i.toString(16), i, field)

  this.offset += 4

  return i
}

TLDeserialization.prototype.fetchInt = function (field) {
  return this.readInt((field || '') + ':int')
}

TLDeserialization.prototype.fetchDouble = function (field) {
  var buffer = new ArrayBuffer(8)
  var intView = new Int32Array(buffer)
  var doubleView = new Float64Array(buffer)

  intView[0] = this.readInt((field || '') + ':double[low]'),
  intView[1] = this.readInt((field || '') + ':double[high]')

  return doubleView[0]
}

TLDeserialization.prototype.fetchLong = function (field) {
  var iLow = this.readInt((field || '') + ':long[low]')
  var iHigh = this.readInt((field || '') + ':long[high]')

  // var longDec = bigint(iHigh).shiftLeft(32).add(bigint(iLow)).toString()

  return new Int32Array([iLow, iHigh]).buffer;
}

TLDeserialization.prototype.fetchBool = function (field) {
  var i = this.readInt((field || '') + ':bool')
  if (i == 0x997275b5) {
    return true
  } else if (i == 0xbc799737) {
    return false
  }

  this.offset -= 4
  return this.fetchObject('Object', field)
}

TLDeserialization.prototype.fetchString = function (field) {
  var len = this.byteView[this.offset++]

  if (len == 254) {
    var len = this.byteView[this.offset++] |
      (this.byteView[this.offset++] << 8) |
      (this.byteView[this.offset++] << 16)
  }

  var sUTF8 = ''
  for (var i = 0; i < len; i++) {
    sUTF8 += String.fromCharCode(this.byteView[this.offset++])
  }

  // Padding
  while (this.offset % 4) {
    this.offset++
  }

  try {
    var s = decodeURIComponent(escape(sUTF8))
  } catch (e) {
    var s = sUTF8
  }

  this.debug && console.log('<<<', s, (field || '') + ':string')

  return s
}

TLDeserialization.prototype.fetchBytes = function (field) {
  var len = this.byteView[this.offset++]

  if (len == 254) {
    len = this.byteView[this.offset++] |
      (this.byteView[this.offset++] << 8) |
      (this.byteView[this.offset++] << 16)
  }

  var bytes = this.byteView.subarray(this.offset, this.offset + len)
  this.offset += len

  // Padding
  while (this.offset % 4) {
    this.offset++
  }

  this.debug && console.log('<<<', bytesToHex(bytes), (field || '') + ':bytes')

  return bytes
}

TLDeserialization.prototype.fetchIntBytes = function (bits, typed, field) {
  if (bits % 32) {
    throw new Error('Invalid bits: ' + bits)
  }

  var len = bits / 8
  if (typed) {
    var result = this.byteView.subarray(this.offset, this.offset + len)
    this.offset += len
    return result
  }

  var bytes = []
  for (var i = 0; i < len; i++) {
    bytes.push(this.byteView[this.offset++])
  }

  this.debug && console.log('<<<', bytesToHex(bytes), (field || '') + ':int' + bits)

  return new Uint8Array(bytes).buffer;
}

TLDeserialization.prototype.fetchRawBytes = function (len, typed, field) {
  if (len === false) {
    len = this.readInt((field || '') + '_length')
    if (len > this.byteView.byteLength) {
      throw new Error('Invalid raw bytes length: ' + len + ', buffer len: ' + this.byteView.byteLength)
    }
  }

  if (typed) {
    var bytes = new Uint8Array(len)
    bytes.set(this.byteView.subarray(this.offset, this.offset + len))
    this.offset += len
    return bytes
  }

  var bytes = []
  for (var i = 0; i < len; i++) {
    bytes.push(this.byteView[this.offset++])
  }

  this.debug && console.log('<<<', bytesToHex(bytes), (field || ''))

  return bytes
}

TLDeserialization.prototype.fetchObject = function (type, field) {
  // console.log('fetchObject('+arr(arguments).map(JSON.stringify).join(', ')+")");
  switch (type) {
    case '#':
    case 'int':
      return this.fetchInt(field)
    case 'long':
      return this.fetchLong(field)
    case 'int128':
      return this.fetchIntBytes(128, false, field)
    case 'int256':
      return this.fetchIntBytes(256, false, field)
    case 'int512':
      return this.fetchIntBytes(512, false, field)
    case 'string':
      return this.fetchString(field)
    case 'bytes':
      return this.fetchBytes(field)
    case 'double':
      return this.fetchDouble(field)
    case 'Bool':
      return this.fetchBool(field)
    case 'true':
      return true
  }

  field = field || type || 'Object'

  if (type.substr(0, 6) == 'Vector' || type.substr(0, 6) == 'vector') {
    if (type.charAt(0) == 'V') {
      var constructor = this.readInt(field + '[id]')
      var constructorCmp = uintToInt(constructor)

      if (constructorCmp == 0x3072cfa1) { // Gzip packed
        var compressed = this.fetchBytes(field + '[packed_string]')
        var uncompressed = gzipUncompress(compressed)
        var buffer = bytesToArrayBuffer(uncompressed)
        var newDeserializer = (new TLDeserialization(buffer))

        return newDeserializer.fetchObject(type, field)
      }
      if (constructorCmp != 0x1cb5c415) {
        throw new Error('Invalid vector constructor ' + constructor)
      }
    }
    var len = this.readInt(field + '[count]')
    var result = []
    if (len > 0) {
      var itemType = type.substr(7, type.length - 7 - (type[type.length-1]=='>'?1:0)); // for "Vector<itemType>"
      for (var i = 0; i < len; i++) {
        result.push(this.fetchObject(itemType, field + '[' + i + ']'))
      }
    }

    return result
  }

  var schema = window.Schema;
  var predicate = false;
  var constructorData = false

  if (type.charAt(0) == '%') {
    var checkType = type.substr(1)
    for (var i = 0; i < schema.constructors.length; i++) {
      if (schema.constructors[i].type == checkType) {
        constructorData = schema.constructors[i]
        break
      }
    }
    if (!constructorData) {
      throw new Error('Constructor not found for type: ' + type)
    }
  }
  else if (type.charAt(0) >= 97 && type.charAt(0) <= 122) {
    for (var i = 0; i < schema.constructors.length; i++) {
      if (schema.constructors[i].predicate == type) {
        constructorData = schema.constructors[i]
        break
      }
    }
    if (!constructorData) {
      throw new Error('Constructor not found for predicate: ' + type)
    }
  }else {
    var constructor = this.readInt(field + '[id]')
    var constructorCmp = uintToInt(constructor);

    if (constructorCmp == 0x3072cfa1) { // Gzip packed
      var compressed = this.fetchBytes(field + '[packed_string]')
      var uncompressed = gzipUncompress(compressed)
      var buffer = bytesToArrayBuffer(uncompressed)
      var newDeserializer = (new TLDeserialization(buffer))

      return newDeserializer.fetchObject(type, field)
    }

    var index = schema.constructorsIndex
    if (!index) {
      schema.constructorsIndex = index = {}
      for (var i = 0; i < schema.constructors.length; i++) {
        index[schema.constructors[i].id] = i
      }
    }
    var i = index[constructorCmp];
    if (typeof i === 'number') {
      constructorData = schema.constructors[i];
    }

    var fallback = false
    if (!constructorData) {
      var schemaFallback = window.Schema;
      for (i = 0; i < schemaFallback.constructors.length; i++) {
        if (schemaFallback.constructors[i].id == constructorCmp) {
          constructorData = schemaFallback.constructors[i]

          delete this.mtproto
          fallback = true
          break
        }
      }
    }
    if (!constructorData) {
      throw new Error('Constructor not found: ' + constructor + ' ' + this.fetchInt() + ' ' + this.fetchInt())
      // console.error('Constructor not found: ' + constructor + ' ' + this.fetchInt() + ' ' + this.fetchInt());
      // return {_: null};
    }
  }

  predicate = constructorData.predicate

  var result = {_: predicate};
  var overrideKey = (this.mtproto ? 'mt_' : '') + predicate
  var self = this

  if (this.override[overrideKey]) {
    this.override[overrideKey].apply(this, [result, field + '[' + predicate + ']'])
  } else {
    var i, param
    var type, isCond
    var condType, fieldBit
    var value
    var len = constructorData.params.length
    for (i = 0; i < len; i++) {
      param = constructorData.params[i]
      type = param.type
      if (type == '#' && result.pFlags === undefined) {
        result.pFlags = {}
      }
      if (isCond = (type.indexOf('?') !== -1)) {
        condType = type.split('?')
        fieldBit = condType[0].split('.')
        if (!(result[fieldBit[0]] & (1 << fieldBit[1]))) {
          continue
        }
        type = condType[1]
      }

      value = self.fetchObject(type, field + '[' + predicate + '][' + param.name + ']')

      if (isCond && type === 'true') {
        result.pFlags[param.name] = value
      } else {
        result[param.name] = value
      }
    }
  }

  if (fallback) {
    this.mtproto = true
  }

  return result
}

TLDeserialization.prototype.getOffset = function () {
  return this.offset
}

TLDeserialization.prototype.fetchEnd = function () {
  if (this.offset != this.byteView.length) {
    throw new Error('Fetch end with non-empty buffer')
  }
  return true
}


function bigint (num) {
  return bigInt(num.toString(16), 16)
}

function bigStringInt (strNum) {
  return bigInt(strNum, 10)
}

function dHexDump (bytes) {
  var arr = []
  for (var i = 0; i < bytes.length; i++) {
    if (i && !(i % 2)) {
      if (!(i % 16)) {
        arr.push('\n')
      } else if (!(i % 4)) {
        arr.push('  ')
      } else {
        arr.push(' ')
      }
    }
    arr.push((bytes[i] < 16 ? '0' : '') + bytes[i].toString(16))
  }

  console.log(arr.join(''))
}

function bytesToHex (bytes) {
  bytes = bytes || []
  var arr = []
  for (var i = 0; i < bytes.length; i++) {
    arr.push((bytes[i] < 16 ? '0' : '') + (bytes[i] || 0).toString(16))
  }
  return arr.join('')
}

function bytesFromHex (hexString) {
  var len = hexString.length,
    i
  var start = 0
  var bytes = []

  if (hexString.length % 2) {
    bytes.push(parseInt(hexString.charAt(0), 16))
    start++
  }

  for (i = start; i < len; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16))
  }

  return bytes
}

function bytesToBase64 (bytes) {
  var mod3
  var result = ''

  for (var nLen = bytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    mod3 = nIdx % 3
    nUint24 |= bytes[nIdx] << (16 >>> mod3 & 24)
    if (mod3 === 2 || nLen - nIdx === 1) {
      result += String.fromCharCode(
        uint6ToBase64(nUint24 >>> 18 & 63),
        uint6ToBase64(nUint24 >>> 12 & 63),
        uint6ToBase64(nUint24 >>> 6 & 63),
        uint6ToBase64(nUint24 & 63)
      )
      nUint24 = 0
    }
  }

  return result.replace(/A(?=A$|$)/g, '=')
}

function uint6ToBase64 (nUint6) {
  return nUint6 < 26
    ? nUint6 + 65
    : nUint6 < 52
      ? nUint6 + 71
      : nUint6 < 62
        ? nUint6 - 4
        : nUint6 === 62
          ? 43
          : nUint6 === 63
            ? 47
            : 65
}

function base64ToBlob (base64str, mimeType) {
  var sliceSize = 1024
  var byteCharacters = atob(base64str)
  var bytesLength = byteCharacters.length
  var slicesCount = Math.ceil(bytesLength / sliceSize)
  var byteArrays = new Array(slicesCount)

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    var begin = sliceIndex * sliceSize
    var end = Math.min(begin + sliceSize, bytesLength)

    var bytes = new Array(end - begin)
    for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0)
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes)
  }

  return blobConstruct(byteArrays, mimeType)
}

function dataUrlToBlob (url) {
  // var name = 'b64blob ' + url.length
  // console.time(name)
  var urlParts = url.split(',')
  var base64str = urlParts[1]
  var mimeType = urlParts[0].split(':')[1].split(';')[0]
  var blob = base64ToBlob(base64str, mimeType)
  // console.timeEnd(name)
  return blob
}

function blobConstruct (blobParts, mimeType) {
  var blob
  var safeMimeType = blobSafeMimeType(mimeType)
  try {
    blob = new Blob(blobParts, {type: safeMimeType})
  } catch (e) {
    var bb = new BlobBuilder
    angular.forEach(blobParts, function (blobPart) {
      bb.append(blobPart)
    })
    blob = bb.getBlob(safeMimeType)
  }
  return blob
}

function blobSafeMimeType(mimeType) {
  if ([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
  ].indexOf(mimeType) == -1) {
    return 'application/octet-stream'
  }
  return mimeType
}

function bytesCmp (bytes1, bytes2) {
  var len = bytes1.length
  if (len != bytes2.length) {
    return false
  }

  for (var i = 0; i < len; i++) {
    if (bytes1[i] != bytes2[i]) {
      return false
    }
  }
  return true
}

function bytesXor (bytes1, bytes2) {
  var len = bytes1.length
  var bytes = []

  for (var i = 0; i < len; ++i) {
    bytes[i] = bytes1[i] ^ bytes2[i]
  }

  return bytes
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

function bytesFromBigInt (bigInt, len) {
  var bytes = bigInt.toByteArray()

  if (len && bytes.length < len) {
    var padding = []
    for (var i = 0, needPadding = len - bytes.length; i < needPadding; i++) {
      padding[i] = 0
    }
    if (bytes instanceof ArrayBuffer) {
      bytes = bufferConcat(padding, bytes)
    } else {
      bytes = padding.concat(bytes)
    }
  }else {
    while (!bytes[0] && (!len || bytes.length > len)) {
      bytes = bytes.slice(1)
    }
  }

  return bytes
}

function bytesFromLeemonBigInt (bigInt, len) {
  var str = bigInt2str(bigInt, 16)
  return bytesFromHex(str)
}

function bytesToArrayBuffer (b) {
  return (new Uint8Array(b)).buffer
}

function convertToArrayBuffer (bytes) {
  // Be careful with converting subarrays!!
  if (bytes instanceof ArrayBuffer) {
    return bytes
  }
  if (bytes.buffer !== undefined &&
    bytes.buffer.byteLength == bytes.length * bytes.BYTES_PER_ELEMENT) {
    return bytes.buffer
  }
  return bytesToArrayBuffer(bytes)
}

function convertToUint8Array (bytes) {
  if (bytes.buffer !== undefined) {
    return bytes
  }
  return new Uint8Array(bytes)
}

function convertToByteArray (bytes) {
  if (Array.isArray(bytes)) {
    return bytes
  }
  bytes = convertToUint8Array(bytes)
  var newBytes = []
  for (var i = 0, len = bytes.length; i < len; i++) {
    newBytes.push(bytes[i])
  }
  return newBytes
}

function bytesFromArrayBuffer (buffer) {
  var len = buffer.byteLength
  var byteView = new Uint8Array(buffer)
  var bytes = []

  for (var i = 0; i < len; ++i) {
    bytes[i] = byteView[i]
  }

  return bytes
}

function bufferConcat (buffer1, buffer2) {
  var l1 = buffer1.byteLength || buffer1.length
  var l2 = buffer2.byteLength || buffer2.length
  var tmp = new Uint8Array(l1 + l2)
  tmp.set(buffer1 instanceof ArrayBuffer ? new Uint8Array(buffer1) : buffer1, 0)
  tmp.set(buffer2 instanceof ArrayBuffer ? new Uint8Array(buffer2) : buffer2, l1)

  return tmp.buffer
}

function longToInts (sLong) {
  var divRem = bigStringInt(sLong).divideAndRemainder(bigint(0x100000000))

  return [divRem[0].intValue(), divRem[1].intValue()]
}

function longToBytes (sLong) {
  return bytesFromWords({words: longToInts(sLong), sigBytes: 8}).reverse()
}

function longFromInts (high, low) {
  return bigint(high).shiftLeft(32).add(bigint(low)).toString(10)
}

function intToUint (val) {
  val = parseInt(val)
  if (val < 0) {
    val = val + 4294967296
  }
  return val
}

function uintToInt (val) {
  if (val > 2147483647) {
    val = val - 4294967296
  }
  return val
}

function sha1HashSync (bytes) {
  this.rushaInstance = this.rushaInstance || new Rusha(1024 * 1024)

  // console.log(dT(), 'SHA-1 hash start', bytes.byteLength || bytes.length)
  var hashBytes = rushaInstance.rawDigest(bytes).buffer
  // console.log(dT(), 'SHA-1 hash finish')

  return hashBytes
}

function sha1BytesSync (bytes) {
  return bytesFromArrayBuffer(sha1HashSync(bytes))
}

function sha256HashSync (bytes) {
  // console.log(dT(), 'SHA-2 hash start', bytes.byteLength || bytes.length)
  var hashWords = CryptoJS.SHA256(bytesToWords(bytes))
  // console.log(dT(), 'SHA-2 hash finish')

  var hashBytes = bytesFromWords(hashWords)

  return hashBytes
}

function addPadding (bytes, blockSize, zeroes) {
  blockSize = blockSize || 16
  var len = bytes.byteLength || bytes.length
  var needPadding = blockSize - (len % blockSize)
  if (needPadding > 0 && needPadding < blockSize) {
    var padding = new Array(needPadding)
    if (zeroes) {
      for (var i = 0; i < needPadding; i++) {
        padding[i] = 0
      }
    } else {
      (new SecureRandom()).nextBytes(padding)
    }

    if (bytes instanceof ArrayBuffer) {
      bytes = bufferConcat(bytes, padding)
    } else {
      bytes = bytes.concat(padding)
    }
  }

  return bytes
}

function aesEncryptSync (bytes, keyBytes, ivBytes) {
  var len = bytes.byteLength || bytes.length

  // console.log(dT(), 'AES encrypt start', len/*, bytesToHex(keyBytes), bytesToHex(ivBytes)*/)
  bytes = addPadding(bytes)

  var encryptedWords = CryptoJS.AES.encrypt(bytesToWords(bytes), bytesToWords(keyBytes), {
    iv: bytesToWords(ivBytes),
    padding: CryptoJS.pad.NoPadding,
    mode: CryptoJS.mode.IGE
  }).ciphertext

  var encryptedBytes = bytesFromWords(encryptedWords)
  // console.log(dT(), 'AES encrypt finish')

  return encryptedBytes
}

function aesDecryptSync (encryptedBytes, keyBytes, ivBytes) {

  // console.log(dT(), 'AES decrypt start', encryptedBytes.length)
  var decryptedWords = CryptoJS.AES.decrypt({ciphertext: bytesToWords(encryptedBytes)}, bytesToWords(keyBytes), {
    iv: bytesToWords(ivBytes),
    padding: CryptoJS.pad.NoPadding,
    mode: CryptoJS.mode.IGE
  })

  var bytes = bytesFromWords(decryptedWords)
  // console.log(dT(), 'AES decrypt finish')

  return bytes
}

function gzipUncompress (bytes) {
  // console.log('Gzip uncompress start')
  var result = (new Zlib.Gunzip(bytes)).decompress()
  // console.log('Gzip uncompress finish')
  return result
}

function nextRandomInt (maxValue) {
  return Math.floor(Math.random() * maxValue)
}

function pqPrimeFactorization (pqBytes) {
  var what = new BigInteger(pqBytes)
  var result = false

  // console.log(dT(), 'PQ start', pqBytes, what.toString(16), what.bitLength())

  try {
    result = pqPrimeLeemon(str2bigInt(what.toString(16), 16, Math.ceil(64 / bpe) + 1))
  } catch (e) {
    console.error('Pq leemon Exception', e)
  }

  if (result === false && what.bitLength() <= 64) {
    // console.time('PQ long')
    try {
      result = pqPrimeLong(goog.math.Long.fromString(what.toString(16), 16))
    } catch (e) {
      console.error('Pq long Exception', e)
    }
  // console.timeEnd('PQ long')
  }
  // console.log(result)

  if (result === false) {
    // console.time('pq BigInt')
    result = pqPrimeBigInteger(what)
  // console.timeEnd('pq BigInt')
  }

  // console.log(dT(), 'PQ finish')

  return result
}

function pqPrimeBigInteger (what) {
  var it = 0,
    g
  for (var i = 0; i < 3; i++) {
    var q = (nextRandomInt(128) & 15) + 17
    var x = bigint(nextRandomInt(1000000000) + 1)
    var y = x.clone()
    var lim = 1 << (i + 18)

    for (var j = 1; j < lim; j++) {
      ++it
      var a = x.clone()
      var b = x.clone()
      var c = bigint(q)

      while (!b.equals(BigInteger.ZERO)) {
        if (!b.and(BigInteger.ONE).equals(BigInteger.ZERO)) {
          c = c.add(a)
          if (c.compareTo(what) > 0) {
            c = c.subtract(what)
          }
        }
        a = a.add(a)
        if (a.compareTo(what) > 0) {
          a = a.subtract(what)
        }
        b = b.shiftRight(1)
      }

      x = c.clone()
      var z = x.compareTo(y) < 0 ? y.subtract(x) : x.subtract(y)
      g = z.gcd(what)
      if (!g.equals(BigInteger.ONE)) {
        break
      }
      if ((j & (j - 1)) == 0) {
        y = x.clone()
      }
    }
    if (g.compareTo(BigInteger.ONE) > 0) {
      break
    }
  }

  var f = what.divide(g), P, Q

  if (g.compareTo(f) > 0) {
    P = f
    Q = g
  } else {
    P = g
    Q = f
  }

  return [bytesFromBigInt(P), bytesFromBigInt(Q), it]
}

function gcdLong (a, b) {
  while (a.notEquals(goog.math.Long.ZERO) && b.notEquals(goog.math.Long.ZERO)) {
    while (b.and(goog.math.Long.ONE).equals(goog.math.Long.ZERO)) {
      b = b.shiftRight(1)
    }
    while (a.and(goog.math.Long.ONE).equals(goog.math.Long.ZERO)) {
      a = a.shiftRight(1)
    }
    if (a.compare(b) > 0) {
      a = a.subtract(b)
    } else {
      b = b.subtract(a)
    }
  }
  return b.equals(goog.math.Long.ZERO) ? a : b
}

function pqPrimeLong (what) {
  var it = 0,
    g
  for (var i = 0; i < 3; i++) {
    var q = goog.math.Long.fromInt((nextRandomInt(128) & 15) + 17)
    var x = goog.math.Long.fromInt(nextRandomInt(1000000000) + 1)
    var y = x
    var lim = 1 << (i + 18)

    for (var j = 1; j < lim; j++) {
      ++it
      var a = x
      var b = x
      var c = q

      while (b.notEquals(goog.math.Long.ZERO)) {
        if (b.and(goog.math.Long.ONE).notEquals(goog.math.Long.ZERO)) {
          c = c.add(a)
          if (c.compare(what) > 0) {
            c = c.subtract(what)
          }
        }
        a = a.add(a)
        if (a.compare(what) > 0) {
          a = a.subtract(what)
        }
        b = b.shiftRight(1)
      }

      x = c
      var z = x.compare(y) < 0 ? y.subtract(x) : x.subtract(y)
      g = gcdLong(z, what)
      if (g.notEquals(goog.math.Long.ONE)) {
        break
      }
      if ((j & (j - 1)) == 0) {
        y = x
      }
    }
    if (g.compare(goog.math.Long.ONE) > 0) {
      break
    }
  }

  var f = what.div(g), P, Q

  if (g.compare(f) > 0) {
    P = f
    Q = g
  } else {
    P = g
    Q = f
  }

  return [bytesFromHex(P.toString(16)), bytesFromHex(Q.toString(16)), it]
}