import {Jua_Val, Scope, Jua_Obj, Jua_Null, Jua_Bool, Jua_Num, Jua_Str, Jua_Func, Jua_NativeFunc, Jua_Array, Jua_Buffer} from 'jua/value';
import {buildClass} from 'jua/builtin';
import {DeclarationList, Jua_PFunc} from 'jua/program';
import parse from 'jua/parser';

class JuaProcess{ //目前，一次只能创建一个实例，否则内置值冲突
	modules = Object.create(null); //模块名到模块导出值的对应，可提前加载
	constructor(main_name){
		this.main = main_name; //模块名
		this.initBuiltins();
		this._G = this.makeGlobal();
	}
	run(){
		//只能运行一次
		//同步运行，可能导致阻塞
		if(globalThis.DEBUG){
			this.require(this.main);
		}else{
			try{
				this.require(this.main);
			}catch(e){
				this.stderr(e); //无法显示错误位置
			}
		}
	}
	eval(script, global=false){
		let body = parse(script);
		let env = global ? this._G : new Scope(this._G)
		return body.exec(env);
	}
	//private:
	initBuiltins(){
		buildClass(Jua_Func.proto, (...args)=>{
			let bodystr = args.pop();
			let argnames = args.map(val=>{
				if(!(val instanceof Jua_Str))
					throw 'Expect string';
				return val.value;
			});
			if(!(bodystr instanceof Jua_Str))
				throw 'Expect string';
			let decList = DeclarationList.fromNames(argnames);
			let body = parse(bodystr.value);
			return new Jua_PFunc(this._G, decList, body);
		});
	}
	makeGlobal(){ //虚函数
		const env = new Scope;
		//env.is_G = true;
		const classProto = Jua_Obj.proto.proto;
		const errorProto = new Jua_Obj(classProto);
		const init_error = (self, msg, detail)=>{
			if(!(self instanceof Jua_Obj))
				throw 'Expect object';
			if(msg)
				msg = msg.toJuaString();
			else
				msg = new Jua_Str;
			self.setProp('message', msg);
			self.setProp('detail', detail||Jua_Null.inst);
		};
		errorProto.setProp('init', new Jua_NativeFunc(init_error));
		errorProto.setProp('name', new Jua_Str('Error'));
		errorProto.setProp('toString', new Jua_NativeFunc(err=>{
			if(!(err instanceof Jua_Obj))
				throw 'Expect object';
			let name = err.getProp('name'), msg = err.getProp('message');
			name = name ? name.toString() : 'Unknown Error';
			msg = msg ? msg.toString() : '';
			return new Jua_Str(msg ?  name+': '+msg : name);
		}));
		const tryResProto = new Jua_Obj; //非类
		tryResProto.setProp('catch', new Jua_NativeFunc((self, cb)=>{
			if(!(self instanceof Jua_Obj))
				throw 'Expect object';
			if(self.getProp('status')==Jua_Bool.true)
				return null;
			if(cb instanceof Jua_Func)
				cb.call([self.getProp('error')||Jua_Null.inst]);
			else
				throw 'Expect function';
		}));
		const builtinObj = { //todo
			_G: env,
			Object: Jua_Obj.proto,
			Number: Jua_Num.proto,
			String: Jua_Str.proto,
			Function: Jua_Func.proto,
			Array: Jua_Array.proto,
			Buffer: Jua_Buffer.proto,
			Error: errorProto,
		};
		const builtinFunc = {
			print: (...args)=>this.stdout(args),
			require: name=>{
				if(name instanceof Jua_Str)
					return this.require(name.value);
				throw 'Expect string';
			},
			throw: (err, option)=>{
				if(err instanceof Jua_Str){
					let msg = err;
					err = new Jua_Obj(errorProto);
					init_error(err, msg);
				}else if(!(err && err.isInst(errorProto))){
					throw 'Expect Error or string';
				}
				//todo: option
				throw err;
			},
			try: (fn, ...args)=>{
				let res = new Jua_Obj(tryResProto);
				try{
					let value = fn.call(args);
					res.setProp('status', Jua_Bool.true);
					res.setProp('value', value);
				}catch(err){
					res.setProp('status', Jua_Bool.false);
					let juaerr;
					if(err instanceof Jua_Val){
						if(err.isInst(errorProto))
							juaerr = err;
						else
							throw 'Unexpected value: '+err; //理论上不会
					}else{
						juaerr = new Jua_Obj(errorProto);
						init_error(juaerr, new Jua_Str(String(err)));
					}
					res.setProp('error', juaerr);
				}
				return res;
			},
			type: val=>{
				if(!val)throw 'Missing argument';
				return new Jua_Str(val.type);
			},
			class: proto=>{
				if(!(proto instanceof Jua_Obj))
					throw 'prototype must be an object';
				proto.proto = classProto;
				return proto;
			},
		};
		for(let name in builtinObj)env.setProp(name, builtinObj[name]);
		for(let name in builtinFunc)env.setProp(name, new Jua_NativeFunc(builtinFunc[name]));
		return env;
	}
	findModule(name){ //纯虚函数；返回模块代码
		throw 'pure virtual function';
	}
	stdout(vals){} //虚函数
	stderr(err){} //虚函数
	require(name){
		if(name in this.modules)return this.modules[name];
		let script = this.findModule(name);
		this.modules[name] = this.eval(script);
		return this.modules[name];
	}
}

export default JuaProcess;