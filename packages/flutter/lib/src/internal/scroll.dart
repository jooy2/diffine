/// Reading a scroll controller that may not have exactly one scroll view on it.
///
/// [ScrollController.offset] and [ScrollController.position] both assert that
/// exactly one scroll view is attached and then read `positions.single`. In a
/// build with the asserts stripped that assertion is gone and the `single`
/// remains, so the same call that reported a clear message in debug throws
/// "Bad state: Too many elements" in release.
///
/// Two panes is exactly the shape that meets it. A comparison replaces its
/// panes whenever the arguments change, and a new scroll view attaches to its
/// controller before the old one is disposed of — so a frame with two positions
/// on one controller is an ordinary frame rather than a mistake, and the honest
/// answer for "how far down is it" in that frame is "ask again next frame".
library;

import 'package:flutter/widgets.dart';

/// The one scroll view on this controller, or `null` where there is not
/// exactly one.
ScrollPosition? scrollPositionOf(ScrollController controller) {
  final Iterable<ScrollPosition> positions = controller.positions;

  return positions.length == 1 ? positions.single : null;
}

/// How far the scroll view has been scrolled, or 0 where there is no one
/// answer.
double scrollOffsetOf(ScrollController controller) {
  return scrollPositionOf(controller)?.pixels ?? 0;
}

/// How tall the part of it a reader can see is, or 0 where there is no one
/// answer.
double scrollViewportOf(ScrollController controller) {
  return scrollPositionOf(controller)?.viewportDimension ?? 0;
}
