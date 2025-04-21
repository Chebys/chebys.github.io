//解析时无需检查左/右值，构造语法树时会自动检查
import {JuaSyntaxError} from 'jua/value';
import {uniOperator, binOperator} from 'jua/operator';
import {Declarable, UnitaryExpr, BinaryExpr, TernaryExpr, LiteralNum, LiteralStr, Keyword, Identifier, PropRef, MethWrapper, DeclarationItem, DeclarationList, Subscription, Call, TailedCall, ObjExpression, ArrayExpression, FunExpression, ExprStatement, Declaration, Return, Break, Continue, IfStatement, SwitchStatement, CaseBlock, WhileStatement, ForStatement, Block, FunctionBody} from 'jua/program';

const symbols = new Set('()[]{}.,:;=+-*/<>!&|?');

const unitaryOperatorSymbols = new Set;
for(let k in uniOperator)
	unitaryOperatorSymbols.add(k);
const binaryOperatorSymbols = new Set;
for(let k in binOperator)
	binaryOperatorSymbols.add(k);
const separators = new Set('()[]{}.,:;');
//const fullsymbols=['>=', '<=', '&&', '||', '=>'];
const symbolsReg = /==|>=|<=|!=|\+=|-=|\*=|\/=|&&=?|\|\|=?|\.\.|./g;
const validIdStartReg = /[_a-zA-Z]/;
const validIdReg = /[_a-zA-Z0-9]/;
const keywords = new Set(['as', 'false', 'for', 'fun', 'if', 'in', 'let', 'local', 'null', 'return', 'switch', 'true', 'void', 'while']);

function Reader(array){
	var pos = 0;
	return {
		array,
		preview(offset=0){
			return array[pos+offset];
		},
		next(){
			let res = {
				value: array[pos],
				done: pos >= array.length
			};
			pos++;
			return res;
		},
		read(){
			return this.next().value;
		},
		[Symbol.iterator](){
			return this;
		}
	}
}
function TokensReader(tokens, {fileName}){
	let reader = Reader(tokens);
	reader.fileName = fileName;
	reader.previewStr = function(){
		return this.preview()?.str;
	};
	reader.readStr = function(){
		return this.read()?.str;
	};
	return reader;
}

