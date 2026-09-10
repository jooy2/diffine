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
