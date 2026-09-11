/// The palette and the measurements, as one value the widgets carry.
///
/// The React package declares every colour as a custom property on the element
/// it draws, so an application that wants its own palette overrides the
/// properties rather than the rules. There is no cascade here to do that with,
/// so the same idea arrives as a value: one object, the same names, the same
/// numbers, handed down the tree — and an application replaces a token with
/// [DiffineTheme.copyWith] instead of a declaration.
///
/// It travels with the widget rather than through a global, which is worth more
/// here than the parity: one comparison can be dark inside a light screen, and
/// two on one screen can be different from each other.
library;

import 'package:diffine/src/types.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// What a syntax highlighter's runs are drawn in.
///
/// Eight rather than one per kind of token: every kind a grammar emits is
/// mapped onto one of these, so a palette of eight is the whole of what an
/// application overrides.
@immutable
class DiffineCodeColours {
  /// All eight.
  const DiffineCodeColours({
    required this.keyword,
    required this.string,
    required this.comment,
    required this.number,
    required this.title,
    required this.type,
    required this.variable,
    required this.meta,
  });

  /// A keyword, a literal, an operator that is a word.
  final Color keyword;

  /// A string, a character, a regular expression.
  final Color string;

  /// A comment of any shape.
  final Color comment;

  /// A number.
  final Color number;

  /// The name of something being declared, and a tag's name.
  final Color title;

  /// A type, a built-in, a class.
  final Color type;

  /// A variable, an attribute, a property.
  final Color variable;

  /// A directive, a preprocessor line, punctuation.
  final Color meta;

  /// Whichever colour a kind of token asks for.
  Color of(DiffineTokenKind kind) {
    switch (kind) {
      case DiffineTokenKind.keyword:
        return keyword;
      case DiffineTokenKind.string:
        return string;
      case DiffineTokenKind.comment:
        return comment;
      case DiffineTokenKind.number:
        return number;
      case DiffineTokenKind.title:
        return title;
      case DiffineTokenKind.type:
        return type;
      case DiffineTokenKind.variable:
        return variable;
      case DiffineTokenKind.meta:
        return meta;
    }
  }
}

/// What a picture comparison marks, and what it marks it on.
///
/// Each carries its own transparency, because all of them sit on top of the
/// picture they are describing — an opaque mark is a mark with nothing under it
/// to compare.
@immutable
class DiffineImageColours {
  /// All eight.
  const DiffineImageColours({
    required this.changed,
    required this.added,
    required this.removed,
    required this.outline,
    required this.marker,
    required this.halo,
    required this.ground,
    required this.chequer,
  });

  /// A pixel both pictures cover and disagree about.
  final Color changed;

  /// A pixel only the second picture covers.
  final Color added;

  /// A pixel only the first one covers.
  final Color removed;

  /// The box drawn round a change.
  final Color outline;

  /// The box round the change a reader has stepped to.
  final Color marker;

  /// What is drawn under both boxes, wider, so that one shows on a picture of
  /// any colour.
  ///
  /// A single line cannot: a dark box on the dark half of a photograph is a box
  /// nobody finds, and that is where the changes are.
  final Color halo;

  /// The ground a pane larger than what is in it shows.
  final Color ground;

  /// The squares that say where a picture is see-through.
  final Color chequer;
}

/// Everything the widgets draw with.
@immutable
class DiffineTheme {
  /// Every token, each of which has to be given. Start from [light] or [dark]
  /// and use [copyWith] instead of writing one of these out.
  const DiffineTheme({
    required this.brightness,
    required this.surface,
    required this.text,
    required this.muted,
    required this.border,
    required this.gutter,
    required this.accent,
    required this.invisible,
    required this.insertLine,
    required this.insertPiece,
    required this.deleteLine,
    required this.deletePiece,
    required this.insertText,
    required this.deleteText,
    required this.code,
    required this.search,
    required this.searchCurrent,
    required this.blank,
    required this.image,
    required this.selection,
    this.height = 384,
    this.radius = 8,
    this.fontFamily,
    this.fontFamilyFallback,
    this.fontSize = 13,
    this.lineHeight = 24,
    this.letterSpacing,
    this.linksWidth = 48,
    this.tabSize = 4,
  });

  /// Which of the two palettes this is, for anything that has to decide by it.
  final Brightness brightness;

  /// The ground the whole comparison sits on.
  final Color surface;

  /// The colour a line is written in.
  final Color text;

  /// What a label, a count and a name are written in.
  final Color muted;

  /// Every rule and outline.
  final Color border;

  /// The column of numbers and markers down the side of a pane.
  final Color gutter;

  /// What the focus ring and the one thing being read are drawn in.
  final Color accent;

