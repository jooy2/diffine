import 'package:diffine/diffine.dart';
import 'package:flutter_test/flutter_test.dart';

const String _before = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\n';
const String _after = 'one\ntwo\nthree\nFOUR\nfive\nsix\nseven\n';

List<String> lines(String patch) => patch.split('\n');

void main() {
  group('formatPatch', () {
    test('writes nothing at all for two documents that are the same', () {
      expect(formatPatch(diffText(_before, _before)), '');
    });

    test('writes the headers, the hunk and the lines around it', () {
      expect(lines(formatPatch(diffText(_before, _after))), <String>[
        '--- before',
        '+++ after',
        '@@ -1,7 +1,7 @@',
        ' one',
        ' two',
        ' three',
        '-four',
        '+FOUR',
        ' five',
        ' six',
        ' seven',
        '',
      ]);
    });

    test('names each side where a name was given', () {
      final String patch = formatPatch(
        diffText(_before, _after),
        const DiffPatchOptions(before: 'a/lib/main.dart', after: 'b/lib/main.dart'),
      );

      expect(lines(patch).sublist(0, 2), <String>['--- a/lib/main.dart', '+++ b/lib/main.dart']);
    });

    test('leaves the count off a hunk that covers one line', () {
      expect(formatPatch(diffText('a', 'b')), contains('@@ -1 +1 @@'));
    });

    test('writes the lines that come before an insertion as its position', () {
      expect(formatPatch(diffText('', 'a\n')), contains('@@ -0,0 +1 @@'));
    });

    test('keeps as many unchanged lines either side as `context` asks for', () {
      final String patch = formatPatch(
        diffText(_before, _after),
        const DiffPatchOptions(context: 1),
      );

      expect(lines(patch).sublist(2, 6), <String>['@@ -3,3 +3,3 @@', ' three', '-four', '+FOUR']);
    });

    test('writes two changes far apart as two hunks', () {
      final String before = List<String>.generate(40, (int i) => 'line $i').join('\n');
      final String after = before
          .replaceFirst('line 2', 'LINE 2')
          .replaceFirst('line 30', 'LINE 30');
      final String patch = formatPatch(diffText(before, after));

      expect(RegExp('@@').allMatches(patch), hasLength(4));
    });

    test('joins two changes whose context would touch into one hunk', () {
      final String before = List<String>.generate(12, (int i) => 'line $i').join('\n');
      final String after = before.replaceFirst('line 4', 'LINE 4').replaceFirst('line 7', 'LINE 7');
      final String patch = formatPatch(diffText(before, after));

      expect(RegExp('@@').allMatches(patch), hasLength(2));
    });

    test('writes everything that went out above everything that came in', () {
      final String patch = formatPatch(diffText('a\nb\nc\n', 'A\nB\nC\n'));

      expect(lines(patch).sublist(3, 9), <String>['-a', '-b', '-c', '+A', '+B', '+C']);
    });
  });

  group('parsePatch', () {
    test('reads a file for each pair of header lines', () {
      const String patch = '''
--- a/one
+++ b/one
@@ -1 +1 @@
-a
+A
--- a/two
+++ b/two
@@ -1 +1 @@
-b
+B
''';
      final List<DiffPatchFile> files = parsePatch(patch);

      expect(files, hasLength(2));
      expect(files.first.before, 'a/one');
      expect(files[1].after, 'b/two');
    });

    test('numbers the lines from the hunk header rather than from the hunk', () {
      const String patch = '''
--- a
+++ b
@@ -10,2 +10,2 @@
-old
+new
''';
      final DiffResult result = parsePatch(patch).single.result;

      expect(result.rows.first.before!.index, 9);
      expect(result.rows.first.after!.index, 9);
    });

    test('leaves a jump in the numbers where one hunk ends and the next begins', () {
      const String patch = '''
--- a
+++ b
@@ -1,1 +1,1 @@
-a
+A
@@ -40,1 +40,1 @@
-b
+B
''';
      final DiffResult result = parsePatch(patch).single.result;

      expect(result.rows.first.before!.index, 0);
      expect(result.rows[1].before!.index, 39);
    });

    test('marks the words inside a pair of changed lines, as the engine would', () {
      const String patch = '''
--- a
+++ b
@@ -1 +1 @@
-the quick brown fox
+the slow brown fox
''';
      final DiffRow row = parsePatch(patch).single.result.rows.first;

      expect(row.before!.segments, isNotEmpty);
      expect(
        row.before!.segments.map((DiffSegment piece) => piece.text).join(),
        'the quick brown fox',
      );
    });

    test('takes the options the engine takes', () {
      const String patch = '''
--- a
+++ b
@@ -1 +1 @@
-the quick fox
+the slow fox
''';
      final DiffRow row = parsePatch(
        patch,
        const DiffOptions(inline: DiffInlineMode.none),
      ).single.result.rows.first;

      expect(row.before!.segments, isEmpty);
    });

    test('counts what the patch carried, and calls the result complete', () {
      const String patch = '''
--- a
+++ b
@@ -1,3 +1,3 @@
 keep
-old
+new
''';
      final DiffResult result = parsePatch(patch).single.result;

      expect(result.stats.unchanged, 1);
      expect(result.stats.changed, 1);
      expect(result.complete, isTrue);
    });

    test('reads an empty line inside a hunk as an unchanged line', () {
      const String patch = '--- a\n+++ b\n@@ -1,3 +1,3 @@\n keep\n\n-old\n+new\n';
      final DiffResult result = parsePatch(patch).single.result;

      expect(result.before, <String>['keep', '', 'old']);
    });

    test('skips the marker for a file that does not end in a newline', () {
      const String patch = '''
--- a
+++ b
@@ -1 +1 @@
-old
\\ No newline at end of file
+new
''';
      final DiffResult result = parsePatch(patch).single.result;

      expect(result.before, <String>['old']);
      expect(result.after, <String>['new']);
    });

    test('reads a patch that is nothing but hunks', () {
      final DiffResult result = parsePatch('@@ -1 +1 @@\n-a\n+b\n').single.result;

      expect(result.rows, hasLength(1));
    });

    test('finds nothing in text that is not a patch', () {
      expect(parsePatch('nothing here\nor here\n'), isEmpty);
    });

    test('comes back to the same rows it started from', () {
      final DiffResult worked = diffText(_before, _after);
      final DiffResult read = parsePatch(formatPatch(worked)).single.result;

      expect(
        read.rows.map((DiffRow row) => '${row.kind.name} ${row.before?.text}').toList(),
        worked.rows.map((DiffRow row) => '${row.kind.name} ${row.before?.text}').toList(),
      );
    });

    test('writes the same patch again from what it read', () {
      final String patch = formatPatch(diffText(_before, _after));
      final DiffPatchFile file = parsePatch(patch).single;

      expect(
        formatPatch(file.result, DiffPatchOptions(before: file.before, after: file.after)),
        patch,
      );
    });
  });
}
