import 'dart:typed_data';

import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/pieces.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/internal/search.dart';
import 'package:flutter_test/flutter_test.dart';

/// A pane of plain lines, which is what the search actually runs over.
PaneLayout paneOf(String text) {
  final List<PaneLine> lines = <PaneLine>[
    for (final (int index, String line) in text.split('\n').indexed)
      PaneLine(
        kind: DiffRowKind.equal,
        side: DiffineSide.before,
        line: DiffLine(index: index, text: line),
        numbers: <int?>[index + 1],
        change: -1,
      ),
  ];

  return PaneLayout(lines, Int32List(lines.length), lines.isEmpty ? null : lines.first);
}

List<String> found(String text, String query, {SearchOptions options = const SearchOptions()}) {
  final PaneLayout pane = paneOf(text);

  return findMatches(
    pane.lines,
    patternFor(query, options),
    options.wholeWord,
  ).matches.map((SearchMatch match) => '${match.row}:${match.start}-${match.end}').toList();
}

void main() {
  group('patternFor', () {
    test('looks for the query as the text it is, punctuation included', () {
      expect(found('a.b\naxb', 'a.b'), <String>['0:0-3']);
    });

    test('reads the query as an expression when it is asked to', () {
      expect(found('a.b\naxb', 'a.b', options: const SearchOptions(regex: true)), <String>[
        '0:0-3',
        '1:0-3',
      ]);
    });

    test('tells the cases apart only when it is asked to', () {
      expect(found('Title\ntitle', 'title'), hasLength(2));
      expect(
        found('Title\ntitle', 'title', options: const SearchOptions(matchCase: true)),
        hasLength(1),
      );
    });

    test('has nothing to look for in an empty box, and nothing in a half-written one', () {
      expect(patternFor('', const SearchOptions()), isNull);
      expect(patternFor('(', const SearchOptions(regex: true)), isNull);
    });
  });

  group('findMatches', () {
    test('comes back in the order the pane draws them', () {
      expect(found('one two\none', 'one'), <String>['0:0-3', '1:0-3']);
    });

    test('leaves a word inside a longer one alone when whole words are asked for', () {
      expect(found('use user\nuse', 'use', options: const SearchOptions(wholeWord: true)), <String>[
        '0:0-3',
        '1:0-3',
      ]);
    });

    test('counts a Korean word as a word', () {
      expect(found('찾기 찾기다', '찾기', options: const SearchOptions(wholeWord: true)), <String>[
        '0:0-2',
      ]);
    });

    test('collects nothing for a pattern that matches nothing at all', () {
      expect(found('abc', 'x*', options: const SearchOptions(regex: true)), isEmpty);
    });

    test('stops at the limit, and says that it did', () {
      final PaneLayout pane = paneOf(List<String>.filled(20, 'aaaa').join('\n'));
      final SearchResult result = findMatches(
        pane.lines,
        patternFor('a', const SearchOptions()),
        false,
        10,
      );

      expect(result.matches, hasLength(10));
      expect(result.capped, isTrue);
    });
  });

  group('matchRows', () {
    test('hands each line the matches that are in it', () {
      final PaneLayout pane = paneOf('one one\ntwo\none');
      final Map<int, List<SearchMatch>> rows = matchRows(
        findMatches(pane.lines, patternFor('one', const SearchOptions()), false).matches,
      );

      expect(rows[0], hasLength(2));
      expect(rows[1], isNull);
      expect(rows[2], hasLength(1));
    });
  });

  group('lineStarts', () {
    test('counts every line ending as the one character or two that it is', () {
      expect(lineStarts('a\r\nb\nc'), <int>[0, 3, 5]);
    });

    test('gives a document that ends in a newline the empty line a caret can sit on', () {
      expect(lineStarts('a\nb\n'), <int>[0, 2, 4]);
    });
  });

  group('rangeOf', () {
    test('turns a match into a range in the document it came from', () {
      const String text = 'one\ntwo\nthree';
      final PaneLayout pane = paneOf(text);
      final SearchMatch match = findMatches(
        pane.lines,
        patternFor('three', const SearchOptions()),
        false,
      ).matches.single;
      final DocumentRange range = rangeOf(pane, lineStarts(text), match)!;

      expect(text.substring(range.start, range.end), 'three');
    });
  });

  group('replacedText', () {
    test('writes over every range and leaves everything between them', () {
      expect(
        replacedText('one two one', <DocumentRange>[
          const DocumentRange(0, 3),
          const DocumentRange(8, 11),
        ], 'X'),
        'X two X',
      );
    });

    test('has nothing to do when there was nothing to write over', () {
      expect(replacedText('one', const <DocumentRange>[], 'X'), 'one');
    });
  });

  group('splitLine', () {
    test('cuts the line at what was found as well as at what changed', () {
      const DiffLine line = DiffLine(
        index: 0,
        text: 'one two',
        segments: <DiffSegment>[
          DiffSegment(DiffEditKind.equal, 'one '),
          DiffSegment(DiffEditKind.delete, 'two'),
        ],
      );
      final List<LinePiece> pieces = splitLine(line, null, <LineRange>[const LineRange(2, 6)])!;

      expect(pieces.map((LinePiece piece) => piece.text).toList(), <String>['on', 'e ', 'tw', 'o']);
      expect(pieces.map((LinePiece piece) => piece.text).join(), line.text);
    });

    test('marks what was found in a line the comparison had nothing to say about', () {
      const DiffLine line = DiffLine(index: 0, text: 'one two');
      final List<LinePiece> pieces = splitLine(line, null, <LineRange>[
        const LineRange(4, 7, current: true),
      ])!;

      expect(pieces.last.match, PieceMatch.current);
      expect(pieces.last.text, 'two');
    });

    test('has nothing to say about a line with no comparison, no colour and no match', () {
      expect(splitLine(const DiffLine(index: 0, text: 'plain'), null, null), isNull);
    });
  });
}
