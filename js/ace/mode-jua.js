// from javascript.js

define('ace/mode/jua_highlight_rules', function(require, exports, module){
"use strict";

var {TextHighlightRules} = require("./text_highlight_rules");

// TODO: Unicode escape sequences
var wordRe = /[A-Za-z_]\w*/; //"[a-zA-Z\\$_\u00a1-\uffff][a-zA-Z\\d\\$_\u00a1-\uffff]*";
// see: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects
var keywords = {
	"variable.language":
		"Array|Boolean|Function|Number|Object|String|Buffer|"  + // Constructors
		"Error|EvalError|InternalError|RangeError|ReferenceError|StopIteration|"   + // Errors
		"SyntaxError|TypeError|URIError"                                          ,
	"keyword":
		"as|async|await|" +
		"break|case|continue|else|for|" +
		"if|in|is|return|switch|let|while|" +
		// invalid or reserved
		"__parent__|__count__|with|__proto__|" +
		"class|super",
	"storage.type":
		"let|fun",
	"constant.language":
		"null|Infinity|NaN|local",
	"support.function":
		"alert|type|throw|try",
	"constant.language.boolean": "true|false"
};
var escapedRe = "\\\\(?:x[0-9a-fA-F]{2}|" + // hex
	"u[0-9a-fA-F]{4}|" + // unicode
	"u{[0-9a-fA-F]{1,6}}|" + // es6 unicode
	"[0-2][0-7]{0,2}|" + // oct
	"3[0-7][0-7]?|" + // oct
	"[4-7][0-7]?|" + //oct
	".)";
// regexp must not have capturing parentheses. Use (?:) instead.
// regexps are ordered -> the first match is used

var anonymousFunctionRe = "(function)(\\s*)(\\*?)";

function voidText(next='pop'){
	// 空白符、注释
	return [
		{
			token : "text",
			regex : "\\s+",
		}, {
            token : "comment", // multi line comment
            regex : /\/\*/,
            next: [
                {token : "comment.end", regex : /\*\//, next},
                {defaultToken : "comment", caseInsensitive: true}
            ]
        }, {
            token : "comment",
            regex : /\/\//,
            next: [
                {token : "comment", regex : "$", next},
                {defaultToken : "comment", caseInsensitive: true}
            ]
        }
    ];
}

class JuaHighlightRules extends TextHighlightRules {
	constructor(){
		super();
		var keywordMapper = this.createKeywordMapper(keywords, "identifier");

		this.$rules = {
			"start" : [
				voidText("start"),
				{
					regex: "[{}]",
					onMatch(val, state, stack) {
						//console.log(stack) 很迷
						this.next = val == "{" ? this.nextState : "";
						if(stack.length){
							if (val == "{") {
								stack.unshift("start", state);
							} else if (val == "}") {
								stack.shift();
								this.next = stack.shift();
								if (this.next.indexOf("string") != -1)
									return "paren.quasi.end";
							}
						}
						return val == "{" ? "paren.lparen" : "paren.rparen";
					},
					nextState: "start"
				}, {
					token : "string.quasi.start",
					regex : '"',
					push  : 'dqstring'
				}, {
					token : "string",
					regex : "'(?=.)",
					next  : "qstring"
				}, {
					token : "string",
					regex : '`',
					next  : "bqstring"
				}, {
					token : "constant.numeric", // hexadecimal, octal and binary
					regex : /0(?:[xX][0-9a-fA-F]+|[oO][0-7]+|[bB][01]+)\b/
				}, {
					token : "constant.numeric", // decimal integers and floats
					regex : /(?:\d\d*(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+\b)?/
				}, {
					token : keywordMapper,
					regex : wordRe
				}, {
					token : "punctuation.operator",
					regex : /\??[:.]/,
					next  : "name"
				}, {
					token : "keyword.operator",
					regex : /\.\.|===|==|=|!=|!==|<+=?|>+=?|!|&&|\|\||\?:|[!$%&*+\-~\/^]=?/
				}, {
					token : "punctuation.operator",
					regex : /[?:,;.]/
				}, {
					token : "paren.lparen",
					regex : /[\[(]/
				}, {
					token : "paren.rparen",
					regex : /[\])]/
				}
			],
			"name": [ //属性名 / 方法名
				voidText('name'),
				{
					token : "identifier",
					regex : wordRe,
					next: 'start'
				},
				{
					token: 'empty',
					regex: '',
					next: 'start'
				}
			],
			"block_or_stmt": [
				voidText('block_or_stmt'),
				//todo
			],
			"bqstring" : [
				{
					token : "string",
					regex : '`',
					next  : "start"
				}, {
					defaultToken: "string"
				}
			],
			'dqstring': [
				{
					token : "constant.language.escape",
					regex : escapedRe
				}, {
					token : "identifier.quasi",
					regex : /\$\w+/,
				}, {
					token : "paren.quasi.start",
					regex : /\${/,
					push  : "start"
				}, {
					token : "string.quasi.end",
					regex : '"',
					next  : "pop"
				}, {
					defaultToken: "string.quasi"
				}
			],
			"qstring" : [
				{
					token : "constant.language.escape",
					regex : escapedRe
				}, {
					token : "string",
					regex : "'|$",
					next  : "start"
				}, {
					defaultToken: "string"
				}
			]
		};

		this.normalizeRules();
	}
};

exports.JuaHighlightRules = JuaHighlightRules;

})

define("ace/mode/matching_brace_outdent",["require","exports","module","ace/range"],function(e,t,n){
	"use strict";var r=e("../range").Range,i=function(){};(function(){this.checkOutdent=function(e,t){return/^\s+$/.test(e)?/^\s*\}/.test(t):!1},this.autoOutdent=function(e,t){var n=e.getLine(t),i=n.match(/^(\s*\})/);if(!i)return 0;var s=i[1].length,o=e.findMatchingBracket({row:t,column:s});if(!o||o.row==t)return 0;var u=this.$getIndent(e.getLine(o.row));e.replace(new r(t,0,t,s-1),u)},this.$getIndent=function(e){return e.match(/^\s*/)[0]}}).call(i.prototype),t.MatchingBraceOutdent=i
})

define("ace/mode/folding/xml",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"],function(e,t,n){
	"use strict";function a(e,t){return e.type.lastIndexOf(t+".xml")>-1}var r=e("../../lib/oop"),i=e("../../range").Range,s=e("./fold_mode").FoldMode,o=t.FoldMode=function(e,t){s.call(this),this.voidElements=e||{},this.optionalEndTags=r.mixin({},this.voidElements),t&&r.mixin(this.optionalEndTags,t)};r.inherits(o,s);var u=function(){this.tagName="",this.closing=!1,this.selfClosing=!1,this.start={row:0,column:0},this.end={row:0,column:0}};(function(){this.getFoldWidget=function(e,t,n){var r=this._getFirstTagInLine(e,n);return r?r.closing||!r.tagName&&r.selfClosing?t==="markbeginend"?"end":"":!r.tagName||r.selfClosing||this.voidElements.hasOwnProperty(r.tagName.toLowerCase())?"":this._findEndTagInLine(e,n,r.tagName,r.end.column)?"":"start":this.getCommentFoldWidget(e,n)},this.getCommentFoldWidget=function(e,t){return/comment/.test(e.getState(t))&&/<!-/.test(e.getLine(t))?"start":""},this._getFirstTagInLine=function(e,t){var n=e.getTokens(t),r=new u;for(var i=0;i<n.length;i++){var s=n[i];if(a(s,"tag-open")){r.end.column=r.start.column+s.value.length,r.closing=a(s,"end-tag-open"),s=n[++i];if(!s)return null;r.tagName=s.value;if(s.value===""){s=n[++i];if(!s)return null;r.tagName=s.value}r.end.column+=s.value.length;for(i++;i<n.length;i++){s=n[i],r.end.column+=s.value.length;if(a(s,"tag-close")){r.selfClosing=s.value=="/>";break}}return r}if(a(s,"tag-close"))return r.selfClosing=s.value=="/>",r;r.start.column+=s.value.length}return null},this._findEndTagInLine=function(e,t,n,r){var i=e.getTokens(t),s=0;for(var o=0;o<i.length;o++){var u=i[o];s+=u.value.length;if(s<r-1)continue;if(a(u,"end-tag-open")){u=i[o+1],a(u,"tag-name")&&u.value===""&&(u=i[o+2]);if(u&&u.value==n)return!0}}return!1},this.getFoldWidgetRange=function(e,t,n){var r=this._getFirstTagInLine(e,n);if(!r)return this.getCommentFoldWidget(e,n)&&e.getCommentFoldRange(n,e.getLine(n).length);var s=e.getMatchingTags({row:n,column:0});if(s)return new i(s.openTag.end.row,s.openTag.end.column,s.closeTag.start.row,s.closeTag.start.column)}}).call(o.prototype)
})

