//根据DeepSeek的说法，这是"内聚式AST"或"自执行AST"
//AST是静态的，所有节点均不应保存运行时的状态
import {Scope, Jua_Val, Jua_Null, Jua_Num, Jua_Str, Jua_Bool, Jua_Obj, Jua_Func, Jua_NativeFunc, Jua_Array} from 'jua/value';
import {uniOperator, binOperator} from 'jua/operator';

function Get2Operator(type){
	let oper = binOperator[type];
	if(!oper)throw 'no operator: '+type;
	return oper;
}

//构造表达式时不检查合法性（因为暂时不知道用来干什么）。构造语句时需要检查。
//例外：TernaryExpr, DeclarationItem, DeclarationList, LeftObj, RightObj, FunExpression 有明确用途
//LiteralNum, LiteralStr, Keyword, Identifier 总是合法的，无需检查
class Expression{ //抽象类
	toLvalue(){ //可assign
		throw 'non-lvalue: '+this.constructor.name;
	}
	toRvalue(){ //可calc
		throw 'non-rvalue: '+this.constructor.name;
	}
	calc(env){ //必须返回jua值
		throw 'uncalculatable: '+this.constructor.name;
	}
	assign(env, val){ //val非空
		throw 'unassignable: '+this.constructor.name;
	}
}
class Declarable extends Expression{
	//抽象类，直接用于 DeclarationItem，间接用于变量声明、函数参数、左值数组、for循环；一定是左值
	declare(env, val){ //val非空
		throw 'pure virtual function';
	}
}
class LiteralNum extends Expression{
	static eval(str){
		return new this(eval(str));
	}
	constructor(val){
		super();
		this.val = val;
	}
	toRvalue(){
		return this;
	}
	calc(env){
		return new Jua_Num(this.val);
	}
}
class LiteralStr extends Expression{
	static eval(str){
		return new this(eval(str));
	}
	constructor(val){
		super();
		this.val = val;
	}
	toRvalue(){
		return this;
	}
	calc(env){
		return new Jua_Str(this.val);
	}
}
class Keyword extends Expression{
	constructor(str){
		super();
		this.str = str;
	}
	toRvalue(){
		return this;
	}
	calc(){
		switch(this.str){
			case 'true': return Jua_Bool.true;
			case 'false': return Jua_Bool.false;
			case 'null': return Jua_Null.inst;
			default: throw this.str;
		}
	}
	static true = new this('true');
	static false = new this('false');
	static null = new this('null');
}
class Identifier extends Declarable{
	constructor(identifier){
		super();
		this.str = identifier;
	}
	toRvalue(){
		return this;
	}
	toLvalue(){
		return this;
	}
	calc(env){
		let val = env.getProp(this.str);
		if(val)return val;
		throw `Variable '${this.str}' is not declared`;
	}
	assign(env, val){
		env.assign(this.str, val);
	}
	declare(env, val){
		env.setProp(this.str, val)
	}
}
class PropRef extends Expression{
	constructor(expr, prop){
		//prop为js字符串
		super();
		this.expr = expr;
		this.prop = prop;
	}
	toLvalue(){
		return this.toRvalue();
	}
	toRvalue(){
		this.expr = this.expr.toRvalue();
		return this;
	}
	calc(env){
		return this.expr.calc(env).getProp(this.prop) || Jua_Null.inst;
	}
	assign(env, val){
		this.expr.calc(env).setProp(this.prop, val);
	}
}
class MethWrapper extends Expression{
	constructor(expr, method){
		//method为js字符串
		super();
		this.expr = expr;
		this.method = method;
	}
	toRvalue(){
		this.expr = this.expr.toRvalue();
		return this;
	}
	calc(env){
		let obj = this.expr.calc(env);
		return new Jua_NativeFunc((...args)=>{
			let meth = obj.getProp(this.method);
			if(!meth)throw 'missing method: '+this.method;
			return meth.call([obj, ...args]);
		});
	}
}
class UnitaryExpr extends Expression{
	constructor(type, expr){
		super();
		this.type = type;
		this.expr = expr;
	}
	toRvalue(){
		this.expr = this.expr.toRvalue();
		return this;
	}
	calc(env){
		let operator = uniOperator[this.type];
		if(!operator)throw 'no operator: '+this.type;
		return operator(this.expr.calc(env));
	}
}
class BinaryExpr extends Expression{
	constructor(type, left, right){
		super();
		this.type = type;
		this.left = left;
		this.right = right;
	}
	toRvalue(){
		if(this.type=='as')
			throw 'Invalid operator: as';
		let lvalue = Get2Operator(this.type).lvalue;
		this.left = lvalue ? this.left.toLvalue() : this.left.toRvalue();
		this.right = this.right.toRvalue();
		return this;
	}
	calc(env){
		switch(this.type){
			case '=':{
				let val = this.right.calc(env);
				this.left.assign(env, val);
				return val;
			}
			case '+=': case '-=': case '*=': case '/=': case '&&=': case '||=':
				return this.selfAssign(env, this.type.slice(0,-1));
			default:{ //一般运算符
				let operator = Get2Operator(this.type);
				if(operator.circuited)
					return operator.fn(env, this.left, this.right);
				return operator.fn(this.left.calc(env), this.right.calc(env));
			}
		}
	}
	selfAssign(env, type){
		let operator = Get2Operator(type);
		let val;
		if(operator.circuited)
			val = operator.fn(env, this.left, this.right);
		else
			val = operator.fn(this.left.calc(env), this.right.calc(env));
		this.left.assign(env, val);
		return val;
	}
}
class Subscription extends BinaryExpr{
	constructor(expr, key){
		super('subscript', expr, key);
	}
	toLvalue(){
		this.left = this.left.toRvalue();
		this.right = this.right.toRvalue();
		return this;
	}
	toRvalue(){
		return this.toLvalue();
	}
	calc(env){
		let obj = this.left.calc(env);
		let key = this.right.calc(env);
		return obj.getItem(key);
	}
	assign(env, val){
		let obj = this.left.calc(env);
		let key = this.right.calc(env);
		obj.setItem(key, val||Jua_Null.inst);
	}
}
class DeclarationItem extends BinaryExpr{
	static parse(expr){
		if(expr instanceof Declarable){
			return new DeclarationItem(expr);
		}else if(expr instanceof BinaryExpr && expr.type == '='){
			let declarable = expr.left.toLvalue();
			if(!(declarable instanceof Declarable))
				throw declarable;
			return new DeclarationItem(declarable, expr.right.toRvalue());
		}else{
			throw expr;
		}
	}
	constructor(declarable, defval=Keyword.null){
		super('declaration', declarable, defval);
	}
	declare(env, arg){ //用于变量声明时，arg必空；其他情况arg可空
		this.left.declare(env, arg||this.right.calc(env));
	}
	assign(env, val){ //仅用于左值数组，val可空
		this.left.assign(env, val||this.right.calc(env));
	}
}
class TernaryExpr extends Expression{ //if(cond) v1 else v2
	constructor(cond, expr, elseExpr){
		super();
		this.cond = cond;
		this.expr = expr;
		this.elseExpr = elseExpr;
	}
	toRvalue(){
		return this;
	}
	calc(env){
		if(this.cond.calc(env).toBoolean())
			return this.expr.calc(env);
		else
			return this.elseExpr.calc(env);
	}
}
class DeclarationList extends Declarable{
	//3种作用：变量声明、函数参数、左值数组
	static parse(exprs){
		return new DeclarationList(exprs.map(DeclarationItem.parse));
	}
	static fromNames(names){
		return new DeclarationList(names.map(name=>{
			let id = new Identifier(name);
			return new DeclarationItem(id);
		}));
	}
	constructor(decItems){
		super();
		this.decItems = decItems;
		//this.restArgs = todo;
	}
	toLvalue(){ //仅用于左值数组
		return this;
	}
	assign(env, list){ //仅用于左值数组，list非空
		this.forEach(env, list[Symbol.iterator](), (item, val)=>item.assign(env, val));
	}
	declare(env, list){ //仅用于左值数组，list非空
		this.forEach(env, list[Symbol.iterator](), (item, val)=>item.declare(env, val));
	}
	rawDeclare(env, args=[]){ //用于变量声明、函数参数
		this.forEach(env, args[Symbol.iterator](), (item, val)=>item.declare(env, val));
	}
	forEach(env, iterator, fn){ //iterator instanceof JuaIterator
		//对每个DeclarationItem和取得的值调用 fn(item, val)
		for(let item of this.decItems){
			let {value, done} = iterator.next();
			fn(item, done ? null : value);
		}
	}
}
class Call extends Expression{
	constructor(callee, args){
		super();
		this.callee = callee;
		this.args = args;
	}
	toRvalue(){
		this.callee = this.callee.toRvalue();
		this.args = this.args.map(arg=>arg.toRvalue());
		return this;
	}
	calc(env){
		let fn = this.callee.calc(env);
		let args = this.args.map(expr=>expr.calc(env));
		return fn.call(args);
	}
}
class TailedCall extends Call{
	constructor(callee, args, stmts){
		super(callee, args);
		this.stmts = stmts; //尾随函数
	}
	getFunExpr(){
		return new FunExpression(DeclarationList.parse(this.args), this.stmts);
	}
	toRvalue(){
		this.callee = this.callee.toRvalue();
		this.args = [this.getFunExpr()];
		return this;
	}
}
class ObjExpression extends Expression{ //根据需要转换为 LeftObj/RightObj
	constructor(exprs){
		super();
		this.exprs = exprs;
	}
	static parseKey(keyExpr){ //返回右值
		if(keyExpr instanceof Identifier)
			return new LiteralStr(keyExpr.str);
		if(keyExpr instanceof ArrayExpression && keyExpr.exprs.length==1)
			return keyExpr.exprs[0].toRvalue();
		throw keyExpr;
	}
	toLvalue(){
		let entries = [];
		for(let expr of this.exprs){
			let key, name, defval;
			if(expr instanceof BinaryExpr && expr.type == '='){
				defval = expr.right.toRvalue();
				expr = expr.left;
			}else{
				defval = Keyword.null;
			}
			if(expr instanceof Identifier){
				key = new LiteralStr(expr.str);
				name = expr.str;
			}else if(expr instanceof BinaryExpr && expr.type == 'as'){
				if(!(expr.right instanceof Identifier))
					throw expr.right;
				key = ObjExpression.parseKey(expr.left);
				name = expr.right.str;
			}else{
				throw expr;
			}
			entries.push([key, name, defval]);
		}
		return new LeftObj(entries);
	}
	toRvalue(){
		let entries = [];
		for(let expr of this.exprs){
			let key, val;
			if(expr instanceof Identifier){
				key = new LiteralStr(expr.str);
				val = expr;
			}else if(expr instanceof BinaryExpr && expr.type == '='){
				key = ObjExpression.parseKey(expr.left);
				val = expr.right.toRvalue();
			}else if(expr instanceof TailedCall){
				key = ObjExpression.parseKey(expr.callee);
				val = expr.getFunExpr();
			}else{
				throw expr;
			}
			entries.push([key, val]);
		}
		//delete this;
		return new RightObj(entries);
	}
}
class LeftObj extends Declarable{ //注意：左值对象不能嵌套
	constructor(entries){
		super();
		this.entries = entries; //每一项均为[key:右值, name:string, defval:右值]
		//todo: 使用[右值, DeclarationItem]
	}
	toLvalue(){
		return this;
	}
	forEach(env, obj, fn){ //对每个变量名和取得的值调用 fn(name, val)
		if(!(obj instanceof Jua_Obj))
			throw obj;
		for(let [keyExpr, name, defval] of this.entries){
			let key = keyExpr.calc(env);
			if(!(key instanceof Jua_Str))
				throw 'non-string: '+key;
			let val = obj.getProp(key.value);
			fn(name, val||defval.calc(env));
		}
	}
	assign(env, obj){
		this.forEach(env, obj, (name, val)=>env.assign(name, val));
	}
	declare(env, obj){
		this.forEach(env, obj, (name, val)=>env.setProp(name, val));
	}
}
class RightObj extends Expression{
	constructor(entries){
		super();
		this.entries = entries; //每一项均为[key:右值, val:右值]
	}
	toRvalue(){
		return this;
	}
	calc(env){
		let obj = new Jua_Obj;
		for(let kv of this.entries){
			let [key, val] = kv.map(e=>e.calc(env));
			if(!(key instanceof Jua_Str))
				throw 'non-string: '+key;
			obj.setProp(key.value, val);
		}
		return obj;
	}
}
class ArrayExpression extends Expression{
	constructor(exprs){
		super();
		this.exprs = exprs;
	}
	toLvalue(){
		return new DeclarationList.parse(this.exprs);
	}
	toRvalue(){ //不需要新的类
		this.exprs = this.exprs.map(expr=>expr.toRvalue());
		return this;
	}
	calc(env){
		let vals = this.exprs.map(e=>e.calc(env));
		return new Jua_Array(vals);
	}
}
class FunExpression extends Expression{
	constructor(decList, stmts){
		super();
		this.decList = decList; //DeclarationList
		this.stmts = stmts;
	}
	toRvalue(){
		return this;
	}
	calc(env){
		let body = new FunctionBody(this.stmts);
		return new Jua_PFunc(env, this.decList, body);
	}
}

