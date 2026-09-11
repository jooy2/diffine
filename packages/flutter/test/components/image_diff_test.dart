import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:diffine/diffine.dart';
import 'package:diffine/src/components/image/image_diff_pane.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/host.dart';

/// A flat picture of one colour, which is all these tests need to compare.
DiffinePixelImage plain(int width, int height, List<int> colour) {
  final Uint8List data = Uint8List(width * height * 4);

  for (int pixel = 0; pixel < width * height; pixel += 1) {
    data.setRange(pixel * 4, pixel * 4 + 4, colour);
  }

  return DiffinePixelImage(DiffPixels(data: data, width: width, height: height));
}

final DiffinePixelImage white = plain(8, 8, <int>[255, 255, 255, 255]);
final DiffinePixelImage red = plain(8, 8, <int>[255, 0, 0, 255]);

/// The same picture as the bytes of a PNG file, which is how one usually
/// arrives: read off a disk, out of a picker, or off a response.
Future<DiffineEncodedImage> encoded(DiffinePixelImage source) async {
  final DiffPixels pixels = source.pixels;
  final Completer<ui.Image> drawn = Completer<ui.Image>();

  ui.decodeImageFromPixels(
    pixels.data,
    pixels.width,
    pixels.height,
    ui.PixelFormat.rgba8888,
    drawn.complete,
  );

  final ui.Image image = await drawn.future;
  final ByteData? file = await image.toByteData(format: ui.ImageByteFormat.png);

  image.dispose();

  return DiffineEncodedImage(file!.buffer.asUint8List(file.offsetInBytes, file.lengthInBytes));
}

/// Pumps a comparison and lets the pictures actually arrive.
///
/// Decoding is asynchronous by nature and a widget test's clock is not, so the
/// waiting goes through [WidgetTester.runAsync], which is the one place a test
/// is allowed a real event loop. Only the waiting: pumping a frame from inside
/// it is what the harness asks nobody to do, and under `--platform chrome` it
/// is a test that never finishes rather than one that fails.
Future<void> pumpPictures(WidgetTester tester, Widget widget) async {
  await tester.pumpWidget(widget);

  for (int pass = 0; pass < 6; pass += 1) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 20)));
    await tester.pump();
  }
}

