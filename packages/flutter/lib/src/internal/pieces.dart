/// A line cut at every boundary the three things that mark it up have.
///
/// The comparison says which runs of the line changed. An application's
/// highlighter says which runs are a keyword, a string, a comment. A search
/// says which runs somebody is looking for. None of the three knows about the
/// others, and their boundaries fall wherever they fall — a searched-for word
/// that is half a string literal and half of it changed is an ordinary thing
/// for all three to say at once. So the line is cut at the union of them, and
/// each piece carries what each had to say about it.
library;

import 'dart:math' as math;

import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// Whether a search found a run, and whether it is the one being read.
enum PieceMatch {
  /// The search found it.
  found,

  /// The search found it and it is the one a reader is on.
  current,
}

/// One run of a line, with everything that decides how it is drawn.
class LinePiece {
  /// One run.
  const LinePiece({required this.text, required this.kind, this.tokenKind, this.style, this.match});

  /// The run itself.
  final String text;

  /// What the comparison said about it.
  final DiffEditKind kind;

  /// What a highlighter said it is, for the theme to colour.
  final DiffineTokenKind? tokenKind;

  /// What a highlighter said to draw it in instead.
  final TextStyle? style;

  /// Whether a search found it.
  final PieceMatch? match;
}

/// A run of a line a search turned up, and whether it is the one a reader is
/// on.
class LineRange {
  /// One match inside one line.
  const LineRange(this.start, this.end, {this.current = false});

  /// Where it starts in the line.
  final int start;

  /// Where it ends, exclusive.
  final int end;

  /// Whether it is the one a reader is on.
  final bool current;
}

/// The line cut at the union of the three, or `null` when there is nothing to
/// say.
///
/// The first two are partitions of the line and the third is not: matches have
/// gaps between them, and the run to the next boundary is the start of the next
/// match while a piece is outside one and its end while a piece is inside one.
///
/// `null` when there is no comparison inside this line, no highlighting and no
/// match, which is the common case and is drawn as the text itself.
List<LinePiece>? splitLine(DiffLine line, List<DiffineToken>? tokens, List<LineRange>? matches) {
  final List<DiffineToken> coloured =
      tokens?.where((DiffineToken token) => token.length > 0).toList() ?? const <DiffineToken>[];
  final List<LineRange> found = matches ?? const <LineRange>[];

  if (line.segments.isEmpty && coloured.isEmpty && found.isEmpty) {
    return null;
  }

  final List<LinePiece> pieces = <LinePiece>[];
  final String text = line.text;
  int segment = 0;
  int token = 0;
  // A number past the end of the line is what makes a line the other list does
  // not reach all the way across still come out whole.
  final int endless = text.length + 1;
  int inSegment = line.segments.isNotEmpty ? line.segments.first.text.length : endless;
  int inToken = coloured.isNotEmpty ? coloured.first.length : endless;
  int cursor = 0;
  int range = 0;

  while (cursor < text.length) {
    final LineRange? here = range < found.length ? found[range] : null;
    final bool inside = here != null && cursor >= here.start;
    final int edge = here == null ? endless : (inside ? here.end : here.start) - cursor;
    final int take = math.min(math.min(inSegment, inToken), math.min(edge, text.length - cursor));

    pieces.add(
      LinePiece(
        text: text.substring(cursor, cursor + take),
        kind: segment < line.segments.length ? line.segments[segment].kind : DiffEditKind.equal,
        tokenKind: token < coloured.length ? coloured[token].kind : null,
        style: token < coloured.length ? coloured[token].style : null,
        match: inside ? (here.current ? PieceMatch.current : PieceMatch.found) : null,
      ),
    );

    cursor += take;
    inSegment -= take;
    inToken -= take;

    if (inside && cursor >= here.end) {
      range += 1;
    }

    if (inSegment == 0) {
      segment += 1;
      inSegment = segment < line.segments.length ? line.segments[segment].text.length : endless;
    }

    if (inToken == 0) {
      token += 1;
      inToken = token < coloured.length ? coloured[token].length : endless;
    }
  }

  return pieces;
}

/// Appends the part of a line's runs that falls between two offsets of it.
void _cutTokens(List<DiffineToken>? tokens, int start, int end, List<DiffineToken> into) {
  int at = 0;

  for (final DiffineToken token in tokens ?? const <DiffineToken>[]) {
    final int from = math.max(at, start);
    final int to = math.min(at + token.length, end);

    if (to > from) {
      into.add(DiffineToken(length: to - from, kind: token.kind, style: token.style));
    }

    at += token.length;

    if (at >= end) {
      return;
    }
  }

  // The runs stopped short of the end, which leaves the rest of the line plain.
  into.add(DiffineToken(length: end - math.max(at, start)));
}

/// The runs a highlighter gave the two lines of a pair, cut to fit the line
/// drawn from both of them.
///
/// A highlighter is only ever handed a whole line of a document, because a
/// grammar applied to a fragment does not come out right — and the drawn line
/// is a line of neither. So each side is coloured on its own and every run of
/// the drawn line takes its colours from the side its text came from: a word
/// that went out the way `before` colours it, and the rest the way `after`
/// does.
List<DiffineToken>? mergeTokens(
  MergedLine merged,
  List<DiffineToken>? before,
  List<DiffineToken>? after,
) {
  if ((before?.isEmpty ?? true) && (after?.isEmpty ?? true)) {
    return null;
  }

  final List<DiffineToken> tokens = <DiffineToken>[];

  for (final MergedRun run in merged.runs) {
    if (run.edit.kind == DiffEditKind.delete) {
      _cutTokens(before, run.edit.beforeStart, run.edit.beforeEnd, tokens);
    } else {
      _cutTokens(after, run.edit.afterStart, run.edit.afterEnd, tokens);
    }
  }

  return tokens;
}

/// Ranges that may overlap, as ranges that do not.
///
/// [splitLine] walks the matches of a line in order and expects each one to
/// start after the last one ended, which a single search over a single line
/// always gives it. A line drawn from two is searched twice, once per side, and
/// a match in one can sit across a match in the other. Where they overlap, the
/// one a reader is on wins.
List<LineRange> disjointRanges(List<LineRange> ranges) {
  final List<int> edges = <int>{
    for (final LineRange range in ranges) ...<int>[range.start, range.end],
  }.toList()..sort();
  final List<LineRange> disjoint = <LineRange>[];

  for (int index = 0; index + 1 < edges.length; index += 1) {
    final int start = edges[index];
    final int end = edges[index + 1];
    final Iterable<LineRange> covering = ranges.where(
      (LineRange range) => range.start <= start && range.end >= end,
    );

    if (covering.isEmpty) {
      continue;
    }

    final bool current = covering.any((LineRange range) => range.current);
    final LineRange? last = disjoint.isEmpty ? null : disjoint.last;

    if (last != null && last.end == start && last.current == current) {
      disjoint.last = LineRange(last.start, end, current: current);
    } else {
      disjoint.add(LineRange(start, end, current: current));
    }
  }

  return disjoint;
}
