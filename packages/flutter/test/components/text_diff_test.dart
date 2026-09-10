import 'package:diffine/diffine.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/host.dart';

const String _before = 'one\ntwo\nthree\n';
const String _after = 'one\n2\nthree\nfour\n';

/// Every run of text the widget drew, in the order it drew it.
List<String> drawn(WidgetTester tester) {
  return tester
      .widgetList<Text>(find.byType(Text))
      .map((Text text) => text.data ?? text.textSpan?.toPlainText() ?? '')
      .toList();
}

void main() {
  testWidgets('draws both documents side by side', (WidgetTester tester) async {
    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    final List<String> lines = drawn(tester);

    expect(lines, contains('one'));
    expect(lines, contains('two'));
    expect(lines, contains('2'));
    expect(lines, contains('four'));
  });

  testWidgets('names each side above it', (WidgetTester tester) async {
    await tester.pumpWidget(
      host(const TextDiff(before: _before, after: _after, beforeLabel: 'v1', afterLabel: 'v2')),
    );

    expect(find.text('v1'), findsOneWidget);
    expect(find.text('v2'), findsOneWidget);
  });

  testWidgets('says so when there is nothing to compare', (WidgetTester tester) async {
    await tester.pumpWidget(host(const TextDiff()));

    expect(find.text('Nothing to compare yet.'), findsOneWidget);
  });

  testWidgets('speaks the language it was given', (WidgetTester tester) async {
    await tester.pumpWidget(host(const TextDiff(locale: DiffineLocale.ko)));

    expect(find.text('아직 비교할 내용이 없습니다.'), findsOneWidget);
  });

  testWidgets('draws the numbers down the side, and takes them away', (WidgetTester tester) async {
    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after, summary: false)));
    expect(find.text('3'), findsWidgets);

    await tester.pumpWidget(
      host(const TextDiff(before: _before, after: _after, summary: false, lineNumbers: false)),
    );
    expect(find.text('3'), findsNothing);
  });

  testWidgets('draws a marker beside a changed line, and takes it away', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));
    expect(find.text('~'), findsWidgets);

    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after, markers: false)));
    expect(find.text('~'), findsNothing);
  });

  testWidgets('draws one column in a unified view', (WidgetTester tester) async {
    // Words rather than digits, so that a line number is never mistaken for a
    // line.
    await tester.pumpWidget(
      host(
        const TextDiff(
          before: 'alpha\nbravo\ncharlie\n',
          after: 'alpha\nBRAVO\ncharlie\n',
          view: DiffineView.unified,
        ),
      ),
    );

    final List<String> lines = drawn(tester);

    // Everything that went out above everything that came in, in one column.
    expect(lines.indexOf('bravo'), lessThan(lines.indexOf('BRAVO')));
  });

  testWidgets('counts the changes in the bar under the panes', (WidgetTester tester) async {
    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    // One replace and one insert.
    expect(find.text('2'), findsWidgets);
  });

  testWidgets('says the two are the same when they are', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(host(const TextDiff(before: _before, after: _before)));

    expect(semanticsLabels(tester), contains('The two are the same.'));
    handle.dispose();
  });

  testWidgets('reads the counts out as a sentence', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    expect(semanticsLabels(tester), contains('2 changes, 2 lines added, 1 lines removed'));
    handle.dispose();
  });

  testWidgets('says how the two documents are written where that differs', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(host(const TextDiff(before: 'a\nb\n', after: 'a\r\nb\r\n')));

    expect(find.text('LF → CRLF'), findsOneWidget);
  });

  testWidgets('draws the connectors, and takes them away', (WidgetTester tester) async {
    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));
    expect(find.byType(CustomPaint), findsWidgets);

    await tester.pumpWidget(
      host(const TextDiff(before: _before, after: _after, connectors: false)),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
  });

  testWidgets('takes a palette of its own', (WidgetTester tester) async {
    await tester.pumpWidget(
      host(
        TextDiff(
          before: _before,
          after: _after,
          theme: DiffineTheme.dark.copyWith(insertLine: const Color(0xff00ff00)),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
  });

  testWidgets('writes one side of a change into the other', (WidgetTester tester) async {
    String? written;

    await tester.pumpWidget(
      host(
        TextDiff(
          mode: DiffineMode.editor,
          applyChanges: true,
          readOnly: DiffineSide.before,
          defaultBefore: 'one\ntwo\n',
          defaultAfter: 'one\n2\n',
          onAfterChanged: (String value) => written = value,
        ),
      ),
    );

    await tester.tap(find.bySemanticsLabel('Take this change into After'));
    await tester.pump();

    expect(written, 'one\ntwo\n');
  });

  testWidgets('hands the comparison on once it has been worked out', (WidgetTester tester) async {
    DiffResult? reported;

    await tester.pumpWidget(
      host(
        TextDiff(before: _before, after: _after, onDiff: (DiffResult result) => reported = result),
      ),
    );
    await tester.pump();

    expect(reported, isNotNull);
    expect(reported!.changes, hasLength(2));
  });

  testWidgets('draws a comparison it was handed rather than working one out', (
    WidgetTester tester,
  ) async {
    final DiffResult given = parsePatch(
      '--- a\n+++ b\n@@ -1 +1 @@\n-from a patch\n+from a patch, changed\n',
    ).single.result;

    await tester.pumpWidget(host(TextDiff(result: given)));

    expect(drawn(tester), contains('from a patch'));
  });

  testWidgets('steps to the next change when the button is pressed', (WidgetTester tester) async {
    int? moved;

    await tester.pumpWidget(
      host(
        TextDiff(
          before: _before,
          after: _after,
          onSelectedChanged: (int selected, DiffChange? change) => moved = selected,
        ),
      ),
    );

    await tester.tap(find.bySemanticsLabel('Next change'));
    await tester.pump();

    expect(moved, 0);
  });

  testWidgets('opens the search bar from the button above the pane', (WidgetTester tester) async {
    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    expect(find.byType(EditableText), findsNothing);

    await tester.tap(find.bySemanticsLabel('Find in Before'));
    await tester.pump();

    expect(find.byType(EditableText), findsOneWidget);
    expect(find.bySemanticsLabel('Close find'), findsOneWidget);
  });

  testWidgets('takes what a reader typed into an editor', (WidgetTester tester) async {
    String? typed;

    await tester.pumpWidget(
      host(
        TextDiff(
          mode: DiffineMode.editor,
          defaultBefore: 'one\n',
          defaultAfter: 'one\n',
          onAfterChanged: (String value) => typed = value,
        ),
      ),
    );

    await tester.enterText(find.byType(EditableText).last, 'two\n');
    await tester.pump();

    expect(typed, 'two\n');
  });

  testWidgets('draws a field for each side of an editor', (WidgetTester tester) async {
    await tester.pumpWidget(
      host(const TextDiff(mode: DiffineMode.editor, defaultBefore: 'one\n', defaultAfter: 'two\n')),
    );

    expect(find.byType(EditableText), findsNWidgets(2));
  });

  testWidgets('colours the documents as the language it was given', (WidgetTester tester) async {
    await tester.pumpWidget(
      host(
        const TextDiff(before: 'const a = 1;\n', after: 'const a = 2;\n', language: 'javascript'),
      ),
    );

    expect(find.text('JavaScript'), findsOneWidget);
  });

  testWidgets('draws what the application put in the gutter', (WidgetTester tester) async {
    await tester.pumpWidget(
      host(
        TextDiff(
          before: _before,
          after: _after,
          renderGutter: (DiffLine line, DiffineSide side) =>
              side == DiffineSide.after && line.index == 0
              ? const SizedBox(width: 12, child: Text('!'))
              : const SizedBox(width: 12),
        ),
      ),
    );

    expect(find.text('!'), findsOneWidget);
  });

  testWidgets('folds the lines nobody edited, and puts them back', (WidgetTester tester) async {
    final String before = '${List<String>.generate(40, (int index) => 'line $index').join('\n')}\n';
    final String after = before.replaceFirst('line 20', 'X');

    await tester.pumpWidget(host(TextDiff(before: before, after: after, collapse: true)));

    expect(find.textContaining('unchanged lines'), findsWidgets);

    await tester.tap(find.bySemanticsLabel(RegExp('Show 17 unchanged lines')).first);
    await tester.pump();

    expect(drawn(tester), contains('line 0'));
  });
}
