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
    required this.pictures,
    required this.changed,
    required this.regions,
    required this.complete,
    required this.compared,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// Whether the panes are side by side, so the bar is cut into as many parts.
  final bool split;

  /// The language its numbers are written in.
  final DiffineLocale locale;

  /// The words.
  final DiffineStrings strings;

  /// One entry a picture, in the order the panes are drawn, with `null` for a
  /// pane that has none.
  final List<ImageMetrics?> pictures;

  /// How much of the frame moved, from 0 to 1.
  final double changed;

  /// How many areas that is.
  final int regions;

  /// Whether that count is all of them.
  final bool complete;

  /// Whether there is a comparison at all.
  final bool compared;

  @override
  Widget build(BuildContext context) {
    // Nothing has been compared, so there is nothing to say about it — and
    // "they are the same" is not the thing to say about panes that are still
    // empty.
    final String sentence = !compared
        ? ''
        : changed == 0
        ? strings.identical
        : fill(strings.imageSummary, <String, Object>{
            'regions': formatCount(regions, locale),
            'percent': formatNumber(changed * 100, locale),
          });

    final Widget tally = !compared ? const SizedBox.shrink() : ExcludeSemantics(child: _tally());

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
        // One part of the bar per pane, so that each picture's size is written
        // under the picture it belongs to. A view that draws every picture in
        // one pane has one part, and the sizes run along it.
        //
        // The sizes take whatever the counts leave rather than only the room
        // they need, which is what holds the counts against the right-hand
        // edge: a row packs from its start, so anything a size does not use
        // would otherwise be left empty after the last count.
        child: split
            ? Row(
                children: <Widget>[
                  for (int at = 0; at < pictures.length; at += 1)
                    Expanded(
                      child: _metrics(<Widget>[
                        Expanded(child: _metric(pictures[at])),
                        if (at == pictures.length - 1) tally,
                      ]),
                    ),
                ],
              )
            : _metrics(<Widget>[
                Expanded(
                  child: Row(
                    children: <Widget>[
                      for (int at = 0; at < pictures.length; at += 1) ...<Widget>[
                        if (at > 0) const SizedBox(width: 12),
                        Flexible(child: _metric(pictures[at])),
                      ],
                    ],
                  ),
                ),
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

  Widget _tally() {
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
          '${formatCount(regions, locale)}${complete ? '' : '+'}',
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
            // The size of a picture gives way to the counts beside it, because
            // a count cut in half is a wrong number and a size cut in half is a
            // shorter one.
            Flexible(
              child: Text(
                '$width × $height · $size',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 11, color: theme.muted),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
