/// Compare two versions and show what changed.
///
/// One import for everything the package draws and everything it works out: the
/// engine that compares two documents or two pictures, the values it returns,
/// and the two widgets that show them.
///
/// ```dart
/// import 'package:diffine/diffine.dart';
///
/// TextDiff(before: saved, after: draft);
/// ImageDiff(before: DiffineEncodedImage(saved), after: DiffineEncodedImage(shot));
/// ```
///
/// Nothing in the engine touches a widget, so `diffText`, `diffImage`,
/// `parsePatch` and `formatPatch` are as usable from a build script or an
/// isolate as they are from a screen.
library;

export 'package:diffine/src/components/image/image_diff.dart' show ImageDiff;
export 'package:diffine/src/components/text/text_diff.dart' show TextDiff;
export 'package:diffine/src/diff.dart'
    show diffCharacters, diffSequence, diffText, diffWords, kDiffineDefaults;
export 'package:diffine/src/image.dart'
    show diffImage, imageSimilarity, kDiffPixelKinds, kDiffineImageDefaults, paintDiffImage;
export 'package:diffine/src/internal/highlight/catalogue.dart'
    show kDiffineLanguages, diffineHighlighterFor;
export 'package:diffine/src/internal/i18n.dart' show baseStringsFor;
export 'package:diffine/src/patch.dart' show formatPatch, parsePatch;
export 'package:diffine/src/theme/tokens.dart'
    show DiffineCodeColours, DiffineImageColours, DiffineTheme;
export 'package:diffine/src/types.dart';
