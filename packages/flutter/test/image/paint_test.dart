import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/image/paint.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

/// A pane zoomed far into a frame with one change the size of the whole of it,
/// which is what two pictures with nothing in common come out as.
PaneOptions zoomedIn({required double x, required double y}) {
  return PaneOptions(
    frame: const Size(100, 100),
    viewport: DiffineImageViewport(scale: 32, x: x, y: y),
    layers: const <Layer>[],
    regions: const <DiffImageRegion>[
      DiffImageRegion(x: 0, y: 0, width: 100, height: 100, pixels: 10000),
    ],
    current: -1,
    theme: DiffineTheme.light,
  );
}

/// The ends of every dash, from the one call that draws them all.
List<Offset> dashesOf(TestRecordingCanvas canvas) {
  final RecordedInvocation drawn = canvas.invocations.singleWhere(
    (RecordedInvocation call) => call.invocation.memberName == #drawRawPoints,
  );
  final Float32List points = drawn.invocation.positionalArguments[1] as Float32List;

  return <Offset>[for (int at = 0; at < points.length; at += 2) Offset(points[at], points[at + 1])];
}

void main() {
  const Size pane = Size(400, 300);

  test('draws a pane zoomed far in with a handful of calls', () {
    final TestRecordingCanvas canvas = TestRecordingCanvas();

    // The pane is near the top-left corner of the frame, so two sides of the
    // box and the edge of the chequer are in it.
    paintPane(canvas, pane, zoomedIn(x: 5, y: 4));

    // The chequer was a square apiece and the box a dash apiece, over all of a
    // frame that is 3,200 pixels on a side at this zoom: some eighty thousand
    // calls a frame.
    expect(canvas.invocations.length, lessThan(20));
  });

  test('draws only the dashes the pane can show', () {
    final TestRecordingCanvas canvas = TestRecordingCanvas();

    paintPane(canvas, pane, zoomedIn(x: 5, y: 4));

    // A pixel either side of the pane, and a hair more, because a rectangle
    // does not contain the points on its right and bottom edges.
    final Rect visible = (Offset.zero & pane).inflate(1.001);
    final List<Offset> ends = dashesOf(canvas);

    expect(ends, isNotEmpty);
    expect(ends.every(visible.contains), isTrue);

    for (int at = 0; at < ends.length; at += 2) {
      expect((ends[at + 1] - ends[at]).distance, lessThanOrEqualTo(4 + 1e-6));
    }
  });

  test('keeps the dashes where they are on the box when the pane moves', () {
    final TestRecordingCanvas still = TestRecordingCanvas();
    final TestRecordingCanvas moved = TestRecordingCanvas();

    // The box's corner is off the left of the pane, so the pane cuts its top
    // side, and moving the pane by half a dash and its gap is what tells a
    // pattern counted from the corner from one counted from the cut.
    paintPane(still, pane, zoomedIn(x: 10, y: 4));
    paintPane(moved, pane, zoomedIn(x: 10.125, y: 4));

    // The top side of the box, in the first pane's coordinates.
    List<double> starts(TestRecordingCanvas canvas, double shift) {
      final List<Offset> ends = dashesOf(canvas);

      return <double>[
        for (int at = 0; at < ends.length; at += 2)
          if (ends[at].dy == ends[at + 1].dy && ends[at].dx < ends[at + 1].dx) ends[at].dx + shift,
      ];
    }

    final List<double> before = starts(still, 0);
    final List<double> after = starts(moved, 4);

    // The dashes the two share, which is all of them but the ones the edges of
    // the pane cut.
    expect(before.length, greaterThan(20));
    expect(after.where(before.contains).length, greaterThan(before.length - 3));
  });

  test('draws the chequer with one fill, anchored to the frame', () {
    final TestRecordingCanvas canvas = TestRecordingCanvas();

    paintPane(canvas, pane, zoomedIn(x: 5, y: 4));

    final List<RecordedInvocation> fills = canvas.invocations
        .where(
          (RecordedInvocation call) =>
              call.invocation.memberName == #drawRect &&
              (call.invocation.positionalArguments[1] as Paint).shader is ui.ImageShader,
        )
        .toList();

    expect(fills, hasLength(1));

    final Rect filled = fills.single.invocation.positionalArguments[0] as Rect;

    // The frame starts inside the pane, so the fill starts where it does and
    // stops at the pane's own edge rather than at the frame's.
    expect(filled.topLeft, const Offset(200 - 5 * 32, 150 - 4 * 32));
    expect(filled.bottomRight, Offset(pane.width, pane.height));
  });
}
