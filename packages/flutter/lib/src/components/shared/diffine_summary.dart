/// The bar under the panes: what each document weighs, and what happened
/// between them.
///
/// It is laid out on the same grid as the header, so the left half sits under
/// the left pane and the right half under the right one — which is the whole
/// reason each side's size can be written without a word saying which side it
/// belongs to. The counts go at the right end of the right half, where the
/// buttons for moving between changes sit in the bar above.
///
/// What is drawn is a `+`, a `−` and a `~` against three numbers, which are the
/// same three marks the gutter puts beside a line. A reader who has learnt them
/// once has learnt them here, and the bar stays the same width in every
/// language instead of being a sentence that fits in one of them.
///
/// A screen reader is told the sentence rather than the marks. Only that
/// sentence is live: the sizes change on every keystroke, and a bar that read
/// them out as somebody typed would be unusable.
library;

import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/internal/measure.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// How tall the bar is.
const double kSummaryHeight = 28;

/// The bar under a text comparison.
class DiffineSummary extends StatelessWidget {
  /// One bar.
  const DiffineSummary({
    required this.theme,
    required this.before,
    required this.after,
    required this.beforeLabel,
    required this.afterLabel,
    required this.changes,
    required this.inserted,
    required this.deleted,
    required this.linked,
    required this.locale,
    required this.strings,
    super.key,
    this.format,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// The left document, as it stands, for its own end of the bar.
  final String before;

  /// The right document.
  final String after;

  /// What each side is called, which is what its size is announced under.
  final String beforeLabel;

  /// And the other side's name.
  final String afterLabel;

  /// How many changes there are.
  final int changes;

  /// How many lines arrived.
  final int inserted;

  /// How many went away.
  final int deleted;

  /// Whether the column between the panes is drawn, so the bar matches it.
  final bool linked;

  /// The language its numbers are written in.
  final DiffineLocale locale;

  /// The words.
  final DiffineStrings strings;

  /// How each document is written, where the comparison could work it out.
  final DiffDocumentFormat? format;

  @override
  Widget build(BuildContext context) {
    final DocumentSize beforeSize = measureText(before);
    final DocumentSize afterSize = measureText(after);
    final String sentence = changes == 0
        ? strings.identical
        : fill(strings.summary, <String, Object>{
            'changes': changes,
            'inserted': inserted,
            'deleted': deleted,
          });
    final DiffDocumentFormat? written = format;
    final String? difference = written != null && _differs(written.before, written.after)
        ? fill(strings.format, <String, Object>{
            'before': _describe(written.before, strings),
            'after': _describe(written.after, strings),
          })
        : null;

    return Semantics(
      // A node of its own rather than an annotation, so the sentence is
      // something a screen reader can be pointed at rather than something
      // merged into whatever is around it.
      container: true,
      // The children keep nodes of their own, so the live sentence is the
      // sentence and not the sentence with both documents' sizes read out
      // after it — those change on every keystroke.
      explicitChildNodes: true,
      liveRegion: true,
      label: sentence,
      child: Container(
        height: kSummaryHeight,
        decoration: BoxDecoration(
          color: theme.gutter,
          border: Border(top: BorderSide(color: theme.border)),
        ),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: _Metric(
                  theme: theme,
                  icon: DiffineIcon.document,
                  label: beforeLabel,
                  said: fill(strings.documentSize, <String, Object>{
                    'label': beforeLabel,
                    'characters': formatCount(beforeSize.characters, locale),
                    'size': formatBytes(beforeSize.bytes, locale),
                  }),
                  written:
                      '${formatCount(beforeSize.characters, locale)} · '
                      '${formatBytes(beforeSize.bytes, locale)}',
                ),
              ),
            ),
            if (linked) SizedBox(width: theme.linksWidth),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  children: <Widget>[
                    // The size takes whatever the counts leave, so the counts
                    // end at the right-hand edge whether it is long or short. A
                    // size that only asked for the room it needed would leave
                    // the rest of the row empty after the last count, because a
                    // row packs from its start.
                    Expanded(
                      child: Row(
                        children: <Widget>[
                          Flexible(
                            child: _Metric(
                              theme: theme,
                              icon: DiffineIcon.document,
                              label: afterLabel,
                              said: fill(strings.documentSize, <String, Object>{
                                'label': afterLabel,
                                'characters': formatCount(afterSize.characters, locale),
                                'size': formatBytes(afterSize.bytes, locale),
                              }),
                              written:
                                  '${formatCount(afterSize.characters, locale)} · '
                                  '${formatBytes(afterSize.bytes, locale)}',
                            ),
                          ),
                          if (difference != null)
                            Flexible(
                              child: Padding(
                                padding: const EdgeInsets.only(left: 10),
                                child: Text(
                                  difference,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 11, color: theme.muted),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    ExcludeSemantics(
                      child: DiffineTally(
                        theme: theme,
                        changes: changes,
                        inserted: inserted,
                        deleted: deleted,
                        locale: locale,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The three counts at the right end of the bar.
class DiffineTally extends StatelessWidget {
  /// One tally.
  const DiffineTally({
    required this.theme,
    required this.changes,
    required this.inserted,
    required this.deleted,
    required this.locale,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// How many changes there are.
  final int changes;

  /// How many lines arrived.
  final int inserted;

  /// How many went away.
  final int deleted;

  /// The language its numbers are written in.
  final DiffineLocale locale;

  @override
  Widget build(BuildContext context) {
    if (changes == 0) {
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
        _TallyItem(
          theme: theme,
          icon: DiffineIcon.change,
          colour: theme.muted,
          text: formatCount(changes, locale),
        ),
        _TallyItem(
          theme: theme,
          icon: DiffineIcon.insert,
          colour: theme.insertText,
          text: formatCount(inserted, locale),
        ),
        _TallyItem(
          theme: theme,
          icon: DiffineIcon.delete,
          colour: theme.deleteText,
          text: formatCount(deleted, locale),
        ),
      ],
    );
  }
}

class _TallyItem extends StatelessWidget {
  const _TallyItem({
    required this.theme,
    required this.icon,
    required this.colour,
    required this.text,
  });

  final DiffineTheme theme;
  final DiffineIcon icon;
  final Color colour;
  final String text;

  @override
  Widget build(BuildContext context) {
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
}

/// One side's size: the sentence for a screen reader, the numbers for the eye.
class _Metric extends StatelessWidget {
  const _Metric({
    required this.theme,
    required this.icon,
    required this.label,
    required this.said,
    required this.written,
  });

  final DiffineTheme theme;
  final DiffineIcon icon;
  final String label;
  final String said;
  final String written;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: said,
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            DiffineIcons(icon, size: 13, strokeWidth: 1.5, color: theme.muted),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                written,
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

/// Whether two documents with the same lines in them are not the same file.
///
/// A document with no line ending anywhere in it — one line, or nothing at all
/// — is left out. It has no ending to be the wrong one and no last line to be
/// missing one, and saying that a single line differs from a file in how it is
/// written would be true of every single line there has ever been.
bool _differs(DiffFormat before, DiffFormat after) {
  if (before.ending == DiffLineEnding.none || after.ending == DiffLineEnding.none) {
    return false;
  }

  return before.ending != after.ending ||
      before.finalNewline != after.finalNewline ||
      before.byteOrderMark != after.byteOrderMark;
}

/// One document's way of being written, in as few words as it takes.
String _describe(DiffFormat format, DiffineStrings strings) {
  final List<String> parts = <String>[];

  if (format.ending != DiffLineEnding.none) {
    // `CRLF` and `LF` are what every editor calls these, in every language.
    parts.add(
      format.ending == DiffLineEnding.mixed
          ? strings.mixedEndings
          : format.ending.name.toUpperCase(),
    );
  }

  if (format.byteOrderMark) {
    parts.add('BOM');
  }

  if (!format.finalNewline) {
    parts.add(strings.noFinalNewline);
  }

  return parts.join(', ');
}
