/// Diffine, running.
///
/// Two things at once, and they are the same build. On a phone or a desktop it
/// is a gallery: a list of demos down the side and the widget filling the rest,
/// which is what somebody who has just installed the package opens to see what
/// it does. Framed by the documentation site with `?demo=` in its query string,
/// it is one of those demos on its own with nothing around it — the real
/// widget, not a picture of one, on every page of the site that shows Flutter.
///
/// `?demo=playground` is the one that is not in the list. It is the site's
/// playground page, whose controls are drawn in HTML above the frame and posted
/// down here, and it is worth nothing without them — so it is reachable by
/// being asked for rather than by being chosen.
library;

import 'package:diffine/diffine.dart';
import 'package:diffine_example/host.dart';
import 'package:diffine_example/playground.dart';
import 'package:diffine_example/samples.dart' as samples;
import 'package:diffine_example/settings.dart';
import 'package:flutter/widgets.dart';

void main() {
  runApp(const GalleryApp());
}

/// One demo: what it is called, and what it draws.
class Demo {
  /// One demo.
  const Demo(this.id, this.name, this.build);

  /// What the site asks for in `?demo=`.
  final String id;

  /// What the gallery's own list calls it.
  final String name;

  /// What it draws.
  final Widget Function(DiffineColorScheme scheme, DiffineLocale locale) build;
}

