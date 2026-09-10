/// The bar under the panes: how large each picture is, and how much of it
/// moved.
///
/// The same bar the text comparison draws, counting different things. Each side
/// writes its own size under its own pane, which is what makes
/// "1536 × 1024, 240 KB" a complete sentence with no word saying whose it is,
/// and the counts go at the right-hand end where the buttons for stepping
/// through the changes sit in the bar above.
///
/// A share rather than a count of pixels. Nobody knows what forty thousand
/// pixels means, and everybody knows what two per cent of a picture means — the
/// number of areas beside it is what says whether that two per cent is one
/// thing or forty.
library;

import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/components/shared/diffine_summary.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/internal/measure.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// One picture's own numbers, for the end of the bar that belongs to it.
class ImageMetrics {
  /// One picture's numbers.
  const ImageMetrics({
    required this.label,
    required this.width,
    required this.height,
    required this.bytes,
  });

  /// What that side is called.
  final String label;

  /// How wide it is.
  final int width;

  /// How tall.
  final int height;

  /// What it weighs.
  final int bytes;
}

/// The bar under a picture comparison.
class ImageDiffSummary extends StatelessWidget {
  /// One bar.
  const ImageDiffSummary({
    required this.theme,
    required this.split,
    required this.locale,
    required this.strings,
    super.key,
    this.before,
    this.after,
    this.result,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// Whether the panes are side by side, so the bar is halved as they are.
  final bool split;

  /// The language its numbers are written in.
  final DiffineLocale locale;

  /// The words.
  final DiffineStrings strings;

  /// The left picture's numbers, or `null` while there is no picture.
  final ImageMetrics? before;

  /// The right one's.
  final ImageMetrics? after;

  /// The comparison, or `null` while there are not two pictures to compare.
  final DiffImageResult? result;

  @override
  Widget build(BuildContext context) {
    final DiffImageResult? found = result;
    final double changed = found?.stats.ratio ?? 0;
    // Nothing has been compared, so there is nothing to say about it — and
    // "the two are the same" is not the thing to say about two panes that are
    // still empty.
    final String sentence = found == null
        ? ''
        : changed == 0
        ? strings.identical
        : fill(strings.imageSummary, <String, Object>{
            'regions': formatCount(found.regions.length, locale),
            'percent': formatNumber(changed * 100, locale),
          });

    final Widget tally = found == null
        ? const SizedBox.shrink()
        : ExcludeSemantics(child: _tally(found, changed));

    return Semantics(
      container: true,
      explicitChildNodes: true,
      liveRegion: true,
      label: sentence,
      child: Container(
        height: kSummaryHeight,
        decoration: BoxDecoration(
          color: theme.gutter,
          border: Border(top: BorderSide(color: theme.border)),
        ),
        child: split
            ? Row(
                children: <Widget>[
                  Expanded(child: _metrics(<Widget>[_metric(before)])),
                  Expanded(child: _metrics(<Widget>[_metric(after), const Spacer(), tally])),
                ],
              )
            : _metrics(<Widget>[
                _metric(before),
                const SizedBox(width: 12),
                _metric(after),
                const Spacer(),
                tally,
              ]),
      ),
    );
  }

  Widget _metrics(List<Widget> children) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Row(children: children),
    );
  }

  Widget _tally(DiffImageResult found, double changed) {
    if (changed == 0) {
      return DiffineIcons(
        DiffineIcon.identical,
        size: 13,
        strokeWidth: 1.5,
        color: theme.insertText,
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _item(
          DiffineIcon.region,
          theme.muted,
          '${formatCount(found.regions.length, locale)}${found.complete ? '' : '+'}',
        ),
        _item(DiffineIcon.change, theme.muted, '${formatNumber(changed * 100, locale)}%'),
      ],
    );
  }

  Widget _item(DiffineIcon icon, Color colour, String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 10),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          DiffineIcons(icon, size: 13, strokeWidth: 1.5, color: colour),
          const SizedBox(width: 3),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: colour,
              fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _metric(ImageMetrics? picture) {
    if (picture == null) {
      return const SizedBox.shrink();
    }

    final String width = formatCount(picture.width, locale);
    final String height = formatCount(picture.height, locale);
    final String size = formatBytes(picture.bytes, locale);
    final String said = fill(strings.imageSize, <String, Object>{
      'label': picture.label,
      'width': width,
      'height': height,
      'size': size,
    });

    return Semantics(
      label: said,
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            DiffineIcons(DiffineIcon.picture, size: 13, strokeWidth: 1.5, color: theme.muted),
            const SizedBox(width: 4),
            Text('$width × $height · $size', style: TextStyle(fontSize: 11, color: theme.muted)),
          ],
        ),
      ),
    );
  }
}
