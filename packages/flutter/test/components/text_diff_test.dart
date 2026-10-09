import 'dart:ui' show ViewFocusDirection, ViewFocusEvent, ViewFocusState;

import 'package:diffine/diffine.dart';
import 'package:diffine/src/components/shared/diffine_line.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/host.dart';

const String _before = 'one\ntwo\nthree\n';
const String _after = 'one\n2\nthree\nfour\n';

/// Every run of text the widget drew, in the order it drew it.
List<String> drawn(WidgetTester tester) {
  return tester
      .widgetList<Text>(find.byType(Text))
      .map(
        (Text text) => text.data ?? text.textSpan?.toPlainText(includeSemanticsLabels: false) ?? '',
      )
      .toList();
}

/// The line a merged view drew from two, found by the text it shows.
TextSpan mergedLineOf(WidgetTester tester, String shown) {
  return tester
      .widgetList<Text>(find.byType(Text))
      .map((Text text) => text.textSpan)
      .whereType<TextSpan>()
      .firstWhere((TextSpan span) => span.toPlainText(includeSemanticsLabels: false) == shown);
}

/// What Ctrl+A and Ctrl+C put on the clipboard, in one pane of [widget].
///
/// The keys rather than the region's own methods, because it is the keys that
/// reach the actions a reader's copy goes through.
Future<String?> copyAll(WidgetTester tester, Widget widget, {int pane = 0}) async {
  String? copied;

  tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (
    MethodCall call,
  ) async {
    if (call.method == 'Clipboard.setData') {
      copied = (call.arguments as Map<Object?, Object?>)['text']! as String;
    }

    return null;
  });
  addTearDown(
    () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      null,
    ),
  );

  await tester.pumpWidget(host(widget));
  tester
      .widgetList<SelectableRegion>(find.byType(SelectableRegion))
      .elementAt(pane)
      .focusNode!
      .requestFocus();
  await tester.pump();
  await tester.sendKeyDownEvent(LogicalKeyboardKey.controlLeft);
  await tester.sendKeyEvent(LogicalKeyboardKey.keyA);
  await tester.sendKeyEvent(LogicalKeyboardKey.keyC);
  await tester.sendKeyUpEvent(LogicalKeyboardKey.controlLeft);
  await tester.pump();

  return copied;
}

/// What Ctrl+C puts on the clipboard after a mouse drags from one character of
/// a drawn line to another.
///
/// Each end is the text of the line as it is drawn and an offset into it.
Future<String?> copyDragged(
  WidgetTester tester,
  Widget widget, {
  required (String, int) from,
  required (String, int) to,
}) async {
  String? copied;

  tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (
    MethodCall call,
  ) async {
    if (call.method == 'Clipboard.setData') {
      copied = (call.arguments as Map<Object?, Object?>)['text']! as String;
    }

    return null;
  });
  addTearDown(
    () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      null,
    ),
  );

  await tester.pumpWidget(host(widget));

  /// Where a character of a drawn line is on the screen, halfway down it.
  Offset at((String, int) point) {
    final RenderParagraph paragraph = tester.renderObject<RenderParagraph>(
      find.byWidgetPredicate(
        (Widget widget) =>
            widget is RichText &&
            widget.text.toPlainText(includeSemanticsLabels: false) == point.$1,
      ),
    );
    final Offset caret = paragraph.getOffsetForCaret(TextPosition(offset: point.$2), Rect.zero);

    return paragraph.localToGlobal(caret + Offset(0, paragraph.size.height / 2));
  }

  final TestGesture gesture = await tester.startGesture(at(from), kind: PointerDeviceKind.mouse);

  await tester.pump();
  await gesture.moveTo(at(to));
  await tester.pump();
  await gesture.up();
  await tester.pump();

  tester.widget<SelectableRegion>(find.byType(SelectableRegion)).focusNode!.requestFocus();
  await tester.pump();
  await tester.sendKeyDownEvent(LogicalKeyboardKey.controlLeft);
  await tester.sendKeyEvent(LogicalKeyboardKey.keyC);
  await tester.sendKeyUpEvent(LogicalKeyboardKey.controlLeft);
  await tester.pump();

  return copied;
}

/// How tall one drawn line of a document is.
double lineHeightOf(WidgetTester tester) {
  return tester.getSize(find.byType(DiffineLineWidget).first).height;
}

