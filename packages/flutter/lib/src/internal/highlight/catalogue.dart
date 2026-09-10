/// The languages the widgets can colour, and the grammar behind each one.
///
/// The React package fetches highlight.js and one grammar per language, so an
/// application that never sets `language` downloads none of them. A Flutter
/// build has no network to defer to, so the grammars are here — small,
/// approximate, and dropped by the compiler for an application that never names
/// [diffineHighlighterFor]. See `engine.dart` for what "approximate" is buying.
///
/// The identifiers are highlight.js's, so a `language` that works in a browser
/// works here, and the names are English and are not translated: `TypeScript`
/// is `TypeScript` in every locale.
library;

import 'package:diffine/src/internal/highlight/engine.dart';
import 'package:diffine/src/types.dart';

/// What `language` is when nothing is being coloured.
const String kPlain = 'plain';

/* -------------------------------------------------------------------------
 * The pieces every grammar is built out of
 * ---------------------------------------------------------------------- */

final Rule _hashComment = Rule(RegExp('#[^\n]*'), DiffineTokenKind.comment);
final Rule _slashComment = Rule(RegExp('//[^\n]*'), DiffineTokenKind.comment);
final Rule _dashComment = Rule(RegExp('--[^\n]*'), DiffineTokenKind.comment);
final Rule _blockComment = Rule(RegExp(r'/\*[\s\S]*?(?:\*/|$)'), DiffineTokenKind.comment);
final Rule _doubleQuoted = Rule(RegExp(r'"(?:\\[\s\S]|[^"\\\n])*"?'), DiffineTokenKind.string);
final Rule _singleQuoted = Rule(RegExp(r"'(?:\\[\s\S]|[^'\\\n])*'?"), DiffineTokenKind.string);
final Rule _backticked = Rule(RegExp(r'`(?:\\[\s\S]|[^`\\])*`?'), DiffineTokenKind.string);
final Rule _tripleQuoted = Rule(
  RegExp(
    r'"""[\s\S]*?(?:"""|$)'
    r"|'''[\s\S]*?(?:'''|$)",
  ),
  DiffineTokenKind.string,
);
final Rule _number = Rule(
  RegExp(r'\b(?:0[xXbBoO][0-9a-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[a-zA-Z]*\b'),
  DiffineTokenKind.number,
);
final Rule _operator = Rule(RegExp(r'[+\-*/%=<>!&|^~?:]+'), DiffineTokenKind.meta);
final Rule _punctuation = Rule(RegExp(r'[{}\[\]();,.@$]'), DiffineTokenKind.meta);

final RegExp _word = RegExp(r'[A-Za-z_$][\w$]*');
final RegExp _callAhead = RegExp(r'^[ \t]*[(<]');
final RegExp _capitalised = RegExp('^[A-Z]');

Set<String> _words(String list) => list.split(' ').toSet();

/// A word rule: the keywords, the types, and the shape of everything else.
///
/// A word followed by a bracket is what is being called or declared, and a word
/// that starts with a capital is a type more often than it is not. Both are
/// guesses, and both are right often enough to be worth making.
Rule _identifier({required Set<String> keywords, Set<String> types = const <String>{}}) {
  return Rule.named(_word, (String text, String code, int end) {
    if (keywords.contains(text)) {
      return DiffineTokenKind.keyword;
    }

    if (types.contains(text)) {
      return DiffineTokenKind.type;
    }

    if (_callAhead.hasMatch(code.substring(end, (end + 8).clamp(end, code.length)))) {
      return DiffineTokenKind.title;
    }

    if (_capitalised.hasMatch(text)) {
      return DiffineTokenKind.type;
    }

    return null;
  });
}

/// A grammar for a language written the way C is: braces, slashes, quotes.
List<Rule> _clike({
  required String keywords,
  String types = '',
  bool hashComments = false,
  bool backticks = false,
  bool triples = false,
}) {
  return <Rule>[
    if (hashComments) _hashComment,
    _slashComment,
    _blockComment,
    if (triples) _tripleQuoted,
    _doubleQuoted,
    _singleQuoted,
    if (backticks) _backticked,
    _number,
    _identifier(keywords: _words(keywords), types: _words(types)),
    _operator,
    _punctuation,
  ];
}

