class Jua_Val{
	constructor(type, proto){
		this.type = type; //'number', 'string', 'boolean', 'function', 'object'
		this.proto = proto || null; //若为真，则必为 Jua_Obj
	}
	getOwn(key){ //返回jua值或null
		return null;
	}
	inheritProp(key){ //返回jua值或null
		if(!this.proto)return null;
		if(this.proto.isPropTrue('isClass'))
			return this.getOwn('super')?.getProp(key);
		return this.proto.getProp(key);
	}
	getProp(key){ //返回jua值或null
		return this.getOwn(key) || this.inheritProp(key);
	}
	//基类调用元方法，内置元方法调用子类方法
	isInst(klass){
		if(!this.proto)return false;
		return this.proto == klass || this.proto.isSubclass(klass);
	}
	isSubclass(klass){ //不能相同
		if(!this.proto)return false;
		if(!this.proto.isPropTrue('isClass'))return false;
		let base = this.getOwn('super');
		if(!base)return false;
		return base == klass || base.isSubclass(klass);
	}
	getMetaMethod(key){ //返回Jua_Func或null
		if(!this.proto)return null;
		let meth = this.proto.getProp(key);
		return meth instanceof Jua_Func ? meth : null;
	}
	hasItem(key){
		todo
	}
	getItem(key){ //key为jua值；总是返回jua值
		let getFn = this.getMetaMethod('getItem');
		if(getFn)
			return getFn.call([this, key]);
		throw 'Unable to getItem: '+this;
	}
	setItem(key, val){
		let setFn = this.getMetaMethod('setItem');
		if(setFn)
			return setFn.call([this, key, val]);
		throw 'Unable to setItem: '+this;
	}
	call(args){
		let callFn = this.getMetaMethod('call');
		if(callFn)
			return callFn.call([this, ...args])
		throw 'Unable to call '+this;
	}
	add(val){
		let addFn = this.getMetaMethod('__add')||val.getMetaMethod('__add');
		if(addFn)
			return addFn.call([this, val]);
		throw 'Unable to add '+this;
	}
	sub(val){
		let subFn = this.getMetaMethod('__sub')||val.getMetaMethod('__sub');
		if(subFn)
			return subFn.call([this, val]);
		throw 'Unable to sub '+this;
	}
	mul(val){
		let mulFn = this.getMetaMethod('__mul')||val.getMetaMethod('__mul');
		if(mulFn)
			return mulFn.call([this, val]);
		throw 'Unable to mul '+this;
	}
	div(val){
		let divFn = this.getMetaMethod('__div')||val.getMetaMethod('__div');
		if(divFn)
			return divFn.call([this, val]);
		throw 'Unable to div '+this;
	}
	eq(val){
		let eqFn = this.getMetaMethod('__eq');
		if(eqFn)
			return eqFn.call([this, val]);
		return this == val ? Jua_Bool.true : Jua_Bool.false;
	}
	lt(val){
		let ltFn = this.getMetaMethod('__lt');
		if(ltFn)
			return ltFn.call([this, val]);
		throw 'Unable to lt '+this;
	}
	le(val){
		let leFn = this.getMetaMethod('__le');
		if(leFn)
			return leFn.call([this, val]);
		throw 'Unable to le '+this;
	}
	range(val){
		let rangeFn = this.getMetaMethod('range');
		if(rangeFn)
			return rangeFn.call([this, val]);
		throw 'Unable to range';
	}
	[Symbol.iterator](){ //JuaIterator
		return new CustomIterator(this);
	}
	toJuaString(strict=true){
		let toString = this.getMetaMethod('toString');
		if(toString){
			let res = toString.call([this]);
			if(res instanceof Jua_Str)
				return res;
		}
		if(strict)
			throw 'Unable to be converted to string: '+this.type;
		return null;
	}
	//以下返回js值
	equalTo(val){
		return this.eq(val).toBoolean();
	}
	toString(){
		return this.toJuaString(false)?.value ?? '#'+this.type;
	}
	toBoolean(){
		return true;
	}
	toInt(){
		return 0;
	}
}
class Jua_Null extends Jua_Val{
	constructor(){ //私有构造函数
		super('null');
	}
	toString(){
		return 'null';
	}
	toBoolean(){
		return false;
	}
	static inst = new this;
}
class Jua_Obj extends Jua_Val{
	static proto = new this;
	dict = Object.create(null);
	constructor(proto, source={}){ //source的属性为jua值
		super('object', proto);
		for(let k in source)this.setProp(k, source[k]);
	}
	//key为js字符串
	hasOwn(key){ //返回js值
		return key in this.dict;
	}
	hasProp(key){
		return this.hasOwn(key) || this.proto?.hasProp(key);
	}
	getOwn(key){
		return this.dict[key] || null;
	}
	setProp(key, val){ //val必须为jua值
		this.dict[key] = val;
	}
	getItem(key){
		let getFn = this.getMetaMethod('getItem');
		if(getFn)
			return getFn.call([this, key]);
		if(key.type=='string')
			return this.getProp(key.value);
		throw 'key must be a string';
	}
	setItem(key, val){
		let setFn = this.getMetaMethod('setItem');
		if(setFn)
			return setFn.call([this, key, val]);
		if(key.type=='string')
			this.setProp(key.value, val);
		else
			throw 'key must be a string';
	}
	[Symbol.iterator](){
		let iterFn = this.getMetaMethod('iter'); // || Jua_Obj.proto.getOwn('iter') 不建议使用，性能较低
		if(iterFn)
			return new CustomIterator(this, iterFn);
		let list = [];
		for(let k in this.dict){
			list.push(new Jua_Str(k));
		}
		return new ListIterator(list);
	}
	isPropTrue(key){ //仅自身属性
		return this.getOwn(key) == Jua_Bool.true;
	}
}
class Jua_Bool extends Jua_Val{
	static proto = new Jua_Obj;
	constructor(value=false){ //私有构造函数
		super('boolean', Jua_Bool.proto);
		this.value=value;
	}
	toString(){
		return String(this.value);
	}
	toBoolean(){
		return this.value;
	}
	static true = new this(true);
	static false = new this(false);
}
class Jua_Num extends Jua_Val{
	static proto = new Jua_Obj;
	static rangeProto = new Jua_Obj;
	static NaN = new Jua_Num(NaN);
	constructor(value=0){
		super('number', Jua_Num.proto);
		this.value=value;
	}
	eq(val){
		return val instanceof Jua_Num && this.value == val.value ? Jua_Bool.true : Jua_Bool.false;
	}
	add(val){
		if(val instanceof Jua_Str)
			return val.add(this);
		if(!(val instanceof Jua_Num))
			throw val+' is not a number';
		return new Jua_Num(this.value + val.value);
	}
	sub(val){
		if(!(val instanceof Jua_Num))
			throw val+' is not a number';
		return new Jua_Num(this.value - val.value);
	}
	mul(val){
		if(!(val instanceof Jua_Num))
			throw val+' is not a number';
		return new Jua_Num(this.value * val.value);
	}
	div(val){
		if(!(val instanceof Jua_Num))
			throw val+' is not a number';
		return new Jua_Num(this.value / val.value);
	}
	lt(val){
		if(!(val instanceof Jua_Num))
			throw val+' is not a number';
		return this.value < val.value ? Jua_Bool.true : Jua_Bool.false;
	}
	le(val){
		if(!(val instanceof Jua_Num))
			throw val+' is not a number';
		return this.value <= val.value ? Jua_Bool.true : Jua_Bool.false;
	}
	range(val){
		if(!(val instanceof Jua_Num))
			throw val+' is not a number';
		let iter = new Jua_Obj(Jua_Num.rangeProto);
		iter.setProp('start', this);
		iter.setProp('end', val);
		return iter;
	}
	toString(){
		return String(this.value);
	}
	toBoolean(){
		return Boolean(this.value);
	}
	toInt(){
		return Math.round(this.value);
	}
}
class Jua_Str extends Jua_Val{
	//严格按照规范的话，应当使用 Uint8Array
	//进行二进制操作时，每个utf16码元看作一个字节
	static proto = new Jua_Obj;
	constructor(value=''){
		super('string', Jua_Str.proto);
		this.value=value;
	}
	correctIndex(i){ //i为jua值
		i = i.toInt() % this.value.length;
		if(i < 0)
			i += this.value.length;
		return i;
	}
	hasItem(substr){
		if(substr.type!='string')
			return Jua_Bool.false;
		return Jua_Bool[this.value.includes(substr.value)];
	}
	_getItem(index){ //index为jua值；返回js字符或假值
		return this.value.at(index.toInt());
	}
	getItem(index){
		let c = this._getItem(index);
		if(c)return new Jua_Str(c);
		return Jua_Null.inst;
	}
	add(val){
		return new Jua_Str(this.toString()+val.toString());
	}
	eq(val){
		return val instanceof Jua_Str && this.value == val.value ? Jua_Bool.true : Jua_Bool.false;
	}
	slice(start, end){
		start = start ? this.correctIndex(start) : 0;
		end = end && this.correctIndex(end) || this.value.length;
		return new Jua_Str(this.value.slice(start, end));
	}
	toJuaString(){
		return this;
	}
	toString(){
		return this.value;
	}
	toBoolean(){
		return this.value=='' ? false : true;
	}
}
class Jua_Func extends Jua_Val{
	static proto = new Jua_Obj;
	constructor(){
		super('function', Jua_Func.proto);
	}
	call(args=[]){ //总是返回jua值
		throw 'pure virtual function';
	}
}
class Jua_NativeFunc extends Jua_Func{ //应处于全局环境
	constructor(native){
		//native: (...Jua_Val) -> Jua_Val?
		super();
		this.native = native;
	}
	call(args=[]){
		return this.native(...args) || Jua_Null.inst;
	}
}

