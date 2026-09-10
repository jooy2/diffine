/// How a document is written, apart from what is in it.
///
/// None of this is in the comparison, and that is deliberate rather than
/// missing: `\r\n`, `\r` and `\n` all end a line, so a file written on one
/// platform and edited on another does not come back as a document where every
/// line changed. The cost of that is a file whose only difference is invisible
/// — the same lines, saved by another editor — reading as no difference at all.
///
/// So it is worked out beside the comparison instead, in one pass over each
/// document, and the view says so where the two disagree.
library;

import 'package:diffine/src/types.dart';

/// The byte order mark, which is a character at the start of the first line.
const int _mark = 0xfeff;

const int _carriageReturn = 13;
const int _lineFeed = 10;

/// What a document ends its lines with, whether it ends in one, and its mark.
DiffFormat formatOf(String text) {
  bool crlf = false;
  bool lf = false;
  bool cr = false;

  // One pass rather than three searches. In an editor this runs on both
  // documents for every keystroke.
  for (int index = 0; index < text.length; index += 1) {
    final int code = text.codeUnitAt(index);

    if (code == _carriageReturn) {
      if (index + 1 < text.length && text.codeUnitAt(index + 1) == _lineFeed) {
        crlf = true;
        index += 1;
      } else {
        cr = true;
      }
    } else if (code == _lineFeed) {
      lf = true;
    }
  }

  final int kinds = (crlf ? 1 : 0) + (lf ? 1 : 0) + (cr ? 1 : 0);
  final DiffLineEnding ending = kinds == 0
      ? DiffLineEnding.none
      : kinds > 1
      ? DiffLineEnding.mixed
      : crlf
      ? DiffLineEnding.crlf
      : lf
      ? DiffLineEnding.lf
      : DiffLineEnding.cr;
  final int last = text.isEmpty ? 0 : text.codeUnitAt(text.length - 1);

  return DiffFormat(
    ending: ending,
    finalNewline: text.isNotEmpty && (last == _carriageReturn || last == _lineFeed),
    byteOrderMark: text.isNotEmpty && text.codeUnitAt(0) == _mark,
  );
}