/// Every demo, in the order the gallery lists them.
final List<Demo> demos = <Demo>[
  Demo(
    'text/basic',
    'Side by side',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      before: samples.code.before,
      after: samples.code.after,
      beforeLabel: samples.code.beforeLabel,
      afterLabel: samples.code.afterLabel,
      language: samples.code.language,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'text/unified',
    'One column',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      before: samples.code.before,
      after: samples.code.after,
      beforeLabel: samples.code.beforeLabel,
      afterLabel: samples.code.afterLabel,
      language: samples.code.language,
      view: DiffineView.unified,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'text/wrap',
    'Wrapped prose',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      before: samples.prose.before,
      after: samples.prose.after,
      beforeLabel: samples.prose.beforeLabel,
      afterLabel: samples.prose.afterLabel,
      wrap: true,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'text/collapse',
    'Folded away',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      before: samples.longFile.before,
      after: samples.longFile.after,
      beforeLabel: samples.longFile.beforeLabel,
      afterLabel: samples.longFile.afterLabel,
      language: samples.longFile.language,
      collapse: true,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo('text/patch', 'From a patch', (DiffineColorScheme scheme, DiffineLocale locale) {
    final DiffPatchFile file = parsePatch(samples.patch).single;

    return TextDiff(
      result: file.result,
      beforeLabel: file.before,
      afterLabel: file.after,
      language: 'dart',
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    );
  }),
  Demo(
    'text/editor',
    'Typing into it',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      mode: DiffineMode.editor,
      defaultBefore: samples.code.before,
      defaultAfter: samples.code.after,
      beforeLabel: samples.code.beforeLabel,
      afterLabel: samples.code.afterLabel,
      defaultLanguage: samples.code.language,
      readOnly: DiffineSide.before,
      applyChanges: true,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'text/plain',
    'No numbers, no marks',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      before: samples.code.before,
      after: samples.code.after,
      beforeLabel: samples.code.beforeLabel,
      afterLabel: samples.code.afterLabel,
      language: samples.code.language,
      lineNumbers: false,
      markers: false,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'text/unaligned',
    'Sides at their own lengths',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      before: samples.code.before,
      after: samples.code.after,
      beforeLabel: samples.code.beforeLabel,
      afterLabel: samples.code.afterLabel,
      language: samples.code.language,
      alignLines: false,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'text/bare',
    'Nothing around it',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      before: samples.prose.before,
      after: samples.prose.after,
      wrap: true,
      header: false,
      summary: false,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'text/editor-wrap',
    'Typing into wrapped prose',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      mode: DiffineMode.editor,
      defaultBefore: samples.prose.before,
      defaultAfter: samples.prose.after,
      beforeLabel: samples.prose.beforeLabel,
      afterLabel: samples.prose.afterLabel,
      wrap: true,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'text/widgets',
    'A note under a line',
    (DiffineColorScheme scheme, DiffineLocale locale) => TextDiff(
      before: samples.prose.before,
      after: samples.prose.after,
      beforeLabel: samples.prose.beforeLabel,
      afterLabel: samples.prose.afterLabel,
      wrap: true,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
      renderWidget: (DiffLine line, DiffineSide side) =>
          side == DiffineSide.after && line.index == 4 ? const _Note() : null,
    ),
  ),
  Demo(
    'image/split',
    'Two pictures',
    (DiffineColorScheme scheme, DiffineLocale locale) => ImageDiff(
      before: DiffinePixelImage(samples.drawing()),
      after: DiffinePixelImage(samples.drawing(pass: 1)),
      beforeLabel: 'saved.png',
      afterLabel: 'rendered.png',
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'image/wipe',
    'Wiped across',
    (DiffineColorScheme scheme, DiffineLocale locale) => ImageDiff(
      before: DiffinePixelImage(samples.drawing()),
      after: DiffinePixelImage(samples.drawing(pass: 1)),
      beforeLabel: 'saved.png',
      afterLabel: 'rendered.png',
      view: DiffineImageView.wipe,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'image/mask',
    'What changed, alone',
    (DiffineColorScheme scheme, DiffineLocale locale) => ImageDiff(
      before: DiffinePixelImage(samples.drawing()),
      after: DiffinePixelImage(samples.drawing(pass: 1)),
      beforeLabel: 'saved.png',
      afterLabel: 'rendered.png',
      view: DiffineImageView.mask,
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
  Demo(
    'image/several',
    'Three at once',
    (DiffineColorScheme scheme, DiffineLocale locale) => ImageDiff(
      // Two rounds of editing over one original, neither touching what the
      // other did. The first pane is the one the other two are counted
      // against, so it carries both sets of marks and they carry their own.
      pictures: <DiffineImageContent>[
        DiffinePixelImage(samples.drawing()),
        DiffinePixelImage(samples.drawing(pass: 1)),
        DiffinePixelImage(samples.drawing(pass: 2)),
      ],
      pictureLabels: const <String>['saved.png', 'rendered.png', 'second-pass.png'],
      colorScheme: scheme,
      locale: locale,
      height: double.infinity,
    ),
  ),
];

/// The gallery, or one framed demo out of it.
class GalleryApp extends StatefulWidget {
  /// One gallery.
  const GalleryApp({super.key});

  @override
  State<GalleryApp> createState() => _GalleryAppState();
}

class _GalleryAppState extends State<GalleryApp> {
  late final Map<String, String> _query = hostQuery();
  late final String? _framed = _query['demo'];
  late final DiffineLocale _locale = _query['locale'] == 'ko' ? DiffineLocale.ko : DiffineLocale.en;

  void Function()? _stopListening;
  DiffineColorScheme _scheme = DiffineColorScheme.system;
  PlaygroundSettings _settings = PlaygroundSettings.waiting;
  int _chosen = 0;

  @override
  void initState() {
    super.initState();
    _stopListening = listenToHost(
      onScheme: (DiffineColorScheme scheme) {
        if (mounted) {
          setState(() => _scheme = scheme);
        }
      },
      onSettings: (PlaygroundSettings settings) {
        if (mounted) {
          setState(() => _settings = settings);
        }
      },
    );
  }

  @override
  void dispose() {
    _stopListening?.call();
    super.dispose();
  }

  DiffineTheme get _theme => DiffineTheme.resolve(context, _scheme);

  @override
  Widget build(BuildContext context) {
    return WidgetsApp(
      title: 'Diffine',
      color: const Color(0xff0e7ffc),
      debugShowCheckedModeBanner: false,
      builder: (BuildContext context, Widget? _) {
        final Demo? framed = _framed == null
            ? null
            : demos.where((Demo demo) => demo.id == _framed).firstOrNull;

        return DefaultTextStyle(
          style: TextStyle(fontSize: 13, color: _theme.text),
          child: ColoredBox(
            color: _theme.surface,
            child: switch ((_framed, framed)) {
              ('playground', _) => _framing(
                Playground(settings: _settings, scheme: _scheme, locale: _locale),
              ),
              (_, final Demo demo?) => _framing(_keyed(demo)),
              _ => _gallery(),
            },
          ),
        );
      },
    );
  }

  /// One widget, with nothing around it. What the documentation site frames.
  Widget _framing(Widget shown) {
    return Padding(padding: const EdgeInsets.all(1), child: shown);
  }

  /// One demo, with a key of its own.
  ///
  /// Without it every demo would be the same widget in the same place, and the
  /// state that decides who holds a document — the application, or the widget —
  /// is settled on the first build and does not change afterwards. Switching
  /// from a viewer to an editor would hand the editor a decision made about
  /// somebody else's arguments.
  Widget _keyed(Demo demo) {
    return KeyedSubtree(key: ValueKey<String>(demo.id), child: demo.build(_scheme, _locale));
  }

  /// Every demo, with a list of them down the side.
  Widget _gallery() {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final bool narrow = constraints.maxWidth < 720;
        final Widget list = _list(narrow);
        final Widget shown = Padding(
          padding: const EdgeInsets.all(12),
          child: _keyed(demos[_chosen]),
        );

        if (narrow) {
          return SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                list,
                Expanded(child: shown),
              ],
            ),
          );
        }

        return SafeArea(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              SizedBox(width: 200, child: list),
              Expanded(child: shown),
            ],
          ),
        );
      },
    );
  }

  Widget _list(bool narrow) {
    final DiffineTheme theme = _theme;
    final List<Widget> entries = <Widget>[
      for (int index = 0; index < demos.length; index += 1)
        _Entry(
          theme: theme,
          name: demos[index].name,
          chosen: index == _chosen,
          onTap: () => setState(() => _chosen = index),
        ),
    ];

    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.gutter,
        border: narrow
            ? Border(bottom: BorderSide(color: theme.border))
            : Border(right: BorderSide(color: theme.border)),
      ),
      child: narrow
          ? SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.all(8),
              child: Row(children: entries),
            )
          : ListView(padding: const EdgeInsets.all(8), children: entries),
    );
  }
}

class _Entry extends StatelessWidget {
  const _Entry({
    required this.theme,
    required this.name,
    required this.chosen,
    required this.onTap,
  });

  final DiffineTheme theme;
  final String name;
  final bool chosen;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: chosen,
      label: name,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(right: 6, bottom: 4),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: chosen ? theme.accent.withValues(alpha: 0.14) : null,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            name,
            style: TextStyle(
              fontSize: 13,
              fontWeight: chosen ? FontWeight.w700 : FontWeight.w400,
              color: chosen ? theme.accent : theme.text,
            ),
          ),
        ),
      ),
    );
  }
}

/// Something of the application's own, under one line.
class _Note extends StatelessWidget {
  const _Note();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(52, 2, 8, 6),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: const Color(0x1a0e7ffc),
        borderRadius: BorderRadius.circular(6),
      ),
      child: const Text(
        'A review comment lives here. Diffine draws whatever the application '
        'hands back and gives the line opposite the same height.',
        style: TextStyle(fontSize: 12),
      ),
    );
  }
}