class Scope extends Jua_Obj{
	constructor(parent){
		super();
		this.parent = parent || null; //若为真，则必为 Scope
	}
	inheritProp(key){
		return this.parent?.getProp(key);
	}
	assign(name, val){ //val必须为jua值
		for(let env=this; env; env=env.parent)
			if(env.hasOwn(name)){
				env.setProp(name, val);
				return;
			}
		throw 'Undeclared variable: '+name;
	}
}
class Jua_Array extends Jua_Obj{
	static proto = new Jua_Obj;
	constructor(items=[]){
		super(Jua_Array.proto);
		this.items = items;
	}
	[Symbol.iterator](){
		return new ListIterator(this.items);
	}
	correctIndex(i){ //i为jua值
		i = i.toInt() % this.items.length;
		if(i < 0)
			i += this.items.length;
		return i;
	}
	getItem(key){
		let i = this.correctIndex(key);
		return this.items[i];
	}
	setItem(key, val){ //不允许空槽，不改变长度
		let i = this.correctIndex(key);
		this.items[i] = val;
	}
}
class Jua_Buffer extends Jua_Obj{ //不推荐在js实现中使用，性能很低
	static proto = new Jua_Obj;
	constructor(length){
		super(Jua_Buffer.proto);
		this.bytes = new Uint8Array(length);
		this.setProp('length', new Jua_Num(length));
	}
	getItem(key){
		let i = key.toInt();
		return new Jua_Num(this.bytes.at(i));
	}
	setItem(key, val){
		if(!(val instanceof Jua_Num))
			throw 'value must be a number';
		let i = this.correctIndex(key);
		this.bytes[i] = val.value;
	}
	read(start, end){
		start = this.correctIndex(start);
		end = this.correctIndex(end);
		let bytes = this.bytes.slice(start, end || this.bytes.length);
		let str = String.fromCharCode(...bytes);
		return new Jua_Str(str);
	}
	write(str, pos){
		if(!(str instanceof Jua_Str))
			throw 'expect string';
		pos = this.correctIndex(pos);
		let len = str.value.length;
		if(len+pos > this.bytes.length)
			throw 'out of range';
		let bytes = new Uint8Array(len);
		for(let i=0; i<len; i++){
			bytes[i] = str.value.charCodeAt(i);
		}
		this.bytes.set(bytes, pos);
	}
	correctIndex(i){ //i为jua值或空
		if(!i)return 0;
		i = i.toInt() % this.bytes.length;
		if(i < 0)
			i += this.bytes.length;
		return i;
	}
}

