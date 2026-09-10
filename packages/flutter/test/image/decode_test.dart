/// Opening a picture, which is the one part of the package that asks the
/// platform a question rather than answering one itself.
///
/// Written as plain tests rather than widget tests on purpose. `dart:ui` does
/// not answer the same everywhere — `ImageDescriptor.width` is a number on a
/// device and a throw on the web — and this is the file that runs under
/// `flutter test --platform chrome` to find that out. A widget test would not:
/// it needs a binding the browser has no quick way of standing up.
library;

import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/image/decode.dart';
import 'package:flutter_test/flutter_test.dart';

/// A flat picture of one colour, as a buffer.
DiffPixels plain(int width, int height, List<int> colour) {
  final Uint8List data = Uint8List(width * height * 4);

  for (int pixel = 0; pixel < width * height; pixel += 1) {
    data.setRange(pixel * 4, pixel * 4 + 4, colour);
  }

  return DiffPixels(data: data, width: width, height: height);
}

/// The same picture as the bytes of a PNG file, which is how one usually
/// arrives: read off a disk, out of a picker, or off a response.
Future<Uint8List> png(DiffPixels pixels) async {
  final Completer<ui.Image> drawn = Completer<ui.Image>();

  ui.decodeImageFromPixels(
    pixels.data,
    pixels.width,
    pixels.height,
    ui.PixelFormat.rgba8888,
    drawn.complete,
  );

  final ui.Image image = await drawn.future;
  final ByteData? file = await image.toByteData(format: ui.ImageByteFormat.png);

  image.dispose();

  return file!.buffer.asUint8List(file.offsetInBytes, file.lengthInBytes);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('opens a file and hands back both what to draw and what to compare', () async {
    final Picture picture = await decodeImage(
      DiffineEncodedImage(await png(plain(16, 9, <int>[255, 0, 0, 255]))),
      4000000,
    );

    expect(picture.width, 16);
    expect(picture.height, 9);
    expect(picture.pixels.width, 16);
    expect(picture.pixels.height, 9);
    expect(picture.pixels.data.length, 16 * 9 * 4);
    expect(picture.reduced, isFalse);

    // The first pixel, which is the colour it was drawn in.
    expect(picture.pixels.data.sublist(0, 4), <int>[255, 0, 0, 255]);

    releasePicture(picture);
  });

  test('decodes a file smaller when it will not fit inside the cap', () async {
    final Picture picture = await decodeImage(
      DiffineEncodedImage(await png(plain(80, 40, <int>[0, 128, 255, 255]))),
      400,
    );

    expect(picture.reduced, isTrue);
    expect(picture.width * picture.height, lessThanOrEqualTo(400));
    expect(picture.pixels.data.length, picture.width * picture.height * 4);

    releasePicture(picture);
  });

  test('opens a buffer of pixels without a file around it', () async {
    final DiffPixels source = plain(8, 8, <int>[0, 255, 0, 255]);
    final Picture picture = await decodeImage(DiffinePixelImage(source), 4000000);

    expect(picture.width, 8);
    expect(picture.height, 8);
    expect(picture.pixels, same(source));
    expect(picture.reduced, isFalse);

    releasePicture(picture);
  });
}