function tokenization(script){
	const tokens = [];
	const len = script.length;
	const buffer = {
		type: 0, //0无，1符号，2单词（标识符/关键字），3数字，4单引号字符串，5单行注释
		nline: 1,
		str: '',
		set(type, str){
			this.type = type;
			if(typeof str=='string')this.str = str;
		},
		push(c){
			this.str += c;
		},
		clear(){
			this.type = 0;
			this.str = '';
		},
		end(){
			if(!this.str)return;
			if(this.type==1){ //截断符号串
				for(let m of this.str.matchAll(symbolsReg))
					tokens.push(new Token(m[0], this.nline));
			}else if(this.type==5){
				//忽略注释
			}else{
				tokens.push(new Token(this.str, this.nline));
			}
			this.clear();
		}
	};
	for(let i=0; i<len; i++){
		let c = script[i];
		if(c=='\n')buffer.nline++;
		switch(buffer.type){
			case 0:
				if(c.match(/\s/)){
					//空白符
				}else if(c=='/' && script[i+1]=='/'){
					i++;
					buffer.set(5, '//');
				}else if(symbols.has(c)){
					buffer.set(1, c);
				}else if(c.match(validIdStartReg)){
					buffer.set(2, c);
				}else if(c.match(/[0-9]/)){
					buffer.set(3, c);
				}else if(c=="'"){
					buffer.set(4, c);
				}else if(c=='"'){
					todo
				}else if(c=='`'){
					todo
				}else{
					throw new JuaSyntaxError('Unrecognized: '+c);
				}
				break;
			case 1:
				if(c.match(/\s/)){
					buffer.end();
				}else if(c=='/' && script[i+1]=='/'){
					i++;
					buffer.set(5, '//');
				}else if(symbols.has(c)){
					buffer.push(c);
				}else if(c.match(validIdStartReg)){
					buffer.end();
					buffer.set(2, c);
				}else if(c.match(/[0-9]/)){
					buffer.end();
					buffer.set(3, c);
				}else if(c=="'"){
					buffer.end();
					buffer.set(4, c);
				}else{
					throw new JuaSyntaxError('Unrecognized: '+c);
				}
				break;
			case 2:
				if(c.match(/\s/)){
					buffer.end();
				}else if(c=='/' && script[i+1]=='/'){
					i++;
					buffer.set(5, '//');
				}else if(symbols.has(c)){
					buffer.end();
					buffer.set(1, c);
				}else if(c.match(validIdReg)){
					buffer.push(c);
				}else if(c=="'"){
					buffer.end();
					buffer.set(4, c);
				}else{
					throw new JuaSyntaxError('Unrecognized: '+c);
				}
				break;
			case 3:
				if(c.match(/\s/)){
					buffer.end();
				}else if(c.match(/[0-9]/)){
					buffer.push(c);
				}else if(c=='/' && script[i+1]=='/'){
					i++;
					buffer.set(5, '//');
				}else if(symbols.has(c)){
					if(c=='.' && script[i+1]!='.'){
						buffer.push(c);
					}else{
						buffer.end();
						buffer.set(1, c);
					}
				}else if(c.match(/[a-zA-Z]/)){
					//todo: 各种进制、科学计数法
					throw new JuaSyntaxError('数字后不能接字母！');
				}else if(c=="'"){
					throw new JuaSyntaxError('数字后不能接引号！');
				}else{
					throw new JuaSyntaxError('Unrecognized: '+c);
				}
				break;
			case 4:
				if(c=='\\'){
					buffer.push(c);
					c = script[++i];
					buffer.push(c);
				}else if(c=="'"){
					buffer.push(c);
					buffer.end();
				}else{
					buffer.push(c);
				}
				break;
			case 5:
				if(c=='\n'){
					buffer.end();
					buffer.set(0, '');
				}else{
					buffer.push(c);
				}
				break;
		}
		
	}
	buffer.end();
	return tokens;
}
//硬关键字优先视作运算符
//运算符优先视作二元运算符
class Token{
	constructor(str, nline){
		this.str = str;
		this.nline = nline; //所在行；跨行则为最末
		this.isKeyword = keywords.has(str);
		if(str[0]=="'") this.type='literal_str';
		else if(str[0].match(/[0-9]/)) this.type='literal_num';
		else if(separators.has(str)) this.type='separator';
		else if(binaryOperatorSymbols.has(str)) this.type='binop';
		else if(unitaryOperatorSymbols.has(str)) this.type='uniop';
		else if(str[0].match(validIdReg)) this.type='word';
		else throw new JuaSyntaxError(str);
	}
	get isValidVarname(){
		return this.type=='word' && !this.isKeyword;
	}
	toString(){
		return this.str;
	}
}