  /// The dots and rules that stand for a space and a tab, where those are being
  /// drawn. Faint on purpose: they are there to be found rather than read.
  final Color invisible;

  /// A whole line that arrived.
  final Color insertLine;

  /// The words inside it that actually moved. It only ever sits on top of
  /// [insertLine], which is what the contrast of both was chosen against.
  final Color insertPiece;

  /// A whole line that went away.
  final Color deleteLine;

  /// The words inside it that actually moved.
  final Color deletePiece;

  /// The same green, dark enough to be read as text.
  final Color insertText;

  /// The same red.
  final Color deleteText;

  /// What a syntax highlighter's runs are drawn in.
  final DiffineCodeColours code;

  /// What a search found. A third colour rather than the accent: a match can
  /// land on a line that is already tinted green or red, and it has to be
  /// legible on all three grounds.
  final Color search;

  /// The one of those a reader is being shown.
  final Color searchCurrent;

  /// The space opposite a line that has no counterpart.
  final Color blank;

  /// What a picture comparison marks, and what it marks it on.
  final DiffineImageColours image;

  /// What a selection in an editable pane is drawn in. It has to be
  /// see-through: the text under a selection is drawn by the lines behind the
  /// field, and an opaque highlight would cover the words it is meant to be
  /// picking out.
  final Color selection;

  /// How tall the whole comparison is, unless something above it says
  /// otherwise.
  final double height;

  /// How round its corners are.
  final double radius;

  /// The typeface the two documents are drawn in. `null` is the platform's own
  /// monospace.
  final String? fontFamily;

  /// What to fall back to where that family has no glyph.
  final List<String>? fontFamilyFallback;

  /// How big it is, in logical pixels.
  final double fontSize;

  /// How tall one unwrapped line is, in logical pixels.
  final double lineHeight;

  /// How far apart the letters are.
  final double? letterSpacing;

  /// How wide the column between two panes is.
  final double linksWidth;

  /// How wide a tab is drawn, in characters.
  final int tabSize;

  /// The light palette, which is what a comparison is drawn in unless the
  /// screen around it says otherwise.
  static const DiffineTheme light = DiffineTheme(
    brightness: Brightness.light,
    surface: Color(0xffffffff),
    text: Color(0xff1f2733),
    muted: Color(0xff6e798c),
    border: Color(0xffd6dee9),
    gutter: Color(0xfff4f7fb),
    accent: Color(0xff0e7ffc),
    invisible: Color(0xffb6c0cf),
    insertLine: Color(0xffe7f8ee),
    insertPiece: Color(0xffa5e9c1),
    deleteLine: Color(0xfffdecee),
    deletePiece: Color(0xffffc3c8),
    insertText: Color(0xff1a7f4b),
    deleteText: Color(0xffc2333f),
    code: DiffineCodeColours(
      keyword: Color(0xff9333d6),
      string: Color(0xff177a4a),
      comment: Color(0xff8892a4),
      number: Color(0xffb45309),
      title: Color(0xff0e63c9),
      type: Color(0xff0c7c86),
      variable: Color(0xffc2410c),
      meta: Color(0xff6e798c),
    ),
    search: Color(0xffffe9a8),
    searchCurrent: Color(0xffffbd3d),
    blank: Color(0xfff0f3f7),
    image: DiffineImageColours(
      changed: Color(0x8ce83e8c),
      added: Color(0x801a7f4b),
      removed: Color(0x80c2333f),
      outline: Color(0xd9141c28),
      marker: Color(0xf20e7ffc),
      halo: Color(0x99ffffff),
      ground: Color(0xffeaeef4),
      chequer: Color(0xffdbe1ea),
    ),
    selection: Color(0x330e7ffc),
  );

  /// The dark palette.
  static const DiffineTheme dark = DiffineTheme(
    brightness: Brightness.dark,
    surface: Color(0xff1b222c),
    text: Color(0xffe4e9f0),
    muted: Color(0xff8d99ad),
    border: Color(0xff2f3945),
    gutter: Color(0xff232b36),
    accent: Color(0xff4c9dff),
    invisible: Color(0xff4b5768),
    insertLine: Color(0xff12301f),
    insertPiece: Color(0xff206c42),
    deleteLine: Color(0xff351c20),
    deletePiece: Color(0xff7f303a),
    insertText: Color(0xff5fd08a),
    deleteText: Color(0xffff8b95),
    code: DiffineCodeColours(
      keyword: Color(0xffc792ea),
      string: Color(0xff7ddba0),
      comment: Color(0xff7c869a),
      number: Color(0xfff0b072),
      title: Color(0xff79b8ff),
      type: Color(0xff5fd3d8),
      variable: Color(0xfff4a07a),
      meta: Color(0xff8d99ad),
    ),
    search: Color(0xff5c4713),
    searchCurrent: Color(0xff8a5c0f),
    blank: Color(0xff151b23),
    image: DiffineImageColours(
      changed: Color(0x8cff5ca8),
      added: Color(0x803fbe7a),
      removed: Color(0x80ff6a74),
      outline: Color(0xd9e4e9f0),
      marker: Color(0xf24c9dff),
      halo: Color(0x99060a10),
      ground: Color(0xff151b23),
      chequer: Color(0xff1e2530),
    ),
    selection: Color(0x404c9dff),
  );