/* -------------------------------------------------------------------------
 * The languages
 * ---------------------------------------------------------------------- */

const String _jsKeywords =
    'as async await break case catch class const continue debugger default delete do else export '
    'extends finally for from function get if import in instanceof let new of return set static '
    'super switch this throw try typeof var void while with yield true false null undefined';

const String _tsKeywords =
    '$_jsKeywords abstract declare enum implements infer interface is keyof namespace never '
    'override private protected public readonly require satisfies type unique unknown';

const String _tsTypes =
    'any bigint boolean number object string symbol void Array Promise Record Partial Readonly '
    'Map Set Date RegExp Error';

final List<Rule> _javascript = _clike(keywords: _jsKeywords, types: _tsTypes, backticks: true);
final List<Rule> _typescript = _clike(keywords: _tsKeywords, types: _tsTypes, backticks: true);

const String _dartKeywords =
    'abstract as assert async await base break case catch class const continue covariant default '
    'deferred do dynamic else enum export extends extension external factory false final finally '
    'for get hide if implements import in interface is late library mixin new null on operator '
    'part required rethrow return sealed set show static super switch sync this throw true try '
    'typedef var void when while with yield';

const String _dartTypes =
    'bool double int num String List Map Set Iterable Future Stream Object Function Symbol Type '
    'Duration DateTime Uri RegExp Widget BuildContext';

final List<Rule> _dart = _clike(keywords: _dartKeywords, types: _dartTypes);

const String _javaKeywords =
    'abstract assert break case catch class const continue default do else enum extends final '
    'finally for goto if implements import instanceof interface native new package private '
    'protected public return static strictfp super switch synchronized this throw throws '
    'transient try var volatile while true false null record sealed permits yield';

final List<Rule> _java = _clike(
  keywords: _javaKeywords,
  types: 'boolean byte char double float int long short void String Object List Map Set',
);

const String _kotlinKeywords =
    'as break by catch class companion const constructor continue crossinline data do dynamic '
    'else enum external false final finally for fun get if import in infix init inline inner '
    'interface internal is lateinit noinline null object open operator out override package '
    'private protected public reified return sealed set super suspend tailrec this throw true '
    'try typealias val var vararg when where while';

final List<Rule> _kotlin = _clike(
  keywords: _kotlinKeywords,
  types: 'Any Boolean Byte Char Double Float Int Long Short String Unit Nothing List Map Set',
  triples: true,
);

const String _swiftKeywords =
    'associatedtype async await break case catch class continue default defer deinit do else '
    'enum extension fallthrough false fileprivate final for func guard if import in indirect '
    'init inout internal is lazy let mutating nil open operator private protocol public repeat '
    'rethrows return self static struct subscript super switch throw throws true try typealias '
    'var weak where while';

final List<Rule> _swift = _clike(
  keywords: _swiftKeywords,
  types: 'Any Bool Character Double Float Int String Void Array Dictionary Set Optional',
);

const String _goKeywords =
    'break case chan const continue default defer else fallthrough for func go goto if import '
    'interface map package range return select struct switch type var nil true false iota';

final List<Rule> _go = _clike(
  keywords: _goKeywords,
  types:
      'bool byte complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune '
      'string uint uint8 uint16 uint32 uint64 uintptr any',
  backticks: true,
);

const String _rustKeywords =
    'as async await break const continue crate dyn else enum extern false fn for if impl in let '
    'loop match mod move mut pub ref return self Self static struct super trait true type unsafe '
    'use where while';

final List<Rule> _rust = _clike(
  keywords: _rustKeywords,
  types:
      'bool char f32 f64 i8 i16 i32 i64 i128 isize str u8 u16 u32 u64 u128 usize String Vec '
      'Option Result Box Rc Arc HashMap',
);

const String _cKeywords =
    'auto break case char const continue default do double else enum extern float for goto if '
    'inline int long register restrict return short signed sizeof static struct switch typedef '
    'union unsigned void volatile while';

