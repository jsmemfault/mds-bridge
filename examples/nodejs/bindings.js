/**
 * FFI bindings for Memfault HID library
 *
 * This module provides ffi-napi bindings to the memfault_hid C library.
 *
 * It includes both:
 * - Public high-level MDS API (from mds_protocol.h)
 * - Internal buffer-based parsing API (from mds_protocol_internal.h)
 *
 * The internal APIs are used for event-driven I/O integration with node-hid.
 */

import ffi from 'ffi-napi';
import ref from 'ref-napi';
import StructType from 'ref-struct-napi';
import ArrayType from 'ref-array-napi';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

// Get library path based on platform
function getLibraryPath() {
  const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const buildDir = join(rootDir, 'build');

  const platform = os.platform();
  if (platform === 'darwin') {
    return join(buildDir, 'libmemfault_hid.dylib');
  } else if (platform === 'linux') {
    return join(buildDir, 'libmemfault_hid.so');
  } else if (platform === 'win32') {
    return join(buildDir, 'memfault_hid.dll');
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Type definitions
const uint8_t = ref.types.uint8;
const uint32_t = ref.types.uint32;
const size_t = ref.types.size_t;
const int = ref.types.int;
const bool = ref.types.bool;
const voidPtr = ref.refType(ref.types.void);

// Array types
const uint8Array = ArrayType(uint8_t);

// MDS constants
export const MDS_REPORT_ID = {
  SUPPORTED_FEATURES: 0x01,
  DEVICE_IDENTIFIER: 0x02,
  DATA_URI: 0x03,
  AUTHORIZATION: 0x04,
  STREAM_CONTROL: 0x05,
  STREAM_DATA: 0x06,
};

export const MDS_STREAM_MODE = {
  DISABLED: 0x00,
  ENABLED: 0x01,
};

export const MDS_MAX_DEVICE_ID_LEN = 64;
export const MDS_MAX_URI_LEN = 128;
export const MDS_MAX_AUTH_LEN = 128;
export const MDS_MAX_CHUNK_DATA_LEN = 63;
export const MDS_SEQUENCE_MASK = 0x1F;
export const MDS_SEQUENCE_MAX = 31;

// Struct definitions
export const mds_device_config_t = StructType({
  supported_features: uint32_t,
  device_identifier: ArrayType(ref.types.char, MDS_MAX_DEVICE_ID_LEN),
  data_uri: ArrayType(ref.types.char, MDS_MAX_URI_LEN),
  authorization: ArrayType(ref.types.char, MDS_MAX_AUTH_LEN),
});

export const mds_stream_packet_t = StructType({
  sequence: uint8_t,
  data: ArrayType(uint8_t, MDS_MAX_CHUNK_DATA_LEN),
  data_len: size_t,
});

// Opaque pointer types
const mds_session_ptr = ref.refType(ref.types.void);
const mds_session_ptr_ptr = ref.refType(mds_session_ptr);
const mds_backend_ptr = ref.refType(ref.types.void);

// Backend callback function types
const backend_read_fn = ffi.Function(int, [voidPtr, uint8_t, ref.refType(uint8_t), size_t, int]);
const backend_write_fn = ffi.Function(int, [voidPtr, uint8_t, ref.refType(uint8_t), size_t]);
const backend_destroy_fn = ffi.Function('void', [voidPtr]);

// Backend operations structure
export const mds_backend_ops_t = StructType({
  read: backend_read_fn,
  write: backend_write_fn,
  destroy: backend_destroy_fn,
});

// Backend structure
export const mds_backend_t = StructType({
  ops: ref.refType(mds_backend_ops_t),
  impl_data: voidPtr,
});

// Load the library
const libraryPath = getLibraryPath();
console.log(`Loading Memfault HID library from: ${libraryPath}`);

export const lib = ffi.Library(libraryPath, {
  // Session management - NEW API
  'mds_session_create': [int, [ref.refType(mds_backend_t), mds_session_ptr_ptr]],
  'mds_session_create_hid': [int, [ref.types.uint16, ref.types.uint16, voidPtr, mds_session_ptr_ptr]],
  'mds_session_destroy': ['void', [mds_session_ptr]],

  // Device configuration - HIGH-LEVEL API
  'mds_read_device_config': [int, [mds_session_ptr, ref.refType(mds_device_config_t)]],
  'mds_get_device_identifier': [int, [mds_session_ptr, 'string', size_t]],
  'mds_get_data_uri': [int, [mds_session_ptr, 'string', size_t]],
  'mds_get_authorization': [int, [mds_session_ptr, 'string', size_t]],

  // Stream control - HIGH-LEVEL API
  'mds_stream_enable': [int, [mds_session_ptr]],
  'mds_stream_disable': [int, [mds_session_ptr]],
  'mds_stream_read_packet': [int, [mds_session_ptr, ref.refType(mds_stream_packet_t), int]],

  // Buffer-based parsing functions (for async stream data)
  'mds_parse_stream_packet': [int, [ref.refType(uint8_t), size_t, ref.refType(mds_stream_packet_t)]],

  // Utility functions
  'mds_validate_sequence': [bool, [uint8_t, uint8_t]],
  'mds_get_last_sequence': [uint8_t, [mds_session_ptr]],
  'mds_update_last_sequence': ['void', [mds_session_ptr, uint8_t]],
});

// Export ref types for use in other modules
export { ref, voidPtr, mds_session_ptr, mds_backend_ptr, ffi };
