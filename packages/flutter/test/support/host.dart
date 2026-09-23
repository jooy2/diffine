import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

/// The smallest thing a widget can be pumped inside.
///
/// A bare [WidgetsApp] rather than a `MaterialApp`, for the same reason nothing
/// in the package imports Material: if a test needed one, the package would
/// need one too.
Widget host(Widget child, {Size size = const Size(900, 480)}) {
  return WidgetsApp(
    color: const Color(0xff000000),
    builder: (BuildContext context, Widget? _) => Directionality(
      textDirection: TextDirection.ltr,
      child: MediaQuery(
        data: const MediaQueryData(size: Size(900, 480)),
        child: Align(
          alignment: Alignment.topLeft,
          child: SizedBox(width: size.width, height: size.height, child: child),
        ),
      ),
    ),
  );
}

/// A window wide enough for the bars of a comparison drawn at twice its size.
///
/// The test typeface draws every letter a full square wide, so a name and the
/// buttons beside it take far more room than they would in any real one, and
/// at twice the size they no longer fit in half of the usual test window.
const Size kWide = Size(1200, 480);

/// Makes the test window [kWide], until the test is over. Pump the widget with
/// `host(widget, size: kWide)` to use all of it.
void widen(WidgetTester tester) {
  tester.view.physicalSize = kWide;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

/// Every label in the semantics tree, which is what a screen reader would be
/// read out.
///
/// The tree rather than the widgets: what matters is the node that reaches
/// assistive technology, and a `Semantics` widget can annotate one without
/// being one.
List<String> semanticsLabels(WidgetTester tester) {
  final List<String> labels = <String>[];

  void visit(RenderObject node) {
    final SemanticsNode? semantics = node.debugSemantics;

    if (semantics != null && semantics.label.isNotEmpty && !labels.contains(semantics.label)) {
      labels.add(semantics.label);
    }

    node.visitChildren(visit);
  }

  for (final RenderView view in tester.binding.renderViews) {
    visit(view);
  }

  return labels;
}