final List<Rule> _c = _clike(
  keywords: '$_cKeywords bool true false NULL',
  types: 'int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t size_t FILE',
  hashComments: true,
);

const String _cppKeywords =
    '$_cKeywords alignas alignof and catch class co_await co_return co_yield concept constexpr '
    'const_cast decltype delete dynamic_cast explicit export false friend mutable namespace new '
    'noexcept not nullptr operator or private protected public reinterpret_cast requires '
    'static_assert static_cast template this thread_local throw true try typeid typename using '
    'virtual';

final List<Rule> _cpp = _clike(
  keywords: _cppKeywords,
  types: 'string vector map set pair shared_ptr unique_ptr size_t',
  hashComments: true,
);

const String _csharpKeywords =
    'abstract as async await base bool break byte case catch char checked class const continue '
    'decimal default delegate do double else enum event explicit extern false finally fixed '
    'float for foreach goto if implicit in int interface internal is lock long namespace new '
    'null object operator out override params private protected public readonly record ref '
    'return sbyte sealed short sizeof stackalloc static string struct switch this throw true '
    'try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while yield';

final List<Rule> _csharp = _clike(keywords: _csharpKeywords, types: 'Task List Dictionary');

const String _scalaKeywords =
    'abstract case catch class def do else extends false final finally for forSome given if '
    'implicit import lazy match new null object override package private protected return '
    'sealed super this throw trait true try type using val var while with yield';

final List<Rule> _scala = _clike(
  keywords: _scalaKeywords,
  types:
      'Any AnyRef Boolean Byte Char Double Float Int Long Short String Unit Option List Map Seq Set',
  triples: true,
);

const String _objcKeywords =
    '$_cKeywords @interface @implementation @protocol @property @end @synthesize @dynamic '
    '@selector @class id nil YES NO self super instancetype nonatomic atomic strong weak copy '
    'assign readonly readwrite';

final List<Rule> _objectivec = <Rule>[
  _hashComment,
  _slashComment,
  _blockComment,
  Rule(RegExp(r'@"(?:\\[\s\S]|[^"\\\n])*"?'), DiffineTokenKind.string),
  _doubleQuoted,
  _singleQuoted,
  _number,
  Rule(RegExp(r'@[A-Za-z_]\w*'), DiffineTokenKind.keyword),
  _identifier(
    keywords: _words(_objcKeywords),
    types: _words('NSString NSArray NSDictionary NSNumber NSObject BOOL'),
  ),
  _operator,
  _punctuation,
];

const String _phpKeywords =
    'abstract and array as break callable case catch class clone const continue declare default '
    'do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum '
    'extends final finally fn for foreach function global goto if implements include '
    'include_once instanceof insteadof interface isset list match namespace new or print '
    'private protected public readonly require require_once return static switch throw trait '
    'try unset use var while xor yield true false null';

final List<Rule> _php = <Rule>[
  _hashComment,
  _slashComment,
  _blockComment,
  _doubleQuoted,
  _singleQuoted,
  _number,
  Rule(RegExp(r'\$[A-Za-z_]\w*'), DiffineTokenKind.variable),
  _identifier(keywords: _words(_phpKeywords)),
  _operator,
  _punctuation,
];

const String _perlKeywords =
    'and cmp continue do else elsif eq eval exit for foreach ge gt if last le local lt my ne '
    'next no not or our package print printf push redo ref require return shift splice sub '
    'unless unshift until use wantarray while xor';

final List<Rule> _perl = <Rule>[
  _hashComment,
  _doubleQuoted,
  _singleQuoted,
  _number,
  Rule(RegExp(r'[$@%][A-Za-z_]\w*'), DiffineTokenKind.variable),
  _identifier(keywords: _words(_perlKeywords)),
  _operator,
  _punctuation,
];

const String _rubyKeywords =
    'alias and begin break case class def defined do else elsif end ensure false for if in '
    'module next nil not or redo rescue retry return self super then true undef unless until '
    'when while yield require require_relative attr_accessor attr_reader attr_writer';

