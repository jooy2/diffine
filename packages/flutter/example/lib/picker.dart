/// Opening a file, which the widget does not do.
///
/// `ImageDiff` draws the button on an empty pane and calls `onChoose`; what
/// happens next is the application's, because a picker is a plugin and which
/// plugin is a decision a diff viewer has no business making. This gallery runs
/// in a browser, so its answer is an `<input type="file">`.
library;

export 'picker_none.dart' if (dart.library.js_interop) 'picker_web.dart';
