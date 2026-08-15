#pragma once

#include <flutter/binary_messenger.h>
#include <windows.h>

namespace dacx {

void RegisterMediaSession(flutter::BinaryMessenger* messenger, HWND hwnd);
void UnregisterMediaSession(flutter::BinaryMessenger* messenger);

}  // namespace dacx