  /// Whichever of the two a scheme asks for, with `system` reading the
  /// brightness of the screen around it.
  static DiffineTheme resolve(BuildContext context, DiffineColorScheme scheme) {
    switch (scheme) {
      case DiffineColorScheme.light:
        return light;
      case DiffineColorScheme.dark:
        return dark;
      case DiffineColorScheme.system:
        return MediaQuery.platformBrightnessOf(context) == Brightness.dark ? dark : light;
    }
  }

  /// The same theme with the typeface a [DiffineFont] asks for written over it.
  DiffineTheme withFont(DiffineFont? font) {
    if (font == null) {
      return this;
    }

    return copyWith(
      fontFamily: font.family,
      fontFamilyFallback: font.familyFallback,
      fontSize: font.size,
      lineHeight: font.lineHeight,
      letterSpacing: font.letterSpacing,
    );
  }

  /// The style one line of a document is drawn in.
  TextStyle get lineStyle => TextStyle(
    fontFamily: fontFamily ?? _monospace,
    fontFamilyFallback: fontFamilyFallback ?? const <String>['monospace'],
    fontSize: fontSize,
    height: lineHeight / fontSize,
    letterSpacing: letterSpacing,
    color: text,
    fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
    leadingDistribution: TextLeadingDistribution.even,
  );

  /// The same theme with whichever tokens are given replaced.
  DiffineTheme copyWith({
    Brightness? brightness,
    Color? surface,
    Color? text,
    Color? muted,
    Color? border,
    Color? gutter,
    Color? accent,
    Color? invisible,
    Color? insertLine,
    Color? insertPiece,
    Color? deleteLine,
    Color? deletePiece,
    Color? insertText,
    Color? deleteText,
    DiffineCodeColours? code,
    Color? search,
    Color? searchCurrent,
    Color? blank,
    DiffineImageColours? image,
    Color? selection,
    double? height,
    double? radius,
    String? fontFamily,
    List<String>? fontFamilyFallback,
    double? fontSize,
    double? lineHeight,
    double? letterSpacing,
    double? linksWidth,
    int? tabSize,
  }) {
    return DiffineTheme(
      brightness: brightness ?? this.brightness,
      surface: surface ?? this.surface,
      text: text ?? this.text,
      muted: muted ?? this.muted,
      border: border ?? this.border,
      gutter: gutter ?? this.gutter,
      accent: accent ?? this.accent,
      invisible: invisible ?? this.invisible,
      insertLine: insertLine ?? this.insertLine,
      insertPiece: insertPiece ?? this.insertPiece,
      deleteLine: deleteLine ?? this.deleteLine,
      deletePiece: deletePiece ?? this.deletePiece,
      insertText: insertText ?? this.insertText,
      deleteText: deleteText ?? this.deleteText,
      code: code ?? this.code,
      search: search ?? this.search,
      searchCurrent: searchCurrent ?? this.searchCurrent,
      blank: blank ?? this.blank,
      image: image ?? this.image,
      selection: selection ?? this.selection,
      height: height ?? this.height,
      radius: radius ?? this.radius,
      fontFamily: fontFamily ?? this.fontFamily,
      fontFamilyFallback: fontFamilyFallback ?? this.fontFamilyFallback,
      fontSize: fontSize ?? this.fontSize,
      lineHeight: lineHeight ?? this.lineHeight,
      letterSpacing: letterSpacing ?? this.letterSpacing,
      linksWidth: linksWidth ?? this.linksWidth,
      tabSize: tabSize ?? this.tabSize,
    );
  }
}

/// What a monospaced document is drawn in where the application named nothing.
///
/// Each platform's own, because a stack of names is a CSS idea and Flutter
/// takes one family: `monospace` resolves on Android and the web, `Menlo` is
/// what Apple's platforms have, and `Consolas` is Windows'.
String get _monospace {
  switch (defaultTargetPlatform) {
    case TargetPlatform.iOS:
    case TargetPlatform.macOS:
      return 'Menlo';
    case TargetPlatform.windows:
      return 'Consolas';
    case TargetPlatform.android:
    case TargetPlatform.fuchsia:
    case TargetPlatform.linux:
      return 'monospace';
  }
}
