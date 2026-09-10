/// The page the gallery is embedded in, where it is embedded in one.
///
/// The documentation site frames this build and hands it `demo` and `locale` in
/// the frame's query string. Those two are fixed for the life of the frame:
/// which demo it is showing and which language the page around it is written in
/// do not change without the page navigating anyway.
///
/// Two things are not fixed, and both come through `postMessage` instead of the
/// URL, because a new `src` is a Flutter engine loaded again from nothing:
///
/// - **The palette.** A reader flips the site's own light/dark switch whenever
///   they like, and a second of blank rectangle to change one colour is not a
///   trade worth making.
/// - **The playground's switches.** That page draws its controls in HTML above
///   the frame, so that the reader on React and the reader on Flutter are given
///   the same row of them, and what they choose is posted down here.
///
/// Off the web there is no page around anything and no `dart:js_interop` to
/// listen with, so the other half of this is a function that returns null.
library;

export 'host_none.dart' if (dart.library.js_interop) 'host_web.dart';
