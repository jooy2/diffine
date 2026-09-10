import 'package:diffine/diffine.dart';
import 'package:flutter_test/flutter_test.dart';

/// A row written the way a reader would describe it, for readable assertions.
String shape(DiffRow row) {
  final String before = row.before?.text ?? '·';
  final String after = row.after?.text ?? '·';

  return '${row.kind.name} $before | $after';
}

List<String> shapes(DiffResult result) => result.rows.map(shape).toList();

List<String> texts(List<DiffSegment> segments) =>
    segments.map((DiffSegment piece) => '${piece.kind.name}:${piece.text}').toList();

void main() {
  group('diffText', () {
    test('reads an empty document as no lines rather than one empty line', () {
      final DiffResult result = diffText('', '');

      expect(result.before, isEmpty);
      expect(result.after, isEmpty);
      expect(result.rows, isEmpty);
      expect(result.changes, isEmpty);
    });

    test('takes the newline that ends a document as the end of its last line', () {
      expect(diffText('a\n', '').before, <String>['a']);
      expect(diffText('a\nb', '').before, <String>['a', 'b']);
      expect(diffText('a\n\n', '').before, <String>['a', '']);
    });

    test('ends a line on any of the three line endings', () {
      expect(diffText('a\r\nb\rc\nd', '').before, <String>['a', 'b', 'c', 'd']);
    });

    test('finds no changes between two copies of the same document', () {
      final DiffResult result = diffText('one\ntwo\nthree', 'one\ntwo\nthree');

      expect(result.changes, isEmpty);
      expect(result.stats.unchanged, 3);
      expect(result.stats.changed, 0);
      expect(result.rows.every((DiffRow row) => row.kind == DiffRowKind.equal), isTrue);
    });

    test('puts an inserted line opposite a blank', () {
      expect(shapes(diffText('a\nc', 'a\nb\nc')), <String>[
        'equal a | a',
        'insert · | b',
        'equal c | c',
      ]);
    });

    test('puts a deleted line opposite a blank', () {
      expect(shapes(diffText('a\nb\nc', 'a\nc')), <String>[
        'equal a | a',
        'delete b | ·',
        'equal c | c',
      ]);
    });

    test('pairs the lines of a replaced run in the order they were written', () {
      expect(shapes(diffText('a\nb\nc\nd', 'a\nB\nC\nd')), <String>[
        'equal a | a',
        'replace b | B',
        'replace c | C',
        'equal d | d',
      ]);
    });

    test('leaves the surplus of a longer side with nothing opposite it', () {
      expect(shapes(diffText('a\nb\nc', 'A')), <String>[
        'replace a | A',
        'delete b | ·',
        'delete c | ·',
      ]);
    });

    test('pairs the line that was edited rather than the line that came first', () {
      // A run that inserts a line *and* edits one. Taken straight down, every
      // row after the insertion pairs two lines that have nothing to do with
      // each other, and the words inside them get compared on that basis.
      const String before = 'header\nconst total = price * quantity;\nfooter';
      const String after =
          'header\nconst tax = price * rate;\nconst total = price * quantity * 2;\nfooter';

      expect(shapes(diffText(before, after)), <String>[
        'equal header | header',
        'insert · | const tax = price * rate;',
        'replace const total = price * quantity; | const total = price * quantity * 2;',
        'equal footer | footer',
      ]);
    });

    test('counts every line exactly once', () {
      final DiffStats stats = diffText('a\nb\nc', 'a\nB\nc\nd').stats;

      expect(stats.unchanged, 2);
      expect(stats.changed, 1);
      expect(stats.inserted, 1);
      expect(stats.deleted, 0);
    });

    test('groups the rows of one edit into a single change', () {
      final DiffResult result = diffText('a\nb\nc\nd\ne', 'a\nX\nY\ne');

      expect(result.changes, hasLength(1));

      final DiffChange change = result.changes.first;

      expect(change.kind, DiffChangeKind.replace);
      expect(change.beforeStart, 1);
      expect(change.beforeEnd, 4);
      expect(change.afterStart, 1);
      expect(change.afterEnd, 3);
      expect(change.rowStart, 1);
      expect(change.rowEnd, 4);
      expect(result.rows.sublist(1, 4).map(shape).toList(), <String>[
        'replace b | X',
        'replace c | Y',
        'delete d | ·',
      ]);
    });

    test('reports every change in the order it appears', () {
      final DiffResult result = diffText('a\nb\nc\nd\ne', 'a\nc\nd\nE\nf');

      expect(result.changes.map((DiffChange change) => change.kind).toList(), <DiffChangeKind>[
        DiffChangeKind.delete,
        DiffChangeKind.replace,
      ]);
      expect(result.changes.first.beforeStart, 1);
      expect(result.changes.first.beforeEnd, 2);
      expect(result.changes[1].beforeStart, 4);
      expect(result.changes[1].afterEnd, 5);
    });

    test('finds the smallest set of edits rather than the first one it meets', () {
      // Two lines moved past each other. Anything that matched greedily from the
      // top would call all four lines changed.
      final DiffResult result = diffText('a\nb\nc\nd', 'c\nd\na\nb');

      expect(result.stats.unchanged, 2);
      expect(result.changes, hasLength(2));
    });

    test('marks the words that moved inside a changed line', () {
      final DiffRow row = diffText('the quick brown fox', 'the slow brown fox').rows.first;

      expect(texts(row.before!.segments), <String>[
        'equal:the ',
        'delete:quick',
        'equal: brown fox',
      ]);
      expect(texts(row.after!.segments), <String>['equal:the ', 'insert:slow', 'equal: brown fox']);
    });

    test('joins the pieces of a line back into the line', () {
      final DiffRow row = diffText('a shared middle here', 'a different middle there').rows.first;

      expect(row.before!.segments.map((DiffSegment piece) => piece.text).join(), row.before!.text);
      expect(row.after!.segments.map((DiffSegment piece) => piece.text).join(), row.after!.text);
    });

    test('marks nothing inside a pair that has too little in common', () {
      final DiffRow row = diffText('alpha beta gamma', 'nothing alike at all').rows.first;

      expect(row.kind, DiffRowKind.replace);
      expect(row.before!.segments, isEmpty);
      expect(row.after!.segments, isEmpty);
    });

    test('marks that pair anyway once the threshold is out of the way', () {
      final DiffRow row = diffText(
        'alpha beta gamma',
        'nothing alike at all',
        const DiffOptions(inlineThreshold: 0),
      ).rows.first;

      expect(row.before!.segments, isNotEmpty);
    });

    test('marks nothing inside a line when the inline comparison is off', () {
      final DiffRow row = diffText(
        'the quick fox',
        'the slow fox',
        const DiffOptions(inline: DiffInlineMode.none),
      ).rows.first;

      expect(row.kind, DiffRowKind.replace);
      expect(row.before!.segments, isEmpty);
    });

    test('marks one grapheme at a time when asked to', () {
      final DiffRow row = diffText(
        'version 1',
        'version 2',
        const DiffOptions(inline: DiffInlineMode.character),
      ).rows.first;

      expect(texts(row.after!.segments), <String>['equal:version ', 'insert:2']);
    });
  });

  group('the whitespace and case options', () {
    test('compares every space by default', () {
      expect(diffText('a  b', 'a b').changes, hasLength(1));
    });

    test('ignores whitespace at the end of a line', () {
      expect(
        diffText('a b   ', 'a b', const DiffOptions(whitespace: DiffWhitespace.trailing)).changes,
        isEmpty,
      );
      expect(
        diffText('   a b', 'a b', const DiffOptions(whitespace: DiffWhitespace.trailing)).changes,
        hasLength(1),
      );
    });

    test('ignores whitespace at either end', () {
      expect(
        diffText(
          '   a b  ',
          'a b',
          const DiffOptions(whitespace: DiffWhitespace.surrounding),
        ).changes,
        isEmpty,
      );
    });

    test('ignores how much whitespace is between two words', () {
      expect(
        diffText('a      b', ' a b ', const DiffOptions(whitespace: DiffWhitespace.amount)).changes,
        isEmpty,
      );
      expect(
        diffText('ab', 'a b', const DiffOptions(whitespace: DiffWhitespace.amount)).changes,
        hasLength(1),
      );
    });

    test('ignores whitespace entirely', () {
      expect(
        diffText('ab', ' a  b ', const DiffOptions(whitespace: DiffWhitespace.all)).changes,
        isEmpty,
      );
    });

    test('draws the whitespace it was told to ignore', () {
      final DiffResult result = diffText(
        'a b   ',
        'a b',
        const DiffOptions(whitespace: DiffWhitespace.trailing),
      );

      expect(result.rows.first.before!.text, 'a b   ');
      expect(result.rows.first.after!.text, 'a b');
    });

    test('ignores case when asked to', () {
      expect(diffText('Title', 'title', const DiffOptions(ignoreCase: true)).changes, isEmpty);
      expect(diffText('Title', 'title').changes, hasLength(1));
    });
  });

  group('the cost limit', () {
    test('says the comparison finished when it did', () {
      expect(diffText('a\nb\nc', 'a\nx\nc').complete, isTrue);
    });

    test('gives up and calls the range replaced rather than working through it', () {
      final String before = List<String>.generate(60, (int i) => 'before $i').join('\n');
      final String after = List<String>.generate(60, (int i) => 'after $i').join('\n');
      final DiffResult result = diffText(before, after, const DiffOptions(maxCost: 1));

      expect(result.complete, isFalse);
      expect(result.changes, hasLength(1));
      expect(result.changes.first.kind, DiffChangeKind.replace);
    });
  });

  group('diffWords', () {
    test('splits on words and keeps the whitespace between them', () {
      final DiffInlineResult result = diffWords('one two three', 'one four three');

      expect(texts(result.before), <String>['equal:one ', 'delete:two', 'equal: three']);
    });

    test('is 1 alike for two copies of the same text and 0 for nothing shared', () {
      expect(diffWords('same', 'same').similarity, 1);
      expect(diffWords('aaa', 'bbb').similarity, 0);
    });

    test('holds each side of an equal run when the two are not the same string', () {
      final DiffInlineResult result = diffWords(
        'Title here',
        'title there',
        const DiffOptions(ignoreCase: true),
      );

      expect(result.before.map((DiffSegment piece) => piece.text).join(), 'Title here');
      expect(result.after.map((DiffSegment piece) => piece.text).join(), 'title there');
    });
  });

  group('diffCharacters', () {
    test('keeps a grapheme whole rather than splitting it into its parts', () {
      final DiffInlineResult result = diffCharacters('a👨‍👩‍👧b', 'a👨‍👩‍👧c');

      expect(texts(result.before), <String>['equal:a👨‍👩‍👧', 'delete:b']);
    });
  });

  group('diffSequence', () {
    test('returns the runs between two sequences of tokens', () {
      final List<DiffEdit> edits = diffSequence(<String>['a', 'b', 'c'], <String>['a', 'c']);

      expect(
        edits
            .map(
              (DiffEdit edit) =>
                  '${edit.kind.name} ${edit.beforeStart}..${edit.beforeEnd} '
                  '/ ${edit.afterStart}..${edit.afterEnd}',
            )
            .toList(),
        <String>['equal 0..1 / 0..1', 'delete 1..2 / 1..1', 'equal 2..3 / 1..2'],
      );
    });

    test('reports one side as inserted when the other is empty', () {
      expect(diffSequence(<String>[], <String>['a', 'b']).single.kind, DiffEditKind.insert);
      expect(diffSequence(<String>['a'], <String>[]).single.kind, DiffEditKind.delete);
    });

    test('returns nothing at all for two empty sequences', () {
      expect(diffSequence(<String>[], <String>[]), isEmpty);
    });

    test('covers both sequences exactly once, in order', () {
      final List<String> before = 'the quick brown fox jumps'.split(' ');
      final List<String> after = 'the slow brown fox leaps over'.split(' ');
      int beforeCursor = 0;
      int afterCursor = 0;

      for (final DiffEdit edit in diffSequence(before, after)) {
        expect(edit.beforeStart, beforeCursor);
        expect(edit.afterStart, afterCursor);
        beforeCursor = edit.beforeEnd;
        afterCursor = edit.afterEnd;
      }

      expect(beforeCursor, before.length);
      expect(afterCursor, after.length);
    });
  });

  group('diffText with patterns to ignore', () {
    final RegExp stamp = RegExp(r'\d{4}-\d{2}-\d{2}');

    test('calls two lines the same when they differ only inside a match', () {
      final DiffResult result = diffText(
        'built 2026-01-01\nkeep',
        'built 2026-09-08\nkeep',
        DiffOptions(ignore: <RegExp>[stamp]),
      );

      expect(result.changes, isEmpty);
      expect(result.stats.unchanged, 2);
    });

    test('leaves the lines exactly as they were written', () {
      final DiffResult result = diffText(
        'built 2026-01-01',
        'built 2026-09-08',
        DiffOptions(ignore: <RegExp>[stamp]),
      );

      expect(result.rows.first.before!.text, 'built 2026-01-01');
      expect(result.rows.first.after!.text, 'built 2026-09-08');
    });

    test('still finds what changed outside a match', () {
      expect(
        diffText(
          'built 2026-01-01 by ann',
          'built 2026-09-08 by bob',
          DiffOptions(ignore: <RegExp>[stamp]),
        ).changes,
        hasLength(1),
      );
    });

    test('sets a match aside rather than taking it out', () {
      expect(
        diffText('a 2026-01-01 b', 'a  b', DiffOptions(ignore: <RegExp>[stamp])).changes,
        hasLength(1),
      );
    });

    test('looks for a pattern everywhere in the line, not only once', () {
      expect(
        diffText(
          '2026-01-01 to 2026-01-02',
          '2020-05-05 to 2020-05-06',
          DiffOptions(ignore: <RegExp>[stamp]),
        ).changes,
        isEmpty,
      );
    });

    test('takes more than one pattern', () {
      expect(
        diffText(
          '2026-01-01 #4821 done',
          '2020-05-05 #17 done',
          DiffOptions(ignore: <RegExp>[stamp, RegExp(r'#\d+')]),
        ).changes,
        isEmpty,
      );
    });

    test('compares the words inside a changed pair as they were written', () {
      final DiffRow row = diffText(
        'the report was written on 2026-01-01 by ann',
        'the report was written on 2020-05-05 by bob',
        DiffOptions(ignore: <RegExp>[stamp]),
      ).rows.first;
      final String gone = row.before!.segments
          .where((DiffSegment piece) => piece.kind == DiffEditKind.delete)
          .map((DiffSegment piece) => piece.text)
          .join(' ');

      // The pair is a change, because the name differs. Inside it the date is
      // compared like anything else: a pattern written for a line says nothing
      // about one word of it.
      expect(gone, contains('2026'));
    });

    test('ignores nothing when it is not asked to', () {
      expect(diffText('built 2026-01-01', 'built 2026-09-08').changes, hasLength(1));
    });
  });

  group('how a document is written', () {
    test('names the line ending each side uses', () {
      final DiffResult result = diffText('a\nb\n', 'a\r\nb\r\n');

      expect(result.format!.before.ending, DiffLineEnding.lf);
      expect(result.format!.after.ending, DiffLineEnding.crlf);
      expect(result.changes, isEmpty);
    });

    test('calls a document with more than one of them mixed', () {
      expect(diffText('a\r\nb\nc', '').format!.before.ending, DiffLineEnding.mixed);
    });

    test('says whether the last line carries an ending of its own', () {
      expect(diffText('a\n', '').format!.before.finalNewline, isTrue);
      expect(diffText('a', '').format!.before.finalNewline, isFalse);
    });

    test('finds a byte order mark at the start of the first line', () {
      expect(diffText('﻿a\n', '').format!.before.byteOrderMark, isTrue);
      expect(diffText('a\n', '').format!.before.byteOrderMark, isFalse);
    });
  });
}
