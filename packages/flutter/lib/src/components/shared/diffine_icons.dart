/// The marks the widgets draw beside their own controls.
///
/// Drawn rather than imported. Seven paths are not worth a dependency, and an
/// icon package is a second thing an application would have to install for a
/// widget that otherwise arrives as one import.
///
/// They take their colour from the button they sit in and are hidden from a
/// screen reader, which is told what the button does by the button.
library;

import 'package:flutter/widgets.dart';

/// Which mark to draw.
enum DiffineIcon {
  /// The next thing is below.
  chevronDown,

  /// The next thing is above.
  chevronUp,

  /// A change taken to the left.
  arrowLeft,

  /// A change taken to the right.
  arrowRight,

  /// Looking for something, which is what opens the search bar.
  magnifier,

  /// Done with it, which is what closes the search bar.
  cross,

  /// Smaller.
  minus,

  /// Larger.
  plus,

  /// The whole thing at once.
  frame,

  /// The four ways something can be dragged, for the handle that moves a panel.
  move,

  /// The corner a panel is pulled larger by.
  grip,

  /// A document, for the size written under a pane.
  document,

  /// A picture, for the same.
  picture,

  /// The `~` the gutter puts beside a changed line.
  change,

  /// The `+`.
  insert,

  /// The `−`.
  delete,

  /// A box round a change, for the count of them.
  region,

  /// Nothing changed.
  identical,
}

/// One of the marks, at text size and in the colour around it.
class DiffineIcons extends StatelessWidget {
  /// One mark.
  const DiffineIcons(this.icon, {super.key, this.size = 14, this.strokeWidth = 1.75, this.color});

  /// Which mark.
  final DiffineIcon icon;

  /// How large it is drawn, in logical pixels.
  final double size;

  /// How thick its lines are.
  final double strokeWidth;

  /// What it is drawn in. The surrounding text colour where nothing is given.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final Color paint =
        color ?? DefaultTextStyle.of(context).style.color ?? const Color(0xff000000);

    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _IconPainter(icon: icon, colour: paint, strokeWidth: strokeWidth),
        isComplex: false,
      ),
    );
  }
}

