/// Where a reader is looking, and the arithmetic that moves them.
///
/// A viewport is three numbers — how far in, and the point of the frame the
/// middle of the pane is on — and everything a reader can do to a picture is
/// one of these functions applied to those three. Keeping it that small is what
/// lets two panes share one: a split view is not two pictures being scrolled in
/// step, it is two panes drawing the same viewport, so there is nothing to keep
/// in step in the first place.
///
/// A centre rather than a corner, because a centre is what stays still. Zooming
/// about the top-left corner sends whatever a reader was looking at off the
/// edge; zooming about a point keeps that point under the pointer, and both
/// fall out of the same two lines below.
library;

import 'dart:math' as math;

import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// How much one press of a zoom button changes the scale.
const double kZoomStep = 1.6;

/// As far out as a reader can go.
const double kMinScale = 0.02;

/// And as far in.
const double kMaxScale = 64;

double _clamp(double value, double least, double most) {
  return math.min(math.max(value, least), most);
}

/// The scale at which the whole frame is in the pane, with a little room round
/// it.
double fitScale(Size frame, Size pane) {
  if (frame.width <= 0 || frame.height <= 0 || pane.width <= 0 || pane.height <= 0) {
    return 1;
  }

  return _clamp(
    math.min(pane.width / frame.width, pane.height / frame.height),
    kMinScale,
    kMaxScale,
  );
}

/// The whole frame, in the middle of the pane.
DiffineImageViewport fitViewport(Size frame, Size pane) {
  return DiffineImageViewport(
    scale: fitScale(frame, pane),
    x: frame.width / 2,
    y: frame.height / 2,
  );
}

/// A viewport nobody can lose the picture out of.
///
/// The centre is held inside the frame rather than the frame inside the pane. A
/// picture smaller than the pane it is in would otherwise be dragged to the
/// middle and pinned there, which is not what a reader comparing the corner of
/// two screenshots wants.
DiffineImageViewport clampViewport(DiffineImageViewport viewport, Size frame) {
  return DiffineImageViewport(
    scale: _clamp(viewport.scale, kMinScale, kMaxScale),
    x: _clamp(viewport.x, 0, frame.width),
    y: _clamp(viewport.y, 0, frame.height),
  );
}

/// Where a point of the pane, measured from its top-left corner, is in the
/// frame.
Offset frameAt(DiffineImageViewport viewport, Size pane, double paneX, double paneY) {
  return Offset(
    viewport.x + (paneX - pane.width / 2) / viewport.scale,
    viewport.y + (paneY - pane.height / 2) / viewport.scale,
  );
}

/// Where a point of the frame is in the pane.
Offset paneAt(DiffineImageViewport viewport, Size pane, double frameX, double frameY) {
  return Offset(
    pane.width / 2 + (frameX - viewport.x) * viewport.scale,
    pane.height / 2 + (frameY - viewport.y) * viewport.scale,
  );
}

/// The same view at a different scale, with one point of the pane left where it
/// was.
///
/// That point is the pointer for a wheel, and the middle of the pane for a
/// button. Both are the same move: work out what the point is looking at,
/// change the scale, and shift the centre so it is looking at it still.
DiffineImageViewport zoomAbout({
  required DiffineImageViewport viewport,
  required Size frame,
  required Size pane,
  required double scale,
  required double paneX,
  required double paneY,
}) {
  final Offset held = frameAt(viewport, pane, paneX, paneY);
  final double next = _clamp(scale, kMinScale, kMaxScale);

  return clampViewport(
    DiffineImageViewport(
      scale: next,
      x: held.dx - (paneX - pane.width / 2) / next,
      y: held.dy - (paneY - pane.height / 2) / next,
    ),
    frame,
  );
}

/// The same view, moved by a number of the pane's own pixels.
DiffineImageViewport panBy(DiffineImageViewport viewport, Size frame, double paneX, double paneY) {
  return clampViewport(
    DiffineImageViewport(
      scale: viewport.scale,
      x: viewport.x - paneX / viewport.scale,
      y: viewport.y - paneY / viewport.scale,
    ),
    frame,
  );
}

/// How much of the pane a change has to fill for a reader to be looking at it.
const double _smallestShown = 0.08;
const double _largestShown = 0.9;

/// The view moved onto a rectangle, at a scale that shows it.
///
/// Which is not always a change of scale. A reader who has zoomed to four
/// hundred per cent to look at one change and then steps to the next one wants
/// the next one at four hundred per cent — undoing their zoom on every step
/// would make the buttons useless for the thing they are for. So the scale is
/// left alone whenever the change is already a comfortable size in the pane,
/// and only a change too small to see or too large to fit moves it.
///
/// Where it does move, it lands on the change with as much again around it. A
/// box drawn tight against the edges of a pane is a box a reader cannot see the
/// edges of.
DiffineImageViewport viewportOn({
  required DiffineImageViewport viewport,
  required Size frame,
  required Size pane,
  required DiffImageArea area,
}) {
  final double enough = fitScale(
    Size(math.max(area.width, 1) * 2, math.max(area.height, 1) * 2),
    pane,
  );
  final double shown = math.max(
    pane.width > 0 ? area.width * viewport.scale / pane.width : 0,
    pane.height > 0 ? area.height * viewport.scale / pane.height : 0,
  );
  final bool comfortable = shown >= _smallestShown && shown <= _largestShown;

  return clampViewport(
    DiffineImageViewport(
      scale: comfortable ? viewport.scale : enough,
      x: area.x + area.width / 2,
      y: area.y + area.height / 2,
    ),
    frame,
  );
}
