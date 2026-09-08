import 'dart:async';

/// Serializes async work (e.g. file opens) so only one runs at a time.
class LoadQueue {
  Future<void> _tail = Future<void>.value();
  bool _disposed = false;
  int _pending = 0;

  bool get isDisposed => _disposed;

  /// True while a task is queued or running.
  bool get isBusy => _pending > 0;

  Future<void> enqueue(
    Future<void> Function() task, {
    void Function(Object error, StackTrace stackTrace)? onError,
  }) {
    if (_disposed) return Future<void>.value();
    _pending++;
    final run = _tail
        .then((_) async {
          if (_disposed) return;
          try {
            await task();
          } catch (e, st) {
            onError?.call(e, st);
          }
        })
        .whenComplete(() {
          _pending--;
        });
    _tail = run;
    return run;
  }

  void dispose() {
    _disposed = true;
  }
}