/// How large the button in the bar above the panes that moves to the next
/// change is.
Size nextButtonOf(WidgetTester tester) {
  return tester.getSize(find.bySemanticsLabel('Next change'));
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

  testWidgets('draws an edited line once in a merged view', (WidgetTester tester) async {
    await tester.pumpWidget(
      host(
        const TextDiff(
          before: 'alpha\nthe quick fox\ncharlie\n',
          after: 'alpha\nthe slow fox\ncharlie\n',
          view: DiffineView.merged,
        ),
      ),
    );

    final List<String> lines = drawn(tester);

    expect(mergedLineOf(tester, 'the quickslow fox'), isNotNull);
    expect(lines, isNot(contains('the quick fox')));
    expect(lines, isNot(contains('the slow fox')));
  });

  testWidgets('strikes out what went out of a merged line', (WidgetTester tester) async {
    await tester.pumpWidget(
      host(
        const TextDiff(before: 'the quick fox', after: 'the slow fox', view: DiffineView.merged),
      ),
    );

    final TextSpan line = mergedLineOf(tester, 'the quickslow fox');
    final List<TextSpan> runs = line.children!.cast<TextSpan>();

    expect(runs.map((TextSpan run) => run.text), <String>['the ', 'quick', 'slow', ' fox']);
    expect(runs[1].style?.decoration, TextDecoration.lineThrough);
    expect(runs[2].style?.decoration, isNot(TextDecoration.lineThrough));
    expect(runs[1].semanticsLabel, 'Removed: quick');
    expect(runs[2].semanticsLabel, 'Added: slow');
  });

  testWidgets('draws a change with nothing marked inside it the unified way', (
    WidgetTester tester,
  ) async {
    Future<List<String>> linesOf(DiffineView view) async {
      await tester.pumpWidget(
        host(
          TextDiff(
            before: _before,
            after: _after,
            view: view,
            diff: const DiffOptions(inline: DiffInlineMode.none),
          ),
        ),
      );

      return drawn(tester);
    }

    expect(await linesOf(DiffineView.merged), await linesOf(DiffineView.unified));
  });

  testWidgets('copies a merged line as the line it is now', (WidgetTester tester) async {
    final String? copied = await copyAll(
      tester,
      const TextDiff(before: 'the quick fox', after: 'the slow fox', view: DiffineView.merged),
    );

    expect(copied, 'the slow fox');
  });

  testWidgets('copies several lines with a line break between each', (WidgetTester tester) async {
    final String? copied = await copyAll(
      tester,
      const TextDiff(
        before: 'one\nthe quick fox',
        after: 'one\nthe slow fox',
        view: DiffineView.unified,
      ),
    );

    expect(copied, 'one\nthe quick fox\nthe slow fox');
  });

  testWidgets('copies the lines around a merged one as the document has them', (
    WidgetTester tester,
  ) async {
    final String? copied = await copyAll(
      tester,
      const TextDiff(
        before: 'one\nthe quick fox\nend',
        after: 'one\nthe slow fox\nend',
        view: DiffineView.merged,
      ),
    );

    expect(copied, 'one\nthe slow fox\nend');
  });

  testWidgets('copies each side of a split view as its own document', (WidgetTester tester) async {
    const TextDiff comparison = TextDiff(before: 'one\ntwo', after: 'one\ntwo\nthree');

    // The left pane has a blank opposite `three`, which is in neither document.
    expect(await copyAll(tester, comparison), 'one\ntwo');
    expect(await copyAll(tester, comparison, pane: 1), 'one\ntwo\nthree');
  });

  testWidgets('copies a selection dragged across lines from where it starts to where it ends', (
    WidgetTester tester,
  ) async {
    final String? copied = await copyDragged(
      tester,
      const TextDiff(
        before: 'alpha\nthe quick fox',
        after: 'alpha\nthe slow fox',
        view: DiffineView.unified,
      ),
      from: ('alpha', 2),
      to: ('the quick fox', 6),
    );

    expect(copied, 'pha\nthe qu');
  });

  testWidgets('stops a selection that ends in what went out where that run was', (
    WidgetTester tester,
  ) async {
    // `quick` went out and `slow` came in, so a selection that ends inside
    // `quick` ends in front of `slow`.
    final String? copied = await copyDragged(
      tester,
      const TextDiff(
        before: 'alpha\nthe quick fox',
        after: 'alpha\nthe slow fox',
        view: DiffineView.merged,
      ),
      from: ('alpha', 2),
      to: ('the quickslow fox', 6),
    );

    expect(copied, 'pha\nthe ');
  });

  testWidgets('keeps an empty line of the document in what it copies', (WidgetTester tester) async {
    final String? copied = await copyAll(
      tester,
      const TextDiff(before: 'a\n\nb', after: 'a\n\nc', view: DiffineView.unified),
    );

    expect(copied, 'a\n\nb\nc');
  });

  testWidgets('keeps the focus in the pane when the window gains it from a click there', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    final FocusNode pane = tester
        .widget<SelectableRegion>(find.byType(SelectableRegion).first)
        .focusNode!;

    // A click in a pane of a page that did not have the keyboard: the pane
    // asks for the focus, and the window, gaining it as a result, hands it to
    // whatever comes first, which is the button for the previous change.
    pane.requestFocus();
    await tester.pump();
    tester.binding.handleViewFocusChanged(
      ViewFocusEvent(
        viewId: tester.view.viewId,
        state: ViewFocusState.focused,
        direction: ViewFocusDirection.forward,
      ),
    );
    await tester.pump();

    expect(pane.hasPrimaryFocus, isTrue);
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

  testWidgets('draws its text and its controls at the scale it was given', (
    WidgetTester tester,
  ) async {
    widen(tester);
    await tester.pumpWidget(
      host(
        const TextDiff(before: _before, after: _after),
        size: kWide,
      ),
    );

    final double line = lineHeightOf(tester);
    final Size button = nextButtonOf(tester);

    // The default is the size the theme says, and nothing multiplied.
    expect(line, DiffineTheme.light.lineHeight);

    for (final double scale in <double>[2, 0.875]) {
      await tester.pumpWidget(
        host(
          TextDiff(before: _before, after: _after, scale: scale),
          size: kWide,
        ),
      );

      expect(lineHeightOf(tester), line * scale, reason: 'scale $scale');
      expect(nextButtonOf(tester), button * scale, reason: 'scale $scale');
    }
  });

  testWidgets('multiplies a typeface the application passed rather than replacing it', (
    WidgetTester tester,
  ) async {
    widen(tester);
    await tester.pumpWidget(
      host(
        const TextDiff(
          before: _before,
          after: _after,
          font: DiffineFont(size: 15, lineHeight: 20),
          scale: 1.5,
        ),
        size: kWide,
      ),
    );

    expect(lineHeightOf(tester), 30);
    expect(tester.widget<Text>(find.text('four')).textSpan?.style?.fontSize, 22.5);
  });

  testWidgets('leaves the box it is drawn in the size it was', (WidgetTester tester) async {
    widen(tester);
    await tester.pumpWidget(
      host(
        const TextDiff(before: _before, after: _after),
        size: kWide,
      ),
    );

    final Size box = tester.getSize(find.byType(TextDiff));

    await tester.pumpWidget(
      host(
        const TextDiff(before: _before, after: _after, scale: 2),
        size: kWide,
      ),
    );

    expect(tester.getSize(find.byType(TextDiff)), box);
  });

  testWidgets('lays an editor\'s field where a viewer draws its text, at any scale', (
    WidgetTester tester,
  ) async {
    // The field is laid over lines that are painted rather than built, and the
    // two only read as one if they start at the same place. A viewer's line is
    // a widget that can be measured, and the painted one is drawn to match it.
    widen(tester);

    for (final double scale in <double>[1, 2]) {
      await tester.pumpWidget(
        host(
          TextDiff(
            key: const ValueKey<String>('viewer'),
            before: 'one\n',
            after: 'two\n',
            scale: scale,
          ),
          size: kWide,
        ),
      );

      final double text = tester.getTopLeft(find.text('one').first).dx;

      await tester.pumpWidget(
        host(
          TextDiff(
            key: const ValueKey<String>('editor'),
            mode: DiffineMode.editor,
            before: 'one\n',
            after: 'two\n',
            scale: scale,
          ),
          size: kWide,
        ),
      );

      expect(tester.getTopLeft(find.byType(EditableText).first).dx, text, reason: 'scale $scale');
    }
  });

  testWidgets('draws a scale that is not a positive number at the default size', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    final double line = lineHeightOf(tester);
    final Size button = nextButtonOf(tester);

    for (final double scale in <double>[0, -1, double.nan, double.infinity]) {
      await tester.pumpWidget(host(TextDiff(before: _before, after: _after, scale: scale)));

      expect(lineHeightOf(tester), line, reason: 'scale $scale');
      expect(nextButtonOf(tester), button, reason: 'scale $scale');
      expect(tester.takeException(), isNull, reason: 'scale $scale');
    }
  });
}
