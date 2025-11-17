#!/usr/bin/env python3
"""
Simple test to verify the Python bindings work correctly
"""

import ctypes
from bindings import (
    lib,
    mds_stream_packet_t,
    mds_extract_sequence,
)


def test_parse_stream_packet():
    """Test parsing stream packet"""
    print("Testing mds_parse_stream_packet...")

    # Create test packet: sequence 5 + some data
    test_data = bytes([0x05, 0x01, 0x02, 0x03, 0x04, 0x05])
    buffer = (ctypes.c_uint8 * len(test_data))(*test_data)
    packet = mds_stream_packet_t()

    result = lib.mds_parse_stream_packet(buffer, len(test_data), ctypes.byref(packet))

    assert result == 0, f"Expected 0, got {result}"
    assert packet.sequence == 5, f"Expected sequence 5, got {packet.sequence}"
    assert packet.data_len == 5, f"Expected 5 bytes, got {packet.data_len}"
    assert list(packet.data[:5]) == [0x01, 0x02, 0x03, 0x04, 0x05], "Data mismatch"
    print(f"  ✓ Parsed packet: seq={packet.sequence}, len={packet.data_len}")


def test_validate_sequence():
    """Test sequence validation"""
    print("Testing mds_validate_sequence...")

    # Valid sequence
    assert lib.mds_validate_sequence(0, 1) == True, "Expected 0->1 to be valid"
    assert lib.mds_validate_sequence(5, 6) == True, "Expected 5->6 to be valid"
    assert lib.mds_validate_sequence(31, 0) == True, "Expected 31->0 to be valid (wrap)"

    # Invalid sequence
    assert lib.mds_validate_sequence(0, 2) == False, "Expected 0->2 to be invalid"
    assert lib.mds_validate_sequence(5, 5) == False, "Expected 5->5 to be invalid"

    print("  ✓ Sequence validation working correctly")


def test_extract_sequence():
    """Test sequence extraction helper"""
    print("Testing mds_extract_sequence...")

    assert mds_extract_sequence(0x00) == 0, "Expected 0"
    assert mds_extract_sequence(0x05) == 5, "Expected 5"
    assert mds_extract_sequence(0x1F) == 31, "Expected 31"
    assert mds_extract_sequence(0xE5) == 5, "Expected 5 (masked)"

    print("  ✓ Sequence extraction working correctly")


def main():
    print("=" * 60)
    print("Memfault HID Python Bindings Test")
    print("=" * 60)
    print()

    try:
        test_parse_stream_packet()
        test_validate_sequence()
        test_extract_sequence()

        print()
        print("=" * 60)
        print("All tests passed! ✓")
        print("=" * 60)

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
