/// A comparison written out as a patch, and a patch read back as a comparison.
///
/// The point of it is that neither side has to hold both documents. A server, a
/// build or a hook already has `git diff` in its hands, and sending that
/// instead of two files is the difference between a few kilobytes and a few
/// megabytes — so [parsePatch] turns what arrives into exactly what [diffText]
/// would have returned, and the viewer cannot tell the two apart.
/// [formatPatch] is the way back out: the comparison a screen is looking at, in
/// the format every other tool already reads.
///
/// The format is the unified diff, which is what `diff -u`, `git diff` and
/// every code host write. What it does not carry, this does not invent: a patch
/// has no idea what the lines it left out say, and it says nothing about the
/// line endings of the file it came from.
library;

import 'dart:math' as math;

import 'package:diffine/src/diff.dart';
import 'package:diffine/src/internal/diff/gap.dart';
import 'package:diffine/src/internal/diff/text.dart';
import 'package:diffine/src/types.dart';

/// The `@@ -1,4 +1,5 @@` that opens a hunk, with the count left off where it
/// is one.
final RegExp _hunk = RegExp(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@');

/// Every line ending, for splitting a patch that came from anywhere.
final RegExp _breaks = RegExp(r'\r\n|\r|\n');

/// A run of rows one hunk covers, as a half-open interval.
class _Hunk {
  _Hunk(this.start, this.end);

  final int start;
  int end;
}

/// Which rows each hunk covers: every changed row, and `context` unchanged rows
/// either side of it.
///
/// Two changes close enough for their context to touch become one hunk rather
/// than two, which is what keeps a patch from repeating the same lines twice.
List<_Hunk> _hunksOf(List<DiffRow> rows, int context) {
  final List<_Hunk> hunks = <_Hunk>[];
  int index = 0;

  while (index < rows.length) {
    if (rows[index].kind == DiffRowKind.equal) {
      index += 1;
      continue;
    }

    int end = index + 1;

    while (end < rows.length && rows[end].kind != DiffRowKind.equal) {
      end += 1;
    }

    int start = index;

    for (
      int taken = 0;
      taken < context && start > 0 && follows(rows[start - 1], rows[start]);
      taken += 1
    ) {
      start -= 1;
    }

    for (
      int taken = 0;
      taken < context && end < rows.length && follows(rows[end - 1], rows[end]);
      taken += 1
    ) {
      end += 1;
    }

    final _Hunk? last = hunks.isEmpty ? null : hunks.last;
    // Touching at the seam is not the same as running on through it: a
    // comparison read back out of a patch has hunks that end where the next one
    // begins in the list and forty lines apart in the document.
    final bool joins =
        last != null && start <= last.end && (start == 0 || follows(rows[start - 1], rows[start]));

    if (joins) {
      last.end = math.max(last.end, end);
    } else {
      hunks.add(_Hunk(start, end));
    }

    index = end;
  }

  return hunks;
}

/// Where one side of a hunk starts in its own document, and how many lines it
/// holds.
class _Side {
  const _Side(this.start, this.count);

  final int start;
  final int count;
}

_Side _sideOf(List<DiffRow> rows, _Hunk hunk, DiffineSide side) {
  int start = -1;
  int count = 0;

  for (int index = hunk.start; index < hunk.end; index += 1) {
    final DiffLine? line = rows[index].side(side);

    if (line != null) {
      count += 1;

      if (start < 0) {
        start = line.index;
      }
    }
  }

  if (start >= 0) {
    return _Side(start, count);
  }

  // A hunk that holds nothing of this side at all — a run of lines that were
  // only inserted, read from the other document's side. The number a patch
  // writes there is how many lines of this one come before it.
  for (int index = hunk.start - 1; index >= 0; index -= 1) {
    final DiffLine? line = rows[index].side(side);

    if (line != null) {
      return _Side(line.index + 1, 0);
    }
  }

  return const _Side(0, 0);
}

/// One side of a hunk header: `4,7`, or `4` where it is a single line.
String _range(int start, int count) {
  if (count == 0) {
    return '$start,0';
  }

  return count == 1 ? '${start + 1}' : '${start + 1},$count';
}

/// A comparison as a unified diff.
///
/// ```dart
/// final String patch = formatPatch(
///   diffText(saved, draft),
///   const DiffPatchOptions(before: 'a/lib/main.dart', after: 'b/lib/main.dart'),
/// );
/// ```
///
/// Two documents that turned out to be the same give an empty string rather
/// than a header with nothing under it, so the value itself says whether there
/// was anything to write.
///
/// The lines are written as they were compared, which is where whitespace that
/// was being ignored comes back: a comparison run with [DiffWhitespace.all]
/// still writes out the line a change actually touched. A patch produced from a
/// comparison that gave up — [DiffResult.complete] being `false` — is a patch
/// that replaces the range wholesale, because that is what the comparison
/// found.
String formatPatch(DiffResult result, [DiffPatchOptions? options]) {
  final DiffPatchOptions settled = options ?? const DiffPatchOptions();
  final int context = math.max(0, settled.context);
  final List<_Hunk> hunks = _hunksOf(result.rows, context);

  if (hunks.isEmpty) {
    return '';
  }

  final List<String> out = <String>['--- ${settled.before}', '+++ ${settled.after}'];

  for (final _Hunk hunk in hunks) {
    final _Side before = _sideOf(result.rows, hunk, DiffineSide.before);
    final _Side after = _sideOf(result.rows, hunk, DiffineSide.after);

    out.add(
      '@@ -${_range(before.start, before.count)} '
      '+${_range(after.start, after.count)} @@',
    );

    int index = hunk.start;

    while (index < hunk.end) {
      final DiffRow row = result.rows[index];

      if (row.kind == DiffRowKind.equal) {
        out.add(' ${(row.before ?? row.after)?.text ?? ''}');
        index += 1;
        continue;
      }

      // Everything that went out, and then everything that came in. A patch has
      // no pairs in it, which is the one place the two shapes disagree: the
      // rows hold a changed line opposite the line it replaced, and a reader of
      // a patch expects the removals above the additions.
      int end = index;

      while (end < hunk.end && result.rows[end].kind != DiffRowKind.equal) {
        end += 1;
      }

      for (int row = index; row < end; row += 1) {
        final DiffLine? line = result.rows[row].before;

        if (line != null) {
          out.add('-${line.text}');
        }
      }

      for (int row = index; row < end; row += 1) {
        final DiffLine? line = result.rows[row].after;

        if (line != null) {
          out.add('+${line.text}');
        }
      }

      index = end;
    }
  }

  return '${out.join('\n')}\n';
}

/// The path off a `---` or `+++` line, with the timestamp some tools append
/// taken off.
String _pathOf(String line) {
  return line.substring(4).split('\t').first.trim();
}

/// One file's worth of a patch, filled in as its hunks are read.
class _Building {
  _Building(this.before, this.after);

  final String before;
  final String after;
  final List<String> beforeLines = <String>[];
  final List<String> afterLines = <String>[];
  final List<DiffRow> rows = <DiffRow>[];
  final List<DiffChange> changes = <DiffChange>[];
  final RunningStats stats = RunningStats();

  DiffPatchFile get settled => DiffPatchFile(
    before: before,
    after: after,
    result: DiffResult(
      before: beforeLines,
      after: afterLines,
      rows: rows,
      changes: changes,
      stats: stats.settled,
      // A patch is what it says it is. There was no search to give up on.
      complete: true,
    ),
  );
}

/// A unified diff, read back as one comparison per file it covers.
///
/// ```dart
/// final DiffPatchFile file = parsePatch(await response.body).first;
///
/// TextDiff(result: file.result, beforeLabel: file.before, afterLabel: file.after);
/// ```
///
/// What comes back is the same value [diffText] returns, worked out the same
/// way down to the words marked inside a pair of changed lines — the second
/// argument is the same set of options, so a screen that reads patches and a
/// screen that compares documents can be told to mark the same things.
///
/// It covers less, and that is the format rather than the reader: a patch holds
/// the changed lines and a few either side of each of them, so the line numbers
/// jump where one hunk ends and the next begins. [DiffResult.before] holds the
/// lines the patch carried rather than the whole document, while each line's
/// [DiffLine.index] is still its own number in the file it came from.
///
/// Anything the format puts around the hunks is skipped rather than read: the
/// `diff --git` line, the mode and index lines, a mail header, and the
/// `\ No newline at end of file` marker, which a comparison has nowhere to put.
List<DiffPatchFile> parsePatch(String patch, [DiffOptions? options]) {
  final TextOptions settled = settleOptions(options);
  final List<String> lines = patch.split(_breaks);

  // The newline that ends a patch is the end of its last line rather than the
  // start of an empty one, and an empty line inside a hunk is a line of the
  // file. Leaving it on would put it in whichever hunk ran to the end.
  if (lines.isNotEmpty && lines.last.isEmpty) {
    lines.removeLast();
  }

  final List<DiffPatchFile> files = <DiffPatchFile>[];

  _Building? file;
  // Where the hunk being read has got to in each document, and how much of it
  // its header said is left. Both counts at zero is "not inside a hunk".
  int beforeLine = 0;
  int afterLine = 0;
  int beforeLeft = 0;
  int afterLeft = 0;
  List<String> removed = <String>[];
  List<String> added = <String>[];
  int removedStart = 0;
  int addedStart = 0;

  /// The run of removed and added lines that has just ended, as a change.
  void flush() {
    final _Building? held = file;

    if (held == null || (removed.isEmpty && added.isEmpty)) {
      return;
    }

    final int rowStart = held.rows.length;
    final ChangeRows built = changeRows(removed, added, removedStart, addedStart, settled);

    held.rows.addAll(built.rows);
    countRows(built.rows, held.stats);
    held.changes.add(
      DiffChange(
        kind: built.kind,
        beforeStart: removedStart,
        beforeEnd: removedStart + removed.length,
        afterStart: addedStart,
        afterEnd: addedStart + added.length,
        rowStart: rowStart,
        rowEnd: held.rows.length,
      ),
    );

    removed = <String>[];
    added = <String>[];
  }

  void close() {
    flush();
    beforeLeft = 0;
    afterLeft = 0;
  }

  /// Closes whatever file was being read and starts the next one.
  _Building opened(String before, String after) {
    close();

    final _Building? held = file;

    if (held != null) {
      files.add(held.settled);
    }

    return _Building(before, after);
  }

  for (int index = 0; index < lines.length; index += 1) {
    final String line = lines[index];

    if (beforeLeft > 0 || afterLeft > 0) {
      final String marker = line.isEmpty ? '' : line[0];
      final String text = line.isEmpty ? '' : line.substring(1);

      if (marker == r'\') {
        // `\ No newline at end of file`. It describes the line above rather
        // than being one, and a comparison has nowhere to keep it.
        continue;
      }

      if (marker == '-') {
        if (removed.isEmpty && added.isEmpty) {
          removedStart = beforeLine;
          addedStart = afterLine;
        }

        removed.add(text);
        file?.beforeLines.add(text);
        beforeLine += 1;
        beforeLeft -= 1;
        continue;
      }

      if (marker == '+') {
        if (removed.isEmpty && added.isEmpty) {
          removedStart = beforeLine;
          addedStart = afterLine;
        }

        added.add(text);
        file?.afterLines.add(text);
        afterLine += 1;
        afterLeft -= 1;
        continue;
      }

      // A context line, which is also what an empty line is: a tool that
      // trimmed the trailing whitespace off the patch left the leading space
      // off a line that had nothing after it.
      if (marker == ' ' || line.isEmpty) {
        flush();

        final _Building? held = file;

        if (held != null) {
          held.rows.add(
            DiffRow(
              kind: DiffRowKind.equal,
              before: DiffLine(index: beforeLine, text: text),
              after: DiffLine(index: afterLine, text: text),
            ),
          );
          held.stats.unchanged += 1;
          held.beforeLines.add(text);
          held.afterLines.add(text);
        }

        beforeLine += 1;
        afterLine += 1;
        beforeLeft -= 1;
        afterLeft -= 1;
        continue;
      }

      // Anything else ends the hunk early, whatever its header claimed. The
      // line is read again as one of the lines that sit around a hunk.
      close();
      index -= 1;
      continue;
    }

    if (line.startsWith('--- ') &&
        index + 1 < lines.length &&
        lines[index + 1].startsWith('+++ ')) {
      file = opened(_pathOf(line), _pathOf(lines[index + 1]));
      index += 1;
      continue;
    }

    final RegExpMatch? header = _hunk.firstMatch(line);

    if (header == null) {
      continue;
    }

    // A patch that is nothing but hunks is a patch about a file nobody named.
    file ??= opened('', '');

    close();

    final int beforeCount = header[2] == null ? 1 : int.parse(header[2]!);
    final int afterCount = header[4] == null ? 1 : int.parse(header[4]!);

    // A side with no lines in it writes the number of lines that come before
    // it, and a side with lines writes the first of them, counted from one.
    beforeLine = beforeCount == 0 ? int.parse(header[1]!) : int.parse(header[1]!) - 1;
    afterLine = afterCount == 0 ? int.parse(header[3]!) : int.parse(header[3]!) - 1;
    beforeLeft = beforeCount;
    afterLeft = afterCount;
  }

  close();

  final _Building? last = file;

  if (last != null) {
    files.add(last.settled);
  }

  return files;
}
