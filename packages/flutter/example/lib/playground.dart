/// The playground, as the site frames it.
///
/// Every other demo in this gallery is fixed: it draws one thing so that a page
/// can point at it. This one is the opposite — it draws whatever the row of
/// controls above the frame currently says, so that a reader on the playground
/// page gets the same page whichever package they picked.
///
/// The documents are held here rather than read from every message. Typing into
/// the editor, moving to the viewer and finding what you wrote is the thing the
/// page is for, and a widget that took the page's copy on every keystroke would
/// throw that away. [PlaygroundSettings.generation] is how the page says it
/// really does mean new ones.
library;

import 'package:diffine/diffine.dart';
import 'package:diffine_example/picker.dart';
import 'package:diffine_example/settings.dart';
import 'package:flutter/widgets.dart';

/// One playground.
class Playground extends StatefulWidget {
  /// The switches, the palette and the language.
  const Playground({required this.settings, required this.scheme, required this.locale, super.key});

  /// What the page around the frame last said.
  final PlaygroundSettings settings;

  /// Which palette the page is in.
  final DiffineColorScheme scheme;

  /// Which language the page is written in.
  final DiffineLocale locale;

  @override
  State<Playground> createState() => _PlaygroundState();
}

class _PlaygroundState extends State<Playground> {
  late String _before;
  late String _after;
  late String _language;
  late int _generation;

  @override
  void initState() {
    super.initState();
    _take();
  }

  @override
  void didUpdateWidget(Playground old) {
    super.didUpdateWidget(old);

    if (widget.settings.generation != _generation) {
      _take();
    }
  }

  /// The documents as the page has them, which is what a new generation means.
  void _take() {
    _generation = widget.settings.generation;
    _before = widget.settings.before;
    _after = widget.settings.after;
    _language = widget.settings.language;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.settings.mode == PlaygroundMode.pictures) {
      return _pictures();
    }

    return _text();
  }

  /// The two documents, read or written.
  ///
  /// Keyed by the mode as well as by the generation. Who holds a document — the
  /// application or the widget — is settled on the first build and does not
  /// change afterwards, so a viewer turning into an editor in the same place
  /// would be an editor handed a decision made about somebody else's arguments.
  Widget _text() {
    final PlaygroundSettings settings = widget.settings;
    final bool editing = settings.mode == PlaygroundMode.editor;
    final Key key = ValueKey<String>('${settings.mode.name}-$_generation');

    final DiffOptions diff = DiffOptions(inline: settings.detail);

    if (editing) {
      return TextDiff(
        key: key,
        mode: DiffineMode.editor,
        defaultBefore: _before,
        defaultAfter: _after,
        beforeLabel: settings.beforeLabel,
        afterLabel: settings.afterLabel,
        onBeforeChanged: (String value) => _before = value,
        onAfterChanged: (String value) => _after = value,
        // The menu is the editor's and what it lands on is this page's, so the
        // viewer opens on the language the editor was left on rather than back
        // at `plain`.
        language: _language,
        onLanguageChanged: (String chosen) => setState(() => _language = chosen),
        indentWithTab: settings.tab,
        wrap: settings.wrap,
        lineNumbers: settings.numbers,
        connectors: settings.connectors,
        diff: diff,
        colorScheme: widget.scheme,
        locale: widget.locale,
        height: double.infinity,
      );
    }

    return TextDiff(
      key: key,
      before: _before,
      after: _after,
      beforeLabel: settings.beforeLabel,
      afterLabel: settings.afterLabel,
      language: _language,
      view: settings.unified ? DiffineView.unified : DiffineView.split,
      alignLines: settings.align,
      wrap: settings.wrap,
      lineNumbers: settings.numbers,
      connectors: settings.connectors,
      diff: diff,
      colorScheme: widget.scheme,
      locale: widget.locale,
      height: double.infinity,
    );
  }

  /// The two pictures, with a way of putting your own in either pane.
  ///
  /// The page builds each pair — a patch cloned over a photograph, the same
  /// crop a pixel over, the same file saved again badly, an icon with a badge
  /// on it — and posts the two files down. Building them again in Dart would be
  /// two demos that drift apart, and one of the four cannot be built here at
  /// all: there is no JPEG encoder to save a picture badly with.
  Widget _pictures() {
    final PlaygroundSettings settings = widget.settings;

    return ImageDiff(
      // A widget holding its own pictures keeps the first ones it was given, so
      // a new pair is a new widget rather than an argument it would be right to
      // ignore.
      key: ValueKey<String>('${settings.shot}-${settings.pictureBefore == null}'),
      mode: DiffineMode.editor,
      before: settings.pictureBefore == null ? null : DiffineEncodedImage(settings.pictureBefore!),
      after: settings.pictureAfter == null ? null : DiffineEncodedImage(settings.pictureAfter!),
      beforeLabel: settings.pictureBeforeLabel,
      afterLabel: settings.pictureAfterLabel,
      onChoose: chooseImage,
      view: settings.view,
      diff: DiffImageOptions(
        tolerance: settings.tolerance,
        align: settings.alignPictures ? DiffImageAlign.shift : DiffImageAlign.none,
        ignoreAntialiasing: settings.smoothing,
      ),
      marks: settings.marks,
      outlines: settings.outlines,
      colorScheme: widget.scheme,
      locale: widget.locale,
      height: double.infinity,
    );
  }
}
