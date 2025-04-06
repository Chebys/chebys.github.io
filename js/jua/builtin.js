import {Scope, Jua_Null, Jua_Num, Jua_Str, Jua_Bool, Jua_Obj, Jua_Array, Jua_Func, Jua_NativeFunc, Jua_Buffer} from 'jua/value';

function _buildClass(proto, ctor){ //ctor为Jua_Func
	let classProto = new Jua_Obj;
	classProto.setProp('isClass', Jua_Bool.true);
	classProto.setProp('call', ctor);
	proto.proto = classProto;
}
function buildClass(proto, ctor){ //ctor为js函数，且不会接收第一个参数
	_buildClass(proto, new Jua_NativeFunc((_, ...args)=>ctor(...args)));
}

let obj_new = new Jua_NativeFunc((proto, ...args)=>{
	let obj = new Jua_Obj(proto);
	let initfn = proto.getProp('init');
	if(initfn instanceof Jua_Func)
		initfn.call([obj, ...args]);
	return obj;
});
_buildClass(Jua_Obj.proto, obj_new);
Jua_Obj.proto.setProp('new', obj_new);
Jua_Obj.proto.setProp('get', new Jua_NativeFunc((obj, key, mode)=>{
	if(!(key instanceof Jua_Str))
		throw 'non-string key: '+key.type;
	key = key.value;
	if(mode instanceof Jua_Str){
		if(mode.value=='own')
			return obj.getOwn(key);
		if(mode.value=='inherit')
			return obj.inheritProp(key);
	}
	return obj.getProp(key);
}));
Jua_Obj.proto.setProp('set', new Jua_NativeFunc((obj, key, value)=>{
	if(!(key instanceof Jua_Str))
		throw 'non-string key: '+key.type;
	obj.setProp(key.value, value);
}));
Jua_Obj.proto.setProp('del', new Jua_NativeFunc((obj, key)=>{
	if(!(key instanceof Jua_Str))
		throw 'non-string key: '+key.type;
	obj.delProp(key.value);
}));
Jua_Obj.proto.setProp('setProto', new Jua_NativeFunc((obj, proto)=>{
	if(!(obj instanceof Jua_Obj))
		throw 'Expect object';
	if(proto instanceof Jua_Obj)
		obj.proto = proto;
	else
		obj.proto = null;
}));
Jua_Obj.proto.setProp('getProto', new Jua_NativeFunc(obj => obj?.proto || Jua_Null.inst));
Jua_Obj.proto.setProp('iter', new Jua_NativeFunc((obj, key)=>{ //不建议使用，性能较低
	if(!(obj instanceof Jua_Obj))
		throw 'Expect object';
	if(key instanceof Jua_Str)
		key = key.value;
	else
		key = true;
	let res = new Jua_Obj;
	for(let k in obj.dict){
		if(key===true){
			key = new Jua_Str(k);
			res.setProp('key', key);
			res.setProp('value', key);
			return res;
		}else if(key==k){
			key = true;
		}
	}
	res.setProp('done', Jua_Bool.true);
	return res;
}));

buildClass(Jua_Num.proto, val=>{
	if(val instanceof Jua_Num)return val;
	if(val instanceof Jua_Str)return new Jua_Num(Number(val.str));
	if(val==Jua_Null.inst || val==Jua_Bool.false)return new Jua_Num(0);
	if(val==Jua_Bool.true)return new Jua_Num(1);
	return Jua_Num.NaN;
});
let endian_test = new Uint16Array(1);
endian_test[0] = 1;
let bytes = new Uint8Array(endian_test.buffer);
Jua_Num.proto.setProp('LITTLE_ENDIAN', bytes[0] ? Jua_Bool.true : Jua_Bool.false);
Jua_Num.proto.setProp('toString', new Jua_NativeFunc((num, radix)=>{
	if(!(num instanceof Jua_Num))
		throw 'Expect number';
	return new Jua_Str(num.value.toString(radix ? radix.toInt() : 10));
}));
Jua_Num.proto.setProp('range',  new Jua_NativeFunc((v1, v2)=>{
	if(!(v1 instanceof Jua_Num))
		throw 'Expect number';
	return v1.range(v2);
}));
Jua_Num.proto.setProp('isInt', new Jua_NativeFunc(num=>{
	if(!(num instanceof Jua_Num))
		return Jua_Bool.false;
	return Number.isInt(num.value) ? Jua_Bool.true : Jua_Bool.false;
}));
function registerCoding(label){ // 8/16/32位整数，32/64位浮点数
	let TArray = globalThis[label+'Array'];
	if(!TArray)throw 'Invalid label: '+label;
	let size = TArray.BYTES_PER_ELEMENT;
	Jua_Num.proto.setProp('encode'+label, new Jua_NativeFunc((...nums)=>{
		let len = nums.length;
		let arr = new TArray(len);
		for(let i=0; i<len; i++){
			if(nums[i].type!='number')
				throw 'Expect number';
			arr[i] = nums[i].value;
		}
		let bytes = new Uint8Array(arr.buffer);
		return new Jua_Str(String.fromCharCode(...bytes));
	}));
	Jua_Num.proto.setProp('decode'+label, new Jua_NativeFunc((str, offset)=>{
		if(!str || str.type!='string')
			throw 'Expect string';
		offset = offset ? offset.toInt() : 0;
		str = str.value;
		let bytes = new Uint8Array(size);
		for(let i=0; i<size; i++){
			bytes[i] = str.charCodeAt(offset+i);
		}
		let arr = new TArray(bytes.buffer);
		return new Jua_Num(arr[0]);
	}));
}
['Uint8', 'Uint16', 'Uint32', 'Int8', 'Int16', 'Int32', 'Float32', 'Float64'].forEach(registerCoding);