define("ace/mode/folding/cstyle",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"],function(e,t,n){
	"use strict";var r=e("../../lib/oop"),i=e("../../range").Range,s=e("./fold_mode").FoldMode,o=t.FoldMode=function(e){e&&(this.foldingStartMarker=new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/,"|"+e.start)),this.foldingStopMarker=new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/,"|"+e.end)))};r.inherits(o,s),function(){this.foldingStartMarker=/([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/,this.foldingStopMarker=/^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/,this.singleLineBlockCommentRe=/^\s*(\/\*).*\*\/\s*$/,this.tripleStarBlockCommentRe=/^\s*(\/\*\*\*).*\*\/\s*$/,this.startRegionRe=/^\s*(\/\*|\/\/)#?region\b/,this._getFoldWidgetBase=this.getFoldWidget,this.getFoldWidget=function(e,t,n){var r=e.getLine(n);if(this.singleLineBlockCommentRe.test(r)&&!this.startRegionRe.test(r)&&!this.tripleStarBlockCommentRe.test(r))return"";var i=this._getFoldWidgetBase(e,t,n);return!i&&this.startRegionRe.test(r)?"start":i},this.getFoldWidgetRange=function(e,t,n,r){var i=e.getLine(n);if(this.startRegionRe.test(i))return this.getCommentRegionBlock(e,i,n);var s=i.match(this.foldingStartMarker);if(s){var o=s.index;if(s[1])return this.openingBracketBlock(e,s[1],n,o);var u=e.getCommentFoldRange(n,o+s[0].length,1);return u&&!u.isMultiLine()&&(r?u=this.getSectionRange(e,n):t!="all"&&(u=null)),u}if(t==="markbegin")return;var s=i.match(this.foldingStopMarker);if(s){var o=s.index+s[0].length;return s[1]?this.closingBracketBlock(e,s[1],n,o):e.getCommentFoldRange(n,o,-1)}},this.getSectionRange=function(e,t){var n=e.getLine(t),r=n.search(/\S/),s=t,o=n.length;t+=1;var u=t,a=e.getLength();while(++t<a){n=e.getLine(t);var f=n.search(/\S/);if(f===-1)continue;if(r>f)break;var l=this.getFoldWidgetRange(e,"all",t);if(l){if(l.start.row<=s)break;if(l.isMultiLine())t=l.end.row;else if(r==f)break}u=t}return new i(s,o,u,e.getLine(u).length)},this.getCommentRegionBlock=function(e,t,n){var r=t.search(/\s*$/),s=e.getLength(),o=n,u=/^\s*(?:\/\*|\/\/|--)#?(end)?region\b/,a=1;while(++n<s){t=e.getLine(n);var f=u.exec(t);if(!f)continue;f[1]?a--:a++;if(!a)break}var l=n;if(l>o)return new i(o,r,l,t.length)}}.call(o.prototype)
})

define("ace/mode/folding/javascript",["require","exports","module","ace/lib/oop","ace/mode/folding/xml","ace/mode/folding/cstyle"],function(require, exports, module){
	"use strict";

var oop = require("../../lib/oop");
var XmlFoldMode = require("./xml").FoldMode;
var CFoldMode = require("./cstyle").FoldMode;

var FoldMode = exports.FoldMode = function (commentRegex) {
    if (commentRegex) {
        this.foldingStartMarker = new RegExp(
            this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start));
        this.foldingStopMarker = new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end));
    }

    this.xmlFoldMode = new XmlFoldMode();
};
oop.inherits(FoldMode, CFoldMode);