class JuaIterator{ //非Jua_Val
	//抽象类
	next(){
		//返回 { value: Jua_Val|null, done: Boolean }
		//done为假时，value非空
		throw 'pure virtual function';
	}
}
class CustomIterator extends JuaIterator{
	constructor(val, iterFn){
		super();
		this.target = val;
		this.iter = iterFn||val.getMetaMethod('iter');
		if(!this.iter)
			throw 'Uniterable: '+val;
		this.key = Jua_Null.inst;
	}
	next(){
		let res = this.iter.call([this.target, this.key]);
		let done = res.getOwn('done')||Jua_Null.inst;
		if(done.toBoolean())
			return {
				value: res.getOwn('value'),
				done: true
			}
		this.key = res.getOwn('key')||Jua_Null.inst;
		return {
			value: res.getOwn('value')||Jua_Null.inst,
			done: false
		}
	}
}
class ListIterator extends JuaIterator{
	constructor(list){
		super();
		this.iterator = list[Symbol.iterator]();
	}
	next(){
		let {value, done} = this.iterator.next();
		return {value:value||null, done};
	}
}

export {Scope, Jua_Val, Jua_Null, Jua_Num, Jua_Str, Jua_Bool, Jua_Obj, Jua_Func, Jua_NativeFunc, Jua_Array, Jua_Buffer};