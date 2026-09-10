/// Writing one side's version of a change over the other's.
///
/// A comparison is worked out in lines and a document is one string, so this is
/// the translation between them: which characters a run of lines covers, and
/// what has to be written there for the run to read as the other side's. The
/// awkward part is the newline, and it is awkward in exactly one place — the
/// end of a document that does not end in one, where a line taken out has one
/// terminator too many and a line put in has one too few.
library;

import 'package:diffine/src/internal/search.dart';
import 'package:diffine/src/types.dart';

/// One range of a document, and what is to be written over it.
class LineEdit {
  /// One edit.
  const LineEdit({required this.start, required this.end, required this.text, required this.whole});

  /// Where the range starts.
  final int start;

  /// Where it ends, exclusive.
  final int end;

  /// What goes in its place, newlines included.
  final String text;

  /// The document as it will read afterwards.
  final String whole;
}

/// Takes one side's lines and writes them over the other side's, for one
/// change.
///
/// `into` is the document being written, so a change applied into
/// [DiffineSide.after] leaves the two sides reading as `before` did over that
/// run — the version on the left, taken across.
///
/// `text` is that document as it stands now rather than as the comparison saw
/// it. The two are the same in an editor, where a keystroke is a new
/// comparison, and this reads the live one so that they cannot come apart.
LineEdit applyChange(DiffResult result, DiffChange change, DiffineSide into, String text) {
  final int from = into == DiffineSide.before ? change.beforeStart : change.afterStart;
  final int to = into == DiffineSide.before ? change.beforeEnd : change.afterEnd;
  final List<String> source = into == DiffineSide.before
      ? result.after.sublist(change.afterStart, change.afterEnd)
      : result.before.sublist(change.beforeStart, change.beforeEnd);

  // `lineStarts` has one entry per line and one more for the empty position
  // after a final newline, which is the answer wanted for a run that reaches
  // the end of the document.
  final List<int> starts = lineStarts(text);
  int at(int line) => line < starts.length ? starts[line] : text.length;
  final int start = at(from);
  final int end = at(to);
  final int last = text.isEmpty ? 0 : text.codeUnitAt(text.length - 1);

  String body = source.join('\n');

  if (source.isNotEmpty) {
    if (text.isEmpty || end < text.length || last == 10 || last == 13) {
      // Every line of the run ends where the next one begins, so each of these
      // needs its own terminator — and a document with nothing in it yet is
      // given one, because a file of lines is a file that ends in a newline.
      body += '\n';
    } else if (start == end && start > 0) {
      // Nothing is being written over, and the line above has no terminator of
      // its own. The one that separates it from these goes in front of them.
      body = '\n$body';
    }
  }

  return LineEdit(
    start: start,
    end: end,
    text: body,
    whole: text.substring(0, start) + body + text.substring(end),
  );
}