function parseBlock(reader){
	//输入不含'{'，会读完'}'
	let stmts = parseStatements(reader, true);
	return new Block(stmts);
}
function parseStatements(reader, block=false){
	//block为真时，当且仅当遇到'}'时结束
	let stmts = [];
	while(true){
		let next = reader.preview();
		if(!next){
			if(block)throw new JuaSyntaxError(`Missing '}'`);
			return stmts;
		}else if(next.str=='}'){
			if(!block)throw new JuaSyntaxError(`Unexpected '}'`);
			reader.next();
			return stmts;
		}
		let stmt = parseStatement(reader);
		if(stmt)stmts.push(stmt);
	}
}
function parseStatement(reader){
	//保证atomsReader推进（除非读完）
	//若为空语句，则返回0
	//若读完，则返回undefined
	//声明语句，表达式语句，for，while，break，continue，return
	function skipSemicolon(){ //每个简单语句后都要调用
		if(reader.previewStr() == ';')
			reader.next();
	}
	
	let start = reader.preview();
	if(!start)return;
	if(start.str==';'){
		reader.next();
		return 0;
	}
	if(start.isKeyword)
		switch(start.str){
			case 'return':{
				reader.next();
				let expr = parseExpr(reader); //todo: 省略返回值；但会导致和后面的语句连起来？
				skipSemicolon();
				return new Return(expr.toRvalue());
			}
			case 'break':{
				reader.next();
				return new Break;
			}
			case 'continue':{
				reader.next();
				return new Continue;
			}
			case 'let':{
				reader.next();
				let exprs = parseExprList(reader);
				skipSemicolon();
				return new Declaration(DeclarationList.parse(exprs));
			}
			case 'fun':{
				reader.next();
				let name = reader.read();
				if(!name?.isValidVarname)throw new JuaSyntaxError('Missing function name'); //不能仅仅是表达式
				let func = parseFunc(reader);
				let left = new Identifier(name.str);
				let assignment = new DeclarationItem(left, func);
				return new Declaration(new DeclarationList([assignment]));
			}
			case 'if':{
				reader.next();
				let cond = parseClosedExpr(reader);
				let block = parseBlockOrStatement(reader);
				let elseBlock;
				if(reader.previewStr() == 'else'){
					reader.next();
					elseBlock = parseBlockOrStatement(reader);
				}
				return new IfStatement(cond, block, elseBlock);
			}
			case 'switch':{
				reader.next();
				let expr = parseClosedExpr(reader);
				let caseBlocks = [];
				while(true){
					let nextStr = reader.previewStr();
					if(nextStr=='case'){
						reader.next();
						if(reader.readStr() != '(')throw new JuaSyntaxError("Missing '('");
						let exprs = parseClosedExprList(reader, ')');
						if(exprs.length==0)
							throw new JuaSyntaxError('Missing caseExpression');
						let block = parseBlockOrStatement(reader);
						caseBlocks.push(new CaseBlock(exprs.map(expr=>expr.toRvalue()), block));
					}else if(nextStr=='else'){
						if(caseBlocks.length==0)
							throw new JuaSyntaxError('switch without case');
						reader.next();
						let elseBlock = parseBlockOrStatement(reader);
						return SwitchStatement(expr, caseBlocks, elseBlock);
					}else{
						if(caseBlocks.length==0)
							throw new JuaSyntaxError('switch without case');
						return SwitchStatement(expr, caseBlocks);
					}
				}
			}
			case 'while':{
				reader.next();
				let cond = parseClosedExpr(reader);
				let block = parseBlockOrStatement(reader);
				return new WhileStatement(cond, block);
			}
			case 'for':{
				reader.next();
				if(reader.readStr() != '(')throw new JuaSyntaxError("Missing '('");
				let expr = parseExpr(reader);
				if(reader.readStr() != ')')throw new JuaSyntaxError("Missing ')'");
				if(!(expr instanceof BinaryExpr && expr.type == 'in'))
					throw new JuaSyntaxError(expr);
				let declarable = expr.left.toLvalue(), iterable = expr.right.toRvalue();
				if(!(declarable instanceof Declarable))
					throw new JuaSyntaxError(declarable);
				let block = parseBlockOrStatement(reader);
				return new ForStatement(declarable, iterable, block);
			}
		}
	//表达式语句
	let expr = parseExpr(reader);
	skipSemicolon();
	return new ExprStatement(expr.toRvalue());
}
function parseBlockOrStatement(reader){ //总是返回Block
	if(reader.previewStr() == '{'){
		reader.next();
		return parseBlock(reader);
	}
	//单条语句
	let stmt = parseStatement(reader);
	if(stmt)
		return new Block([stmt]);
	if(stmt===0)
		return new Block([]);
	throw new JuaSyntaxError('Unfinished input');
}
function parseExprList(reader){
	//逗号分隔的表达式列表，不能为空
	//todo: 允许以逗号结尾
	let exprs = [];
	while(true){
		exprs.push(parseExpr(reader));
		if(reader.previewStr() != ',')
			return exprs;
		reader.next();
	}
}
function parseClosedExprList(reader, endStr){
	//括住的逗号分隔表达式列表，可以为空
	//输入不含左括号
	if(reader.previewStr() == endStr){
		reader.next();
		return [];
	}
	let exprs = parseExprList(reader);
	if(reader.readStr() != endStr)
		throw new JuaSyntaxError(`Missing '${endStr}'`);
	return exprs;
}
function parseClosedExpr(reader){ //括号包围的右值，从'('开始读取
	if(reader.readStr() != '(')throw new JuaSyntaxError("Missing '('");
	let expr = parseExpr(reader);
	if(reader.readStr() != ')')throw new JuaSyntaxError("Missing ')'");
	return expr.toRvalue();
}
function parseExpr(reader){ //广义表达式，需检查合法性
	//由基本表达式和二元运算符构成
	//产生的表达式及其子表达式均已 setSource
	let primaries = [];
	let operators = [];
	let nline = reader.preview()?.nline;
	while(true){
		let pri = parsePrimary(reader);
		pri.setSource(reader.fileName, nline);
		primaries.push(pri);
		if(reader.preview()?.type=='binop')
			operators.push(reader.read().str);
		else
			return CombineExpressions(primaries, operators);
	}
}
function parsePrimary(reader, opts={}){ //基本表达式，可以是一元运算符+基本表达式
	let value = reader.read();
	if(!value)throw new JuaSyntaxError('Unfinished input');
	let str = value.str;
	switch(value.type){
		case 'word':
			if(!value.isKeyword)
				return parsePrimaryTail(new Identifier(str), reader);
			if(str == 'fun'){ //函数表达式
				let func = parseFunc(reader);
				return parsePrimaryTail(func, reader);
			}else if(str == 'true'){
				return parsePrimaryTail(Keyword.true, reader);
			}else if(str == 'false'){
				return parsePrimaryTail(Keyword.false, reader);
			}else if(str == 'null'){
				return parsePrimaryTail(Keyword.null, reader);
			}else if(str == 'if'){
				let cond = parseClosedExpr(reader);
				let expr = parseExpr(reader).toRvalue();
				if(reader.readStr()!='else')throw new JuaSyntaxError("Missing 'else'");
				let elseExpr = parseExpr(reader).toRvalue();
				return new TernaryExpr(cond, expr, elseExpr);
			}else if(str == 'local'){
				return parsePrimaryTail(Keyword.local, reader);
			}
			throw 'Unrecognized: '+str
		case 'literal_num':
			return parsePrimaryTail(LiteralNum.eval(str), reader);
		case 'literal_str':
			return parsePrimaryTail(LiteralStr.eval(str), reader);
		case 'separator':
			if(str == '('){
				let expr = parseExpr(reader);
				if(reader.readStr() != ')') throw new JuaSyntaxError("Missing ')'");
				return parsePrimaryTail(expr, reader);
			}else if(str == '['){
				let expr = parseArray(reader);
				return parsePrimaryTail(expr, reader);
			}else if(str == '{'){
				let expr = parseObj(reader);
				return parsePrimaryTail(expr, reader);
			}
		case 'uniop':
			return new UnitaryExpr(str, parsePrimary(reader));
		default:
			throw new JuaSyntaxError('Unrecognized: '+str);
	}
	
}
function parsePrimaryTail(head, reader){
	//head 为 Expression
	let value = reader.preview();
	if(!value)return head;
	switch(value.type){
		case 'separator':
			if(value.str=='.'){ //属性引用
				reader.next();
				let id = reader.read();
				if(id.type!='word')throw new JuaSyntaxError('expect property name: '+id);
				let expr = new PropRef(head, id.str);
				return parsePrimaryTail(expr, reader);
			}else if(value.str==':'){ //方法包装
				reader.next();
				let name = reader.read();
				if(name.type!='word')throw new JuaSyntaxError('expect property name: '+name);
				let expr = new MethWrapper(head, name.str);
				return parsePrimaryTail(expr, reader);
			}else if(value.str=='['){
				reader.next();
				let key = parseExpr(reader);
				if(reader.readStr() != ']')throw new JuaSyntaxError("Missing ']'");
				let expr = new Subscription(head, key);
				return parsePrimaryTail(expr, reader);
			}else if(value.str=='('){
				reader.next();
				let args = parseClosedExprList(reader, ')');
				let expr;
				if(reader.previewStr()!='{'){
					expr = new Call(head, args);
				}else{
					reader.next();
					let stmts = parseStatements(reader, true);
					expr = new TailedCall(head, args, stmts);
				}
				return parsePrimaryTail(expr, reader);
			}else if(value.str=='{'){
				reader.next();
				let stmts = parseStatements(reader, true);
				let expr = new TailedCall(head, [], stmts);
				return parsePrimaryTail(expr, reader);
			}
			return head;
		case 'literal_str':
			return new Call(head, [parseExpr(reader)]);
		case 'uniop':
			if(value.str=='?'){
				reader.next();
				return new UnitaryExpr('?', head);
				head = head.toLvalue();
				if(!(head instanceof Declarable))
					throw new JuaSyntaxError('invalid item');
				head.addDefault();
				return new DeclarationItem(head, Keyword.null);
			}
		default:
			return head;
	}
}
function parseArray(reader){ //广义数组
	//输入不含'['，会读完']'
	//返回ArrayExpression
	let exprs = parseClosedExprList(reader, ']');
	return new ArrayExpression(exprs);
}
function parseObj(reader){ //广义对象
	//输入不含'{'，会读完'}'
	//返回ObjExpression
	let exprs = parseClosedExprList(reader, '}');
	return new ObjExpression(exprs);
}
function parseFunc(reader){
	//从'('开始读取
	let bracket = reader.readStr();
	if(bracket != '(') throw new JuaSyntaxError(bracket);
	let exprs = parseClosedExprList(reader, ')');
	let decList = DeclarationList.parse(exprs);
	let nextStr = reader.readStr();
	let stmts;
	if(nextStr == '{'){
		stmts = parseStatements(reader, true);
	}else if(nextStr == '='){
		let expr = parseExpr(reader);
		stmts = [new Return(expr.toRvalue())];
	}else{
		throw new JuaSyntaxError(nextStr);
	}
	return new FunExpression(decList, stmts);
}

function CombineExpressions(exprs, operators){
	//多个用二元运算符连接的表达式
	//每个表达式均已 setSource
	//operators为字符串数组
	if(exprs.length==1) return exprs[0];
	let priorPos = getPrior(operators);
	let priorOper = operators.splice(priorPos, 1)[0];
	let priorExpr = new BinaryExpr(priorOper, ...exprs.splice(priorPos, 2));
	priorExpr.copySrc(priorExpr.left);
	exprs.splice(priorPos, 0, priorExpr);
	return CombineExpressions(exprs, operators);
}
function getPrior(operators){
	//运算优先级，返回下标
	//todo
	let idx=0, priority=0;
	operators.forEach((str, i)=>{
		let {priority:newp, right} = binOperator[str];
		if(newp>priority || newp==priority && right){
			idx = i;
			priority = newp;
		}
	});
	return idx;
}

export default function parse(script, {fileName}={}){
	let tokens = tokenization(script);
	let statements = parseStatements(TokensReader(tokens, {fileName}));
	if(globalThis.JUA_DEBUG)console.log('statements', statements)
	return new FunctionBody(statements);
}