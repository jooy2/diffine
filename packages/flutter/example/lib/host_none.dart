/// Everywhere that is not a browser, where a gallery is the whole application.
library;

import 'package:diffine/diffine.dart';
import 'package:diffine_example/settings.dart';

/// Nothing to listen to: there is no page around this one to hear from.
///
/// Returns null rather than a function that does nothing, so the caller can
/// tell "not embedded" from "embedded and quiet" if it ever needs to.
void Function()? listenToHost({
  required void Function(DiffineColorScheme scheme) onScheme,
  required void Function(PlaygroundSettings settings) onSettings,
}) => null;

/// Nothing in the address bar to read a demo out of, either.
Map<String, String> hostQuery() => const <String, String>{};
