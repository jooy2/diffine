/// Everywhere that is not a browser, where this gallery has no picker to offer.
library;

import 'package:diffine/diffine.dart';

/// Nothing chosen, because there is nothing here to choose with.
///
/// A desktop or a phone build of the gallery would reach for a plugin, and the
/// gallery deliberately has none: it is here to show the widget, not to show a
/// file picker.
Future<DiffineImageContent?> chooseImage(DiffineSide side) async => null;