(function () {

    this.getFoldWidgetRangeBase = this.getFoldWidgetRange;
    this.getFoldWidgetBase = this.getFoldWidget;

    this.getFoldWidget = function (session, foldStyle, row) {
        var fw = this.getFoldWidgetBase(session, foldStyle, row);
        if (!fw) {
            return this.xmlFoldMode.getFoldWidget(session, foldStyle, row);
        }
        return fw;
    };

    this.getFoldWidgetRange = function (session, foldStyle, row, forceMultiline) {
        var range = this.getFoldWidgetRangeBase(session, foldStyle, row, forceMultiline);
        if (range) return range;

        return this.xmlFoldMode.getFoldWidgetRange(session, foldStyle, row);
    };

}).call(FoldMode.prototype);
})

define('ace/mode/jua', function(require, exports, module){
"use strict";

var TextMode = require("./text").Mode;
var {JuaHighlightRules} = require("./jua_highlight_rules");
var {MatchingBraceOutdent} = require("./matching_brace_outdent");
var JavaScriptFoldMode = require("./folding/javascript").FoldMode;

class Mode extends TextMode{
    HighlightRules = JuaHighlightRules;

    $outdent = new MatchingBraceOutdent();
    foldingRules = new JavaScriptFoldMode();
	
	getNextLineIndent(state, line, tab) {
		//在行中换行时，line 为换行前的部分
        var indent = this.$getIndent(line);

        var tokenizedLine = this.getTokenizer().getLineTokens(line, state);
        var tokens = tokenizedLine.tokens; //console.log(tokens)
        var endState = tokenizedLine.state;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        if (state == "start") {
            var match = line.match(/^.*[\{\(\[]\s*$/);
            if (match) {
                indent += tab;
            }
        } else if (state == "doc-start") {
            if (endState == "start") {
                return "";
            }
        }

        return indent;
    }

    checkOutdent(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    }

    autoOutdent(state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
    }
};

(function() {
    this.lineCommentStart = "//";
    this.blockComment = {start: "/*", end: "*/"};
    this.$quotes = {'"': '"', "'": "'", "`": "`"};
    this.$pairQuotesAfter = {
        "`": /\w/
    };

    this.$id = "ace/mode/javascript";
    this.snippetFileId = "ace/snippets/javascript";
}).call(Mode.prototype);

exports.Mode = Mode;
})