//构造含表达式语句时，应当使用表达式.toRvalue()/toLvalue()。构造函数本身不进行检查，而是由构造函数的调用者(parser)负责。
class Statement{
	constructor(type){
		this.type = type; //或许不需要
	}
	exec(env, controller){
		throw 'pure virtual function';
	}
}
class ExprStatement extends Statement{
	constructor(expr){
		super('expr');
		this.expr = expr;
	}
	exec(env){
		this.expr.calc(env);
	}
}
class Declaration extends Statement{
	constructor(list){
		super('let');
		this.list = list; //DeclarationList
	}
	exec(env){
		this.list.rawDeclare(env);
	}
}
class Return extends Statement{
	constructor(expr){
		super('return');
		this.expr = expr; //可空
	}
	exec(env, controller){
		if(this.expr)
			controller.return(this.expr.calc(env));
		else
			controller.return(Jua_Null.inst);
	}
}
class Break extends Statement{
	constructor(){
		super('break');
	}
	exec(_, controller){
		controller.break();
	}
}
class Continue extends Statement{
	constructor(){
		super('continue');
	}
	exec(_, controller){
		controller.continue();
	}
}
class IfStatement extends Statement{
	constructor(cond, block, elseBlock){ //elseBlock可为假
		super('if');
		this.cond = cond;
		this.block = block;
		this.elseBlock = elseBlock; //可空；else if... 等价于 else{ if... }
	}
	exec(env, controller){
		if(this.cond.calc(env).toBoolean())
			this.block.exec(new Scope(env), controller);
		else
			this.elseBlock?.exec(new Scope(env), controller);
	}
}
class SwitchStatement extends Statement{
	constructor(expr, caseBlocks, elseBlock){
		this.expr = expr;
		this.caseBlocks = caseBlocks;
		this.elseBlock = elseBlock; //可空
	}
	exec(env, controller){
		let val = this.expr.calc(env);
		for(let caseblock of this.caseBlocks)
			if(caseblock.match(val)){
				caseblock.block.exec(new Scope(env), controller);
				return;
			}
		this.elseBlock?.exec(new Scope(env), controller);
	}
}
class CaseBlock{
	constructor(exprs, block){
		this.exprs = exprs;
		this.block = block;
	}
	match(env, val){
		for(let expr of this.exprs){
			let cval = expr.calc(env);
			if(val.equalTo(val))
				return true;
		}
	}
}
class WhileStatement extends Statement{
	constructor(cond, block){
		super('while');
		this.cond = cond;
		this.block = block;
	}
	exec(env, controller){
		while(this.cond.calc(env).toBoolean()){
			this.block.exec(new Scope(env), controller);
			controller.resolve('continue');
			if('break' in controller.pending){
				controller.resolve('break');
				break;
			}
		}
	}
}
class ForStatement extends Statement{
	constructor(declarable, iterable, block){
		super('for');
		this.declarable = declarable;
		this.iterable = iterable;
		this.block = block;
	}
	exec(env, controller){
		let iterable = this.iterable.calc(env);
		for(let val of iterable){
			let local = new Scope(env);
			this.declarable.declare(local, val);
			this.block.exec(local, controller);
			controller.resolve('continue');
			if('break' in controller.pending){
				controller.resolve('break');
				break;
			}
		}
	}
}

