/// The machine every grammar is written against.
///
/// Every rule is a pattern tried where the cursor is, in the order the grammar
/// lists them, and the first one that matches names the run it matched. Nothing
/// nests and nothing carries state between rules, which is what keeps a
/// grammar to a dozen lines — and what makes it **approximate**, deliberately
/// and permanently.
///
/// That is the trade the React package does not have to make: it fetches
/// highlight.js, which is a real parser for a hundred languages, and it can do
/// that because a browser can fetch. An app bundle cannot, and a correct parser
/// for thirty-four languages is not a thing to keep beside a diff viewer. So a
/// template literal with a brace in it, a regular expression that reads as
/// division, a `<` in prose inside an HTML block — each of them comes out
/// slightly wrong, and none of them matters, because colour is not the kind of
/// answer that has to be right.
///
/// What it will not do is change the document. Every run is cut out of the text
/// it was given and the lengths add back up to the line, so being wrong here is
/// a colour that is off rather than a line that says something else.
///
/// For anything more than that, [DiffineHighlight] is one function and any
/// grammar behind it is a few lines. This is here so that the common case needs
/// neither.
library;

import 'package:diffine/src/types.dart';

/// What a rule says a run of characters is.
///
/// A function rather than a name, because the name sometimes depends on the
/// word: `open` is a title where it is followed by a bracket, a type where it
/// starts with a capital, and nothing in particular otherwise, and that is one
/// rule rather than three.
typedef TokenKindOf = DiffineTokenKind? Function(String text, String code, int end);

/// One rule of a grammar.
class Rule {
  /// A run that is one thing wherever it is found.
  const Rule(this.match, this.kind) : resolve = null;

  /// A run whose name depends on what is around it.
  const Rule.named(this.match, this.resolve) : kind = null;

  /// Matched with [RegExp.matchAsPrefix], so it can only match where it is
  /// asked to — which is what the JavaScript half writes as a sticky flag.
  final RegExp match;

  /// What it is, where that does not depend on anything.
  final DiffineTokenKind? kind;

  /// What it is, where it does.
  final TokenKindOf? resolve;

  /// What this run turned out to be.
  DiffineTokenKind? nameFor(String text, String code, int end) {
    final TokenKindOf? decide = resolve;

    return decide == null ? kind : decide(text, code, end);
  }
}

/// How much code is worth colouring.
///
/// Every rule is tried at every position a rule did not match, so the work is
/// the length of the document times the size of its grammar. A minified bundle
/// pasted into a comparison is not something to spend a frame on, and plain
/// text is a perfectly good drawing of it.
const int _limit = 400000;

/// One run of the document, and what it is.
class _Run {
  const _Run(this.length, this.kind);

  final int length;
  final DiffineTokenKind? kind;
}

/// The whole document as runs, in order, with nothing left out.
List<_Run> _tokenize(String code, List<Rule> rules) {
  final List<_Run> out = <_Run>[];
  int plain = 0;
  int at = 0;

  void flush() {
    if (plain > 0) {
      out.add(_Run(plain, null));
      plain = 0;
    }
  }

  while (at < code.length) {
    Match? found;
    Rule? matched;

    for (final Rule rule in rules) {
      final Match? tried = rule.match.matchAsPrefix(code, at);

      if (tried != null && tried.end > at) {
        found = tried;
        matched = rule;
        break;
      }
    }

    if (found == null || matched == null) {
      plain += 1;
      at += 1;
      continue;
    }

    final String text = code.substring(found.start, found.end);
    final DiffineTokenKind? kind = matched.nameFor(text, code, found.end);

    if (kind == null) {
      plain += text.length;
    } else {
      flush();
      out.add(_Run(text.length, kind));
    }

    at = found.end;
  }

  flush();

  return out;
}

/// A document's lines, coloured, or `null` when there is nothing to colour
/// with.
///
/// The lines are joined back into the document they came from, which is what
/// gives a grammar the context it needs — a comment that opens on one line and
/// closes on the next is one run — and the answer is split at the newlines
/// again so that line `n` of the document is entry `n` here.
List<List<DiffineToken>>? tokenizeLines(List<String> lines, List<Rule>? rules) {
  if (rules == null || lines.isEmpty) {
    return null;
  }

  final String code = lines.join('\n');

  if (code.length > _limit) {
    return null;
  }

  final List<List<DiffineToken>> out = <List<DiffineToken>>[];
  final List<_Run> runs = _tokenize(code, rules);

  List<DiffineToken> current = <DiffineToken>[];
  int at = 0;

  for (final _Run run in runs) {
    // A run that crosses a line ending is that many runs, one per line, so that
    // every entry adds up to the line it belongs to.
    int taken = 0;

    while (taken < run.length) {
      final int newline = code.indexOf('\n', at + taken);
      final int stop = newline < 0 || newline >= at + run.length ? at + run.length : newline;
      final int length = stop - (at + taken);

      if (length > 0) {
        current.add(DiffineToken(length: length, kind: run.kind));
        taken += length;
      }

      if (newline >= 0 && newline < at + run.length) {
        out.add(current);
        current = <DiffineToken>[];
        taken += 1;
      }
    }

    at += run.length;
  }

  out.add(current);

  return out;
}
