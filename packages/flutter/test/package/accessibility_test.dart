/// What a reader who is not looking at the screen is told.
///
/// A comparison's whole meaning is in its colours, so every one of them has to
/// be said in words somewhere: which side a pane is, what happened to a line,
/// how many changes there are, and what each control does.
library;

import 'dart:typed_data';

import 'package:diffine/diffine.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/host.dart';

const String _before = 'one\ntwo\nthree\n';
const String _after = 'one\n2\nthree\nfour\n';

DiffinePixelImage plain(int width, int height, List<int> colour) {
  final Uint8List data = Uint8List(width * height * 4);

  for (int pixel = 0; pixel < width * height; pixel += 1) {
    data.setRange(pixel * 4, pixel * 4 + 4, colour);
  }

  return DiffinePixelImage(DiffPixels(data: data, width: width, height: height));
}

void main() {
  testWidgets('names each pane after the document it holds', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(
      host(
        const TextDiff(before: _before, after: _after, beforeLabel: 'saved', afterLabel: 'draft'),
      ),
    );

    expect(semanticsLabels(tester), contains('saved'));
    expect(semanticsLabels(tester), contains('draft'));
    handle.dispose();
  });

  testWidgets('says in words what happened to each line', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    final List<String> labels = semanticsLabels(tester);

    expect(labels.any((String label) => label.startsWith('Changed')), isTrue);
    expect(labels.any((String label) => label.startsWith('Added')), isTrue);
    handle.dispose();
  });

  testWidgets('says it in the language it was given', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(
      host(const TextDiff(before: _before, after: _after, locale: DiffineLocale.ko)),
    );

    final List<String> labels = semanticsLabels(tester);

    expect(labels.any((String label) => label.startsWith('변경됨')), isTrue);
    handle.dispose();
  });

  testWidgets('names every control in the bar above the panes', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    final List<String> labels = semanticsLabels(tester);

    expect(labels, contains('Previous change'));
    expect(labels, contains('Next change'));
    expect(labels, contains('Find in Before'));
    expect(labels, contains('Find in After'));
    handle.dispose();
  });

  testWidgets('names every control in the search bar', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));
    await tester.tap(find.bySemanticsLabel('Find in Before'));
    await tester.pump();

    final List<String> labels = semanticsLabels(tester);

    expect(labels, contains('Match case'));
    expect(labels, contains('Whole word'));
    expect(labels, contains('Regular expression'));
    expect(labels, contains('Close find'));
    handle.dispose();
  });

  testWidgets('names each field of an editor after its side', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(
      host(
        const TextDiff(
          mode: DiffineMode.editor,
          defaultBefore: 'one\n',
          defaultAfter: 'two\n',
          beforeLabel: 'saved',
          afterLabel: 'draft',
        ),
      ),
    );

    final List<String> labels = semanticsLabels(tester);

    expect(labels.any((String label) => label.contains('saved')), isTrue);
    expect(labels.any((String label) => label.contains('draft')), isTrue);
    handle.dispose();
  });

  testWidgets('names a folded band by what opening it would show', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    final String before = '${List<String>.generate(40, (int index) => 'line $index').join('\n')}\n';

    await tester.pumpWidget(
      host(TextDiff(before: before, after: before.replaceFirst('line 20', 'X'), collapse: true)),
    );

    expect(semanticsLabels(tester), contains('Show 17 unchanged lines'));
    handle.dispose();
  });

  testWidgets('names each pane of a picture comparison', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(host(const ImageDiff(beforeLabel: 'saved', afterLabel: 'rendered')));

    final List<String> labels = semanticsLabels(tester);

    expect(labels.any((String label) => label.contains('saved')), isTrue);
    expect(labels.any((String label) => label.contains('rendered')), isTrue);
    handle.dispose();
  });

  testWidgets('names the zoom controls of a picture comparison', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(host(const ImageDiff()));

    final List<String> labels = semanticsLabels(tester);

    expect(labels, contains('Zoom in'));
    expect(labels, contains('Zoom out'));
    expect(labels, contains('Fit to the pane'));
    handle.dispose();
  });

  testWidgets('meets the guidelines for tap targets, contrast and labels', (
    WidgetTester tester,
  ) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await tester.pumpWidget(host(const TextDiff(before: _before, after: _after)));

    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    handle.dispose();
  });
}