/// Every mark, on the same sixteen-unit square the React package draws them on.
///
/// A list of sub-paths, each a list of commands. `m` moves, `l` draws, `q`
/// curves, and `o` is a circle — which is the whole of the vocabulary these
/// need.
const Map<DiffineIcon, List<List<Object>>> _paths = <DiffineIcon, List<List<Object>>>{
  DiffineIcon.chevronDown: <List<Object>>[
    <Object>['m', 3.5, 6.0, 'l', 8.0, 10.5, 'l', 12.5, 6.0],
  ],
  DiffineIcon.chevronUp: <List<Object>>[
    <Object>['m', 3.5, 10.0, 'l', 8.0, 5.5, 'l', 12.5, 10.0],
  ],
  DiffineIcon.arrowLeft: <List<Object>>[
    <Object>['m', 12.5, 8.0, 'l', 3.5, 8.0],
    <Object>['m', 7.0, 3.5, 'l', 2.5, 8.0, 'l', 7.0, 12.5],
  ],
  DiffineIcon.arrowRight: <List<Object>>[
    <Object>['m', 3.5, 8.0, 'l', 12.5, 8.0],
    <Object>['m', 9.0, 3.5, 'l', 13.5, 8.0, 'l', 9.0, 12.5],
  ],
  DiffineIcon.magnifier: <List<Object>>[
    <Object>['o', 7.0, 7.0, 4.25],
    <Object>['m', 10.25, 10.25, 'l', 13.5, 13.5],
  ],
  DiffineIcon.cross: <List<Object>>[
    <Object>['m', 4.0, 4.0, 'l', 12.0, 12.0],
    <Object>['m', 12.0, 4.0, 'l', 4.0, 12.0],
  ],
  DiffineIcon.minus: <List<Object>>[
    <Object>['m', 3.5, 8.0, 'l', 12.5, 8.0],
  ],
  DiffineIcon.plus: <List<Object>>[
    <Object>['m', 8.0, 3.5, 'l', 8.0, 12.5],
    <Object>['m', 3.5, 8.0, 'l', 12.5, 8.0],
  ],
  DiffineIcon.move: <List<Object>>[
    <Object>['m', 8.0, 2.5, 'l', 8.0, 13.5],
    <Object>['m', 2.5, 8.0, 'l', 13.5, 8.0],
    <Object>['m', 6.0, 4.5, 'l', 8.0, 2.5, 'l', 10.0, 4.5],
    <Object>['m', 6.0, 11.5, 'l', 8.0, 13.5, 'l', 10.0, 11.5],
    <Object>['m', 4.5, 6.0, 'l', 2.5, 8.0, 'l', 4.5, 10.0],
    <Object>['m', 11.5, 6.0, 'l', 13.5, 8.0, 'l', 11.5, 10.0],
  ],
  DiffineIcon.grip: <List<Object>>[
    <Object>['m', 13.0, 6.0, 'l', 6.0, 13.0],
    <Object>['m', 13.0, 10.5, 'l', 10.5, 13.0],
  ],
  DiffineIcon.frame: <List<Object>>[
    <Object>['m', 3.0, 6.0, 'l', 3.0, 3.0, 'l', 6.0, 3.0],
    <Object>['m', 13.0, 6.0, 'l', 13.0, 3.0, 'l', 10.0, 3.0],
    <Object>['m', 3.0, 10.0, 'l', 3.0, 13.0, 'l', 6.0, 13.0],
    <Object>['m', 13.0, 10.0, 'l', 13.0, 13.0, 'l', 10.0, 13.0],
  ],
  DiffineIcon.document: <List<Object>>[
    <Object>[
      'm',
      4.5,
      2.5,
      'l',
      9.5,
      2.5,
      'l',
      12.0,
      5.0,
      'l',
      12.0,
      13.5,
      'l',
      4.5,
      13.5,
      'l',
      4.5,
      2.5,
    ],
    <Object>['m', 9.5, 2.5, 'l', 9.5, 5.0, 'l', 12.0, 5.0],
  ],
  DiffineIcon.picture: <List<Object>>[
    <Object>['m', 2.5, 3.5, 'l', 13.5, 3.5, 'l', 13.5, 12.5, 'l', 2.5, 12.5, 'l', 2.5, 3.5],
    <Object>['m', 2.5, 10.0, 'l', 5.5, 7.0, 'l', 8.5, 10.0],
    <Object>['m', 8.0, 9.5, 'l', 10.0, 7.5, 'l', 13.5, 11.0],
  ],
  DiffineIcon.change: <List<Object>>[
    <Object>['m', 2.5, 9.5, 'q', 5.25, 5.5, 8.0, 9.5, 'q', 10.75, 13.5, 13.5, 9.5],
  ],
  DiffineIcon.insert: <List<Object>>[
    <Object>['m', 8.0, 3.5, 'l', 8.0, 12.5],
    <Object>['m', 3.5, 8.0, 'l', 12.5, 8.0],
  ],
  DiffineIcon.delete: <List<Object>>[
    <Object>['m', 3.5, 8.0, 'l', 12.5, 8.0],
  ],
  DiffineIcon.region: <List<Object>>[
    <Object>['m', 2.5, 5.5, 'l', 2.5, 2.5, 'l', 5.5, 2.5],
    <Object>['m', 13.5, 5.5, 'l', 13.5, 2.5, 'l', 10.5, 2.5],
    <Object>['m', 2.5, 10.5, 'l', 2.5, 13.5, 'l', 5.5, 13.5],
    <Object>['m', 13.5, 10.5, 'l', 13.5, 13.5, 'l', 10.5, 13.5],
  ],
  DiffineIcon.identical: <List<Object>>[
    <Object>['m', 3.5, 8.5, 'l', 6.5, 11.5, 'l', 12.5, 4.5],
  ],
};

class _IconPainter extends CustomPainter {
  const _IconPainter({required this.icon, required this.colour, required this.strokeWidth});

  final DiffineIcon icon;
  final Color colour;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final double unit = size.width / 16;
    final Paint brush = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = colour
      ..isAntiAlias = true;
    final Path path = Path();

    for (final List<Object> shape in _paths[icon]!) {
      int at = 0;

      while (at < shape.length) {
        final String command = shape[at] as String;

        switch (command) {
          case 'm':
            path.moveTo((shape[at + 1] as double) * unit, (shape[at + 2] as double) * unit);
            at += 3;
          case 'l':
            path.lineTo((shape[at + 1] as double) * unit, (shape[at + 2] as double) * unit);
            at += 3;
          case 'q':
            path.quadraticBezierTo(
              (shape[at + 1] as double) * unit,
              (shape[at + 2] as double) * unit,
              (shape[at + 3] as double) * unit,
              (shape[at + 4] as double) * unit,
            );
            at += 5;
          case 'o':
            path.addOval(
              Rect.fromCircle(
                center: Offset((shape[at + 1] as double) * unit, (shape[at + 2] as double) * unit),
                radius: (shape[at + 3] as double) * unit,
              ),
            );
            at += 4;
          default:
            at = shape.length;
        }
      }
    }

    canvas.drawPath(path, brush);
  }

  @override
  bool shouldRepaint(_IconPainter old) {
    return old.icon != icon || old.colour != colour || old.strokeWidth != strokeWidth;
  }
}
