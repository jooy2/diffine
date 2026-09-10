/// The browser half of `host.dart`.
library;

import 'dart:js_interop';
import 'dart:typed_data';

import 'package:diffine/diffine.dart';
import 'package:diffine_example/settings.dart';
import 'package:web/web.dart' as web;

/// One message from the page around the frame.
///
/// Read a field at a time rather than turned into a Dart map wholesale: a
/// playground message carries two pictures, and a photograph converted into a
/// Dart list on the way past would be a copy nobody asked for.
extension type _Message._(JSObject _) implements JSObject {
  external String? get diffine;
  external JSAny? get value;
  external JSUint8Array? get pictureBefore;
  external JSUint8Array? get pictureAfter;
}

/// Listens to the page around the frame.
///
/// Every message is named so that nothing else on the page mistakes one for its
/// own: `{diffine: 'ready'}` goes up when this is listening, and
/// `{diffine: 'colorScheme', value: …}` and `{diffine: 'playground', value: …}`
/// come down.
///
/// The `ready` half is not politeness, it is the whole handshake. An engine
/// boots for as long as it takes to arrive over the network — and with the
/// frame loading lazily, that may be long after the reader last touched a
/// switch. A page that pushed and hoped would be pushing at a frame with
/// nothing in it yet. So the frame speaks first, and the page answers with
/// wherever its switches are by then.
void Function()? listenToHost({
  required void Function(DiffineColorScheme scheme) onScheme,
  required void Function(PlaygroundSettings settings) onSettings,
}) {
  final String origin = web.window.location.origin;

  void handle(web.MessageEvent event) {
    // Same origin or nothing. The site serves this build itself, so the page
    // around the frame is the only page entitled to be talking; a message from
    // anywhere else is somebody else's page with this one framed inside it,
    // which is not a thing to take a palette or a document from.
    if (event.origin != origin) {
      return;
    }

    final JSAny? raw = event.data;

    if (raw == null || !raw.isA<JSObject>()) {
      return;
    }

    final _Message message = raw as _Message;

    switch (message.diffine) {
      case 'colorScheme':
        final DiffineColorScheme? scheme = switch (message.value?.dartify()) {
          'light' => DiffineColorScheme.light,
          'dark' => DiffineColorScheme.dark,
          'system' => DiffineColorScheme.system,
          _ => null,
        };

        if (scheme != null) {
          onScheme(scheme);
        }
      case 'playground':
        final Object? value = message.value?.dartify();

        if (value is Map<Object?, Object?>) {
          onSettings(
            PlaygroundSettings.of(
              value,
              pictureBefore: _bytes(message.pictureBefore),
              pictureAfter: _bytes(message.pictureAfter),
            ),
          );
        }
    }
  }

  final web.EventListener listener = handle.toJS;

  web.window.addEventListener('message', listener);

  // `parent` is this window when nothing is framing it, so this is a message to
  // itself — which the handler above reads, finds is named nothing it knows,
  // and drops.
  web.window.parent?.postMessage(<String, String>{'diffine': 'ready'}.jsify(), origin.toJS);

  return () => web.window.removeEventListener('message', listener);
}

Uint8List? _bytes(JSUint8Array? array) => array?.toDart;

/// What the frame's own address bar was given: which demo, and which language.
Map<String, String> hostQuery() {
  return <String, String>{
    for (final String pair in web.window.location.search.replaceFirst('?', '').split('&'))
      if (pair.contains('='))
        Uri.decodeComponent(pair.split('=').first): Uri.decodeComponent(pair.split('=').last),
  };
}