final List<Rule> _ruby = <Rule>[
  _hashComment,
  _doubleQuoted,
  _singleQuoted,
  _number,
  Rule(RegExp(r':[A-Za-z_]\w*[?!]?'), DiffineTokenKind.string),
  Rule(RegExp(r'@@?[A-Za-z_]\w*'), DiffineTokenKind.variable),
  _identifier(keywords: _words(_rubyKeywords)),
  _operator,
  _punctuation,
];

const String _pythonKeywords =
    'and as assert async await break class continue def del elif else except finally for from '
    'global if import in is lambda match nonlocal not or pass raise return try while with yield '
    'True False None self cls';

final List<Rule> _python = <Rule>[
  _hashComment,
  Rule(
    RegExp(
      r'[rbfu]{0,2}(?:"""[\s\S]*?(?:"""|$)'
      r"|'''[\s\S]*?(?:'''|$))",
    ),
    DiffineTokenKind.string,
  ),
  Rule(
    RegExp(
      '[rbfu]{0,2}'
      r'"(?:\\[\s\S]|[^"\\\n])*"?',
    ),
    DiffineTokenKind.string,
  ),
  Rule(
    RegExp(
      '[rbfu]{0,2}'
      r"'(?:\\[\s\S]|[^'\\\n])*'?",
    ),
    DiffineTokenKind.string,
  ),
  Rule(RegExp(r'@[A-Za-z_][\w.]*'), DiffineTokenKind.meta),
  _number,
  _identifier(
    keywords: _words(_pythonKeywords),
    types: _words('bool bytes dict float int list set str tuple object type'),
  ),
  _operator,
  _punctuation,
];

const String _luaKeywords =
    'and break do else elseif end false for function goto if in local nil not or repeat return '
    'then true until while';

final List<Rule> _lua = <Rule>[
  _dashComment,
  _doubleQuoted,
  _singleQuoted,
  _number,
  _identifier(keywords: _words(_luaKeywords)),
  _operator,
  _punctuation,
];

const String _rKeywords =
    'if else repeat while function for in next break TRUE FALSE NULL Inf NaN NA';

final List<Rule> _r = <Rule>[
  _hashComment,
  _doubleQuoted,
  _singleQuoted,
  _number,
  _identifier(keywords: _words(_rKeywords)),
  _operator,
  _punctuation,
];

const String _shellWords =
    'if then else elif fi for while until do done case esac function return in select time '
    'break continue local export readonly declare unset set shift source alias echo printf cd '
    'exit test true false sudo';

final List<Rule> _shell = <Rule>[
  _hashComment,
  _doubleQuoted,
  _singleQuoted,
  _backticked,
  Rule(RegExp(r'\$\{[^}]*\}|\$[A-Za-z_]\w*|\$[0-9@*#?!$]'), DiffineTokenKind.variable),
  Rule(RegExp(r'(?:^|(?<=\s))--?[A-Za-z][\w-]*'), DiffineTokenKind.meta),
  _number,
  _identifier(keywords: _words(_shellWords)),
  _operator,
  _punctuation,
];

const String _dockerWords =
    'FROM RUN CMD LABEL MAINTAINER EXPOSE ENV ADD COPY ENTRYPOINT VOLUME USER WORKDIR ARG '
    'ONBUILD STOPSIGNAL HEALTHCHECK SHELL AS';

final List<Rule> _dockerfile = <Rule>[
  _hashComment,
  _doubleQuoted,
  _singleQuoted,
  Rule(RegExp(r'\$\{[^}]*\}|\$[A-Za-z_]\w*'), DiffineTokenKind.variable),
  _number,
  _identifier(keywords: _words(_dockerWords)),
  _operator,
  _punctuation,
];

final List<Rule> _powershell = <Rule>[
  _hashComment,
  _doubleQuoted,
  _singleQuoted,
  Rule(RegExp(r'\$[A-Za-z_]\w*'), DiffineTokenKind.variable),
  Rule(RegExp(r'-[A-Za-z]\w*'), DiffineTokenKind.meta),
  _number,
  _identifier(
    keywords: _words(
      'begin break catch class continue data define do dynamicparam else elseif end enum exit '
      'filter finally for foreach from function if in param process return switch throw trap '
      'try until using var while',
    ),
  ),
  _operator,
  _punctuation,
];