class Block{
	constructor(statements){
		this.statements = statements;
	}
	exec(env, controller){ //env是新产生的作用域
		for(let stmt of this.statements)
			if(controller.isPending) break;
			else stmt.exec(env, controller);
		//todo: 垃圾回收
	}
}
class FunctionBody extends Block{
	exec(env){ //总是返回jua值
		let controller = new Controller;
		super.exec(env, controller);
		let res = controller.pending.return;
		controller.resolve('return');
		if(controller.isPending)
			throw controller.pending;
		return res || Jua_Null.inst;
	}
}
class Jua_PFunc extends Jua_Func{
	constructor(upenv, decList, body){
		super();
		this.upenv = upenv;
		this.decList = decList;
		this.body = body;
	}
	call(args=[]){
		let env = new Scope(this.upenv);
		this.decList.rawDeclare(env, args);
		return this.body.exec(env);
	}
}
class Controller{
	pending = Object.create(null);
	get isPending(){
		for(let _ in this.pending)
			return true;
		return false;
	}
	continue(){
		this.pending.continue = true;
	}
	break(){
		this.pending.break = true;
	}
	return(value){
		this.pending.return = value;
	}
	resolve(key){
		delete this.pending[key];
	}
}

export {
	Declarable, UnitaryExpr, BinaryExpr, TernaryExpr, LiteralNum, LiteralStr, Keyword, Identifier, PropRef, MethWrapper, DeclarationItem, DeclarationList, Subscription, Call, TailedCall, ObjExpression, ArrayExpression, FunExpression,
	ExprStatement, Declaration, Return, Break, Continue, IfStatement, SwitchStatement, CaseBlock, WhileStatement, ForStatement,
	Block, FunctionBody, Jua_PFunc
};