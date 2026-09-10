/// The browser half of `picker.dart`.
library;

import 'dart:async';
import 'dart:js_interop';

import 'package:diffine/diffine.dart';
import 'package:web/web.dart' as web;

/// Asks the browser for a picture, and hands back the bytes of whatever came.
///
/// The element is put in the document and taken out again rather than left
/// there: a file input that stays is a control the keyboard can reach and the
/// screen cannot show, and the pane already has a button of its own.
///
/// `cancel` matters as much as `change` here. Without it the future never
/// completes for a reader who opened the dialog and closed it, and the pane
/// would sit waiting on an answer that is not coming.
Future<DiffineImageContent?> chooseImage(DiffineSide side) async {
  final web.HTMLInputElement input = web.document.createElement('input') as web.HTMLInputElement;

  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';

  final Completer<web.File?> chosen = Completer<web.File?>();

  void finish(web.File? file) {
    if (!chosen.isCompleted) {
      chosen.complete(file);
    }
  }

  final web.EventListener onChange = ((web.Event _) => finish(input.files?.item(0))).toJS;
  final web.EventListener onCancel = ((web.Event _) => finish(null)).toJS;

  input.addEventListener('change', onChange);
  input.addEventListener('cancel', onCancel);
  web.document.body?.append(input);

  try {
    input.click();

    final web.File? file = await chosen.future;

    if (file == null) {
      return null;
    }

    final JSArrayBuffer buffer = await file.arrayBuffer().toDart;

    return DiffineEncodedImage(buffer.toDart.asUint8List());
  } finally {
    input.removeEventListener('change', onChange);
    input.removeEventListener('cancel', onCancel);
    input.remove();
  }
}