final List<Rule> _nginx = <Rule>[
  _hashComment,
  _doubleQuoted,
  _singleQuoted,
  Rule(RegExp(r'\$[A-Za-z_]\w*'), DiffineTokenKind.variable),
  _number,
  _identifier(
    keywords: _words(
      'server location http events upstream include listen server_name root index proxy_pass '
      'return rewrite if set access_log error_log ssl_certificate ssl_certificate_key',
    ),
  ),
  _operator,
  _punctuation,
];

final RegExp _colonAhead = RegExp(r'^\s*:');

final List<Rule> _json = <Rule>[
  Rule.named(RegExp(r'"(?:\\[\s\S]|[^"\\])*"'), (String text, String code, int end) {
    // A string with a colon after it is a key, which is what a reader is
    // scanning a JSON document for.
    return _colonAhead.hasMatch(code.substring(end, (end + 4).clamp(end, code.length)))
        ? DiffineTokenKind.variable
        : DiffineTokenKind.string;
  }),
  _number,
  Rule(RegExp(r'\b(?:true|false|null)\b'), DiffineTokenKind.keyword),
  _punctuation,
];

final List<Rule> _markup = <Rule>[
  Rule(RegExp(r'<!--[\s\S]*?(?:-->|$)'), DiffineTokenKind.comment),
  Rule(RegExp(r'<!\[CDATA\[[\s\S]*?(?:\]\]>|$)'), DiffineTokenKind.string),
  Rule(RegExp(r'</?[A-Za-z][\w:.-]*'), DiffineTokenKind.title),
  Rule(RegExp(r'/?>'), DiffineTokenKind.meta),
  _doubleQuoted,
  _singleQuoted,
  Rule(RegExp(r'&[#\w]+;'), DiffineTokenKind.number),
  Rule(RegExp(r'[A-Za-z_][\w:.-]*(?==)'), DiffineTokenKind.variable),
  _operator,
];

final List<Rule> _css = <Rule>[
  _blockComment,
  _doubleQuoted,
  _singleQuoted,
  Rule(RegExp(r'@[A-Za-z-]+'), DiffineTokenKind.keyword),
  Rule(RegExp(r'--[A-Za-z][\w-]*'), DiffineTokenKind.variable),
  Rule(RegExp(r'\$[A-Za-z][\w-]*'), DiffineTokenKind.variable),
  Rule(RegExp(r'#[0-9a-fA-F]{3,8}\b'), DiffineTokenKind.number),
  Rule(RegExp(r'\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg|fr|ch|pt)?'), DiffineTokenKind.number),
  Rule(RegExp(r'[.#][A-Za-z][\w-]*'), DiffineTokenKind.title),
  Rule(RegExp(r'[A-Za-z-][\w-]*(?=\s*:)'), DiffineTokenKind.variable),
  Rule(RegExp(r'[A-Za-z-][\w-]*'), DiffineTokenKind.type),
  _operator,
  _punctuation,
];

final List<Rule> _yaml = <Rule>[
  _hashComment,
  Rule(RegExp('^---.*', multiLine: true), DiffineTokenKind.meta),
  _doubleQuoted,
  _singleQuoted,
  Rule(RegExp(r'&[A-Za-z_]\w*|\*[A-Za-z_]\w*'), DiffineTokenKind.meta),
  Rule(RegExp(r'^[ \t]*-?[ \t]*[\w.-]+(?=\s*:)', multiLine: true), DiffineTokenKind.variable),
  Rule(RegExp(r'\b(?:true|false|null|yes|no|on|off|~)\b'), DiffineTokenKind.keyword),
  _number,
  _operator,
];