buildClass(Jua_Str.proto, val=>{
	if(!val)
		return new Jua_Str;
	if(val instanceof Jua_Str)
		return val;
	return new Jua_Str(val.toString());
	
});
Jua_Str.proto.setProp('byte', new Jua_NativeFunc((str, i)=>{
	if(!(str instanceof Jua_Str))
		throw 'Expect string';
	let c = str._getItem(i || Jua_Null.inst);
	if(c)return new Jua_Num(c.charCodeAt());
	return Jua_Null.inst;
}));
Jua_Str.proto.setProp('fromByte', new Jua_NativeFunc((...args)=>{
	let str = String.fromCharCode(...args.map(val=>val.toInt()));
	return new Jua_Str(str);
}));
Jua_Str.proto.setProp('hasItem', new Jua_NativeFunc((str, key)=>{
	if(!(str instanceof Jua_Str))
		throw 'Expect string';
	return str.hasItem(key || Jua_Null.inst);
}));
Jua_Str.proto.setProp('getItem', new Jua_NativeFunc((str, i)=>{
	if(!(str instanceof Jua_Str))
		throw 'Expect string';
	return str.getItem(i || Jua_Null.inst);
}));
Jua_Str.proto.setProp('len', new Jua_NativeFunc(str=>{
	if(!(str instanceof Jua_Str))
		throw 'Expect string';
	return new Jua_Num(str.value.length);
}));
Jua_Str.proto.setProp('lower', new Jua_NativeFunc(str=>{
	if(!(str instanceof Jua_Str))
		throw 'Expect string';
	return new Jua_Str(str.value.toLowerCase());
}));
Jua_Str.proto.setProp('upper', new Jua_NativeFunc(str=>{
	if(!(str instanceof Jua_Str))
		throw 'Expect string';
	return new Jua_Str(str.value.toUpperCase());
}));
Jua_Str.proto.setProp('slice', new Jua_NativeFunc((str, start, end)=>{
	if(!(str instanceof Jua_Str))
		throw 'Expect string';
	return str.slice(start, end);
}));
Jua_Str.proto.setProp('toHex', new Jua_NativeFunc((str, start, end)=>{
	if(!(str instanceof Jua_Str))
		throw 'Expect string';
	let hex = [];
	for(let c of str.value)
		hex.push(c.charCodeAt().toString(16).padStart(2, '0'));
	return new Jua_Str(hex.join(' '));
}));

buildClass(Jua_Array.proto, (...items)=>new Jua_Array(items));
Jua_Array.proto.setProp('join', new Jua_NativeFunc((jarr, sep=new Jua_Str(','))=>{
	if(!(jarr instanceof Jua_Array))
		throw 'expect array, got '+jarr.type;
	let str = '';
	jarr.items.forEach((item, i)=>{
		if(i>0)str += sep.value;
		str += item.toString();
	});
	return new Jua_Str(str);
}));
Jua_Array.proto.setProp('toString', new Jua_NativeFunc(jarr=>{
	let join = jarr.getProp('join');
	return join?.call([jarr]) || Jua_Null.inst;
}));
Jua_Array.proto.setProp('getItem', new Jua_NativeFunc((arr, i)=>{
	if(!(arr instanceof Jua_Array))
		throw 'Expect array';
	return arr.getItem(i || Jua_Null.inst);
}));

Jua_Num.rangeProto.proto = Jua_Obj.proto.proto
Jua_Num.rangeProto.setProp('iter', new Jua_NativeFunc((self, key)=>{
	if(key instanceof Jua_Num)
		key = key.add(new Jua_Num(1));
	else
		key = self.getProp('start');
	let res = new Jua_Obj;
	res.setProp('key', key);
	res.setProp('value', key);
	res.setProp('done', key.lt(self.getProp('end')).toBoolean() ? Jua_Bool.false : Jua_Bool.true);
	return res;
}));

buildClass(Jua_Buffer.proto, length=>{
	return new Jua_Buffer(length.toInt());
});
Jua_Buffer.proto.setProp('read', new Jua_NativeFunc((self, start, end)=>{
	if(self instanceof Jua_Buffer)
		return self.read(start, end);
	throw 'expect buffer';
}));
Jua_Buffer.proto.setProp('write', new Jua_NativeFunc((self, str, pos)=>{
	if(self instanceof Jua_Buffer)
		return self.write(str, pos);
	throw 'expect buffer';
}));
Jua_Buffer.proto.setProp('len', new Jua_NativeFunc(obj=>obj?.getProp('length')));

export {buildClass};