void main() {
  testWidgets('says there is nothing to compare before a picture arrives', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(host(const ImageDiff()));

    expect(find.text('Nothing to compare yet.'), findsWidgets);
  });

  testWidgets('names each side above it', (WidgetTester tester) async {
    await tester.pumpWidget(host(const ImageDiff(beforeLabel: 'saved', afterLabel: 'rendered')));

    expect(find.text('saved'), findsOneWidget);
    expect(find.text('rendered'), findsOneWidget);
  });

  testWidgets('compares two pictures and reports what it found', (WidgetTester tester) async {
    DiffImageResult? reported;

    await pumpPictures(
      tester,
      host(
        ImageDiff(
          before: white,
          after: red,
          onDiff: (DiffImageResult? result) => reported = result,
        ),
      ),
    );

    expect(reported, isNotNull);
    expect(reported!.stats.changed, 64);
    expect(reported!.regions, isNotEmpty);
  });

  testWidgets('writes each picture size under its own pane', (WidgetTester tester) async {
    await pumpPictures(tester, host(ImageDiff(before: white, after: red)));

    expect(find.textContaining('8 × 8'), findsNWidgets(2));
  });

  testWidgets('steps to the next change when the button is pressed', (WidgetTester tester) async {
    int? moved;

    await pumpPictures(
      tester,
      host(
        ImageDiff(
          before: white,
          after: red,
          onSelectedChanged: (int selected, DiffImageRegion? region) => moved = selected,
        ),
      ),
    );

    await tester.tap(find.bySemanticsLabel('Next change'));
    await tester.pump();

    expect(moved, 0);
  });

  testWidgets('zooms in and out from the buttons', (WidgetTester tester) async {
    DiffineImageViewport? looked;

    await pumpPictures(
      tester,
      host(
        ImageDiff(
          before: white,
          after: red,
          onViewportChanged: (DiffineImageViewport viewport) => looked = viewport,
        ),
      ),
    );

    await tester.tap(find.bySemanticsLabel('Zoom in'));
    await tester.pump();

    final double zoomed = looked!.scale;

    await tester.tap(find.bySemanticsLabel('Zoom out'));
    await tester.pump();

    expect(looked!.scale, lessThan(zoomed));
  });

  testWidgets('draws one pane for the views that lay the two over each other', (
    WidgetTester tester,
  ) async {
    await pumpPictures(
      tester,
      host(
        ImageDiff(
          before: white,
          after: red,
          view: DiffineImageView.wipe,
          beforeLabel: 'saved',
          afterLabel: 'rendered',
        ),
      ),
    );

    expect(find.text('saved → rendered'), findsOneWidget);
  });

  testWidgets('draws the panes whatever is being done with the unchanged parts', (
    WidgetTester tester,
  ) async {
    // What each of the three does is painted, and a painted answer is read with
    // an eye rather than with a test. What is checked here is that asking for
    // one draws a comparison and builds whatever it needs to.
    for (final DiffineImageUnchanged unchanged in DiffineImageUnchanged.values) {
      await pumpPictures(
        tester,
        host(
          ImageDiff(
            before: white,
            after: red,
            unchanged: unchanged,
            beforeLabel: 'saved',
            afterLabel: 'rendered',
          ),
        ),
      );

      expect(find.text('saved'), findsOneWidget, reason: unchanged.name);
      expect(tester.takeException(), isNull, reason: unchanged.name);
    }
  });

  testWidgets('shows the pixels under the pointer, from both sides at once', (
    WidgetTester tester,
  ) async {
    await pumpPictures(
      tester,
      host(ImageDiff(before: white, after: red, beforeLabel: 'saved', afterLabel: 'rendered')),
    );

    expect(find.textContaining('At '), findsNothing);

    final TestPointer mouse = TestPointer(1, PointerDeviceKind.mouse);
    final Offset over = tester.getCenter(find.byType(ImageDiffPane).first);

    await tester.sendEventToBinding(mouse.hover(over));
    await tester.pumpAndSettle();

    // Both sides, whichever pane the pointer is over, and the point of the
    // frame it is on.
    expect(find.textContaining('At '), findsOneWidget);
    expect(find.text('saved'), findsWidgets);
    expect(find.text('rendered'), findsWidgets);
  });

  testWidgets('draws a pane per picture when it is given a list', (WidgetTester tester) async {
    await pumpPictures(
      tester,
      host(
        ImageDiff(
          pictures: <DiffineImageContent>[white, red, white],
          pictureLabels: const <String>['saved', 'chrome', 'firefox'],
        ),
      ),
    );

    expect(find.byType(ImageDiffPane), findsNWidgets(3));
    expect(find.text('saved'), findsOneWidget);
    expect(find.text('chrome'), findsOneWidget);
    expect(find.text('firefox'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('names a picture of a list that arrived without one', (WidgetTester tester) async {
    await pumpPictures(tester, host(ImageDiff(pictures: <DiffineImageContent>[white, red, white])));

    expect(find.text('Picture 1'), findsOneWidget);
    expect(find.text('Picture 3'), findsOneWidget);
  });

  testWidgets('reports the comparison of a list through its own callback', (
    WidgetTester tester,
  ) async {
    DiffImagesResult? reported;

    await pumpPictures(
      tester,
      host(
        ImageDiff(
          pictures: <DiffineImageContent>[white, red, white],
          onPicturesDiff: (DiffImagesResult? result) => reported = result,
        ),
      ),
    );
    await tester.pumpAndSettle();

    // The second picture is the only one that disagrees, and its bit is the
    // second one.
    expect(reported, isNotNull);
    expect(reported!.mask[0], 2);
    expect(reported!.stats.apart, <int>[0, 64, 0]);
  });

  testWidgets('marks and boxes what a list changed, not a pair that is not there', (
    WidgetTester tester,
  ) async {
    int? moved;

    await pumpPictures(
      tester,
      host(
        ImageDiff(
          pictures: <DiffineImageContent>[white, red, white],
          onSelectedChanged: (int selected, DiffImageRegion? region) => moved = selected,
        ),
      ),
    );

    // Both the marks and the changes used to be read off the comparison of two
    // pictures, which a list does not have one of — so a list was drawn plain,
    // with nothing tinted over it and nothing to step through.
    final List<ImageDiffPane> panes = tester
        .widgetList<ImageDiffPane>(find.byType(ImageDiffPane))
        .toList();

    expect(panes, hasLength(3));
    expect(panes.every((ImageDiffPane pane) => pane.mask != null), isTrue);

    await tester.tap(find.bySemanticsLabel('Next change'));
    await tester.pump();

    expect(moved, 0);
  });

  testWidgets('lays a list of more than two out in panes whatever the view asks for', (
    WidgetTester tester,
  ) async {
    await pumpPictures(
      tester,
      host(
        ImageDiff(pictures: <DiffineImageContent>[white, red, white], view: DiffineImageView.wipe),
      ),
    );

    // Wiping one picture across another is a question about two of them.
    expect(find.byType(ImageDiffPane), findsNWidgets(3));
  });

  testWidgets('moves the line between the two pictures', (WidgetTester tester) async {
    double? wiped;

    await pumpPictures(
      tester,
      host(
        ImageDiff(
          before: white,
          after: red,
          view: DiffineImageView.wipe,
          onWipeChanged: (double value) => wiped = value,
        ),
      ),
    );

    await tester.drag(find.bySemanticsLabel('Drag to wipe between the two'), const Offset(80, 0));
    await tester.pump();

    expect(wiped, greaterThan(0.5));
  });

  testWidgets('asks the application for a picture rather than opening a file', (
    WidgetTester tester,
  ) async {
    DiffineSide? asked;

    await tester.pumpWidget(
      host(
        ImageDiff(
          mode: DiffineMode.editor,
          onChoose: (DiffineSide side) async {
            asked = side;

            return red;
          },
        ),
      ),
    );

    await tester.tap(find.text('Choose an image').first);
    await tester.pump();

    expect(asked, isNotNull);
  });

  testWidgets('says the two are the same when they are', (WidgetTester tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();

    await pumpPictures(tester, host(ImageDiff(before: white, after: white)));

    expect(semanticsLabels(tester), contains('The two are the same.'));
    handle.dispose();
  });

  testWidgets('opens a picture that arrived as the bytes of a file', (WidgetTester tester) async {
    DiffImageResult? reported;

    final DiffineEncodedImage first = (await tester.runAsync(() => encoded(white)))!;
    final DiffineEncodedImage second = (await tester.runAsync(() => encoded(red)))!;

    await pumpPictures(
      tester,
      host(
        ImageDiff(
          before: first,
          after: second,
          onDiff: (DiffImageResult? result) => reported = result,
        ),
      ),
    );

    expect(find.text('That file is not an image.'), findsNothing);
    expect(reported, isNotNull);
    expect(reported!.width, 8);
    expect(reported!.height, 8);
    expect(reported!.stats.changed, 64);
  });
}