final List<Rule> _ini = <Rule>[
  _hashComment,
  _dashComment,
  Rule(RegExp(';[^\n]*'), DiffineTokenKind.comment),
  Rule(RegExp(r'^\s*\[[^\]\n]*\]', multiLine: true), DiffineTokenKind.title),
  _tripleQuoted,
  _doubleQuoted,
  _singleQuoted,
  Rule(RegExp(r'^[ \t]*[\w.-]+(?=\s*=)', multiLine: true), DiffineTokenKind.variable),
  Rule(RegExp(r'\b(?:true|false)\b'), DiffineTokenKind.keyword),
  _number,
  _operator,
];

final RegExp _parenAhead = RegExp(r'^[ \t]*\(');

const String _sqlWords =
    'select from where group by having order limit offset insert into values update set delete '
    'create table alter drop index view join inner left right full outer on as and or not null '
    'is in like between distinct union all case when then else end primary key foreign '
    'references default constraint unique check cascade begin commit rollback transaction with '
    'returning exists';

final Set<String> _sqlKeywords = _words(_sqlWords);

final List<Rule> _sql = <Rule>[
  _dashComment,
  _blockComment,
  _doubleQuoted,
  _singleQuoted,
  _backticked,
  _number,
  Rule.named(RegExp(r'[A-Za-z_]\w*'), (String text, String code, int end) {
    if (_sqlKeywords.contains(text.toLowerCase())) {
      return DiffineTokenKind.keyword;
    }

    return _parenAhead.hasMatch(code.substring(end, (end + 4).clamp(end, code.length)))
        ? DiffineTokenKind.title
        : null;
  }),
  _operator,
  _punctuation,
];

final List<Rule> _graphql = <Rule>[
  _hashComment,
  _tripleQuoted,
  _doubleQuoted,
  _number,
  Rule(
    RegExp(
      r'\b(?:query|mutation|subscription|fragment|on|type|input|enum|interface|union|scalar|'
      r'schema|directive|extend|implements|true|false|null)\b',
    ),
    DiffineTokenKind.keyword,
  ),
  Rule(RegExp(r'\$[A-Za-z_]\w*'), DiffineTokenKind.variable),
  Rule(RegExp(r'@[A-Za-z_]\w*'), DiffineTokenKind.meta),
  Rule(RegExp(r'[A-Za-z_]\w*(?=\s*[:({])'), DiffineTokenKind.variable),
  Rule(RegExp(r'[A-Z][\w]*'), DiffineTokenKind.type),
  _operator,
  _punctuation,
];

final List<Rule> _markdown = <Rule>[
  Rule(RegExp('^#{1,6} [^\n]*', multiLine: true), DiffineTokenKind.title),
  Rule(RegExp('^```[^\n]*', multiLine: true), DiffineTokenKind.meta),
  Rule(RegExp(r'`[^`\n]*`'), DiffineTokenKind.string),
  Rule(RegExp(r'^\s*(?:[-*+]|\d+\.)\s', multiLine: true), DiffineTokenKind.keyword),
  Rule(RegExp('^>[^\n]*', multiLine: true), DiffineTokenKind.comment),
  Rule(RegExp(r'\*\*[^*\n]+\*\*|__[^_\n]+__'), DiffineTokenKind.type),
  Rule(RegExp(r'\[[^\]\n]*\]\([^)\n]*\)'), DiffineTokenKind.variable),
  Rule(RegExp(r'!?\[[^\]\n]*\]'), DiffineTokenKind.variable),
];

final List<Rule> _diff = <Rule>[
  Rule(RegExp('^@@[^\n]*', multiLine: true), DiffineTokenKind.meta),
  Rule(RegExp('^(?:---|[+][+][+])[^\n]*', multiLine: true), DiffineTokenKind.title),
  Rule(RegExp('^[+][^\n]*', multiLine: true), DiffineTokenKind.string),
  Rule(RegExp('^-[^\n]*', multiLine: true), DiffineTokenKind.variable),
  Rule(RegExp('^(?:diff|index)[^\n]*', multiLine: true), DiffineTokenKind.comment),
];

