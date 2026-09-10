import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/highlight/catalogue.dart';
import 'package:flutter_test/flutter_test.dart';

/// One document, coloured, as `kind:text` for every run.
List<String> runsOf(String language, String code) {
  final List<String> lines = code.split('\n');
  final DiffineHighlight? highlight = diffineHighlighterFor(language, lines, lines);

  if (highlight == null) {
    return <String>[];
  }

  final List<String> out = <String>[];

  for (int index = 0; index < lines.length; index += 1) {
    final List<DiffineToken>? tokens = highlight(
      DiffLine(index: index, text: lines[index]),
      DiffineSide.before,
    );
    int at = 0;

    for (final DiffineToken token in tokens ?? const <DiffineToken>[]) {
      out.add('${token.kind?.name ?? 'plain'}:${lines[index].substring(at, at + token.length)}');
      at += token.length;
    }
  }

  return out;
}

/// Whether the runs join back into exactly the lines they came from.
bool joinsBack(String language, String code) {
  final List<String> lines = code.split('\n');
  final DiffineHighlight? highlight = diffineHighlighterFor(language, lines, lines);

  if (highlight == null) {
    return false;
  }

  for (int index = 0; index < lines.length; index += 1) {
    final List<DiffineToken> tokens =
        highlight(DiffLine(index: index, text: lines[index]), DiffineSide.before) ??
        const <DiffineToken>[];
    final int total = tokens.fold(0, (int sum, DiffineToken token) => sum + token.length);

    if (total != lines[index].length) {
      return false;
    }
  }

  return true;
}

void main() {
  group('the catalogue', () {
    test('opens with plain, and holds every language the menu offers', () {
      expect(kDiffineLanguages.first.id, 'plain');
      expect(kDiffineLanguages.first.name, 'Plain');
      expect(kDiffineLanguages, hasLength(35));
    });

    test('has no two entries with the same identifier', () {
      final Set<String> ids = kDiffineLanguages
          .map((DiffineLanguageOption option) => option.id)
          .toSet();

      expect(ids, hasLength(kDiffineLanguages.length));
    });

    test('has a grammar for every language it names', () {
      for (final DiffineLanguageOption option in kDiffineLanguages) {
        if (option.id == 'plain') {
          continue;
        }

        expect(grammarFor(option.id), isNotNull, reason: option.id);
      }
    });

    test('calls a language nobody knows whatever it was called', () {
      expect(languageName('klingon'), 'klingon');
      expect(languageName(null), 'Plain');
      expect(languageName('plain'), 'Plain');
    });
  });

  group('the highlighter', () {
    test('has nothing to colour a plain document with', () {
      expect(diffineHighlighterFor('plain', <String>['one'], <String>['one']), isNull);
      expect(diffineHighlighterFor(null, <String>['one'], <String>['one']), isNull);
    });

    test('names the keywords, the strings and the comments of a language', () {
      final List<String> runs = runsOf('dart', "const String a = 'b'; // note");

      expect(runs, contains('keyword:const'));
      expect(runs, contains("string:'b'"));
      expect(runs, contains('comment:// note'));
    });

    test('keeps a comment that opens on one line and closes on the next whole', () {
      final List<String> runs = runsOf('dart', '/* one\ntwo */\nthree');

      expect(runs, contains('comment:/* one'));
      expect(runs, contains('comment:two */'));
    });

    test('joins the runs back into exactly the lines it was given', () {
      const Map<String, String> samples = <String, String>{
        'dart': "void main() {\n  print('hi'); // go\n}",
        'json': '{"a": 1, "b": [true, null]}',
        'xml': '<a href="b">c</a><!-- d -->',
        'css': '.a { color: #fff; width: 10px; }',
        'python': 'def f(x):\n    return "y" # z',
        'yaml': 'a: 1\nb:\n  - c\n  - true',
        'sql': 'SELECT * FROM t WHERE a = 1 -- note',
        'bash': 'echo "\$HOME" # note',
        'markdown': '# Title\n\n- one\n\n`code`',
        'diff': '@@ -1 +1 @@\n-a\n+b',
      };

      for (final MapEntry<String, String> sample in samples.entries) {
        expect(joinsBack(sample.key, sample.value), isTrue, reason: sample.key);
      }
    });

    test('colours each side from its own document', () {
      final DiffineHighlight highlight = diffineHighlighterFor(
        'dart',
        <String>['const a = 1;'],
        <String>['// changed'],
      )!;

      expect(
        highlight(const DiffLine(index: 0, text: 'const a = 1;'), DiffineSide.before)!.first.kind,
        DiffineTokenKind.keyword,
      );
      expect(
        highlight(const DiffLine(index: 0, text: '// changed'), DiffineSide.after)!.first.kind,
        DiffineTokenKind.comment,
      );
    });

    test('has nothing to say about a line the document does not have', () {
      final DiffineHighlight highlight = diffineHighlighterFor(
        'dart',
        <String>['const a = 1;'],
        <String>['const a = 1;'],
      )!;

      expect(highlight(const DiffLine(index: 40, text: 'nowhere'), DiffineSide.before), isNull);
    });
  });
}