/// Every language, by the identifier `language` takes.
final Map<String, List<Rule>> _grammars = <String, List<Rule>>{
  'bash': _shell,
  'c': _c,
  'cpp': _cpp,
  'csharp': _csharp,
  'css': _css,
  'dart': _dart,
  'diff': _diff,
  'dockerfile': _dockerfile,
  'go': _go,
  'graphql': _graphql,
  'ini': _ini,
  'java': _java,
  'javascript': _javascript,
  'json': _json,
  'kotlin': _kotlin,
  'less': _css,
  'lua': _lua,
  'markdown': _markdown,
  'nginx': _nginx,
  'objectivec': _objectivec,
  'perl': _perl,
  'php': _php,
  'powershell': _powershell,
  'python': _python,
  'r': _r,
  'ruby': _ruby,
  'rust': _rust,
  'scala': _scala,
  'scss': _css,
  'sql': _sql,
  'swift': _swift,
  'typescript': _typescript,
  'xml': _markup,
  'yaml': _yaml,
};

/// What each of them is called, in the order the menu lists them.
const Map<String, String> _names = <String, String>{
  'bash': 'Bash',
  'c': 'C',
  'cpp': 'C++',
  'csharp': 'C#',
  'css': 'CSS',
  'dart': 'Dart',
  'diff': 'Diff',
  'dockerfile': 'Dockerfile',
  'go': 'Go',
  'graphql': 'GraphQL',
  'ini': 'INI / TOML',
  'java': 'Java',
  'javascript': 'JavaScript',
  'json': 'JSON',
  'kotlin': 'Kotlin',
  'less': 'Less',
  'lua': 'Lua',
  'markdown': 'Markdown',
  'nginx': 'Nginx',
  'objectivec': 'Objective-C',
  'perl': 'Perl',
  'php': 'PHP',
  'powershell': 'PowerShell',
  'python': 'Python',
  'r': 'R',
  'ruby': 'Ruby',
  'rust': 'Rust',
  'scala': 'Scala',
  'scss': 'SCSS',
  'sql': 'SQL',
  'swift': 'Swift',
  'typescript': 'TypeScript',
  'xml': 'HTML / XML',
  'yaml': 'YAML',
};

/// Every language the widgets know, with `plain` at the front.
///
/// This is what the editor's menu is built from, and it is exported so that an
/// application building a menu of its own — in its own place, in its own
/// language — is building it from the same list rather than from a copy that
/// goes stale.
final List<DiffineLanguageOption> kDiffineLanguages = <DiffineLanguageOption>[
  const DiffineLanguageOption(kPlain, 'Plain'),
  ..._names.entries.map(
    (MapEntry<String, String> entry) => DiffineLanguageOption(entry.key, entry.value),
  ),
];

/// What to call a language, which for one nobody knows is what it was called.
String languageName(String? language) {
  if (language == null || language.isEmpty || language == kPlain) {
    return 'Plain';
  }

  return _names[language] ?? language;
}

/// The grammar for a language, or `null` where there is nothing to colour with.
List<Rule>? grammarFor(String? language) {
  if (language == null || language.isEmpty || language == kPlain) {
    return null;
  }

  return _grammars[language];
}

/// A highlighter for two documents in one language, or `null` for `plain`.
///
/// Both documents are tokenised once rather than once per line, because a
/// grammar carries state across lines — a block comment, a template string, a
/// heredoc — and a line handed over on its own would be coloured as though the
/// document started there.
///
/// This is the whole of what `language` amounts to, exported so that an
/// application drawing the same two documents somewhere else can colour them
/// the same way.
DiffineHighlight? diffineHighlighterFor(String? language, List<String> before, List<String> after) {
  final List<Rule>? rules = grammarFor(language);

  if (rules == null) {
    return null;
  }

  final List<List<DiffineToken>>? beforeTokens = tokenizeLines(before, rules);
  final List<List<DiffineToken>>? afterTokens = tokenizeLines(after, rules);

  if (beforeTokens == null && afterTokens == null) {
    return null;
  }

  return (DiffLine line, DiffineSide side) {
    final List<List<DiffineToken>>? held = side == DiffineSide.before ? beforeTokens : afterTokens;

    return held != null && line.index < held.length ? held[line.index] : null;
  };
}
