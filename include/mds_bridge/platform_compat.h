/**
 * @file platform_compat.h
 * @brief Platform compatibility layer for cross-platform support
 *
 * This header provides compatibility shims for POSIX functions on Windows.
 */

#ifndef MDS_BRIDGE_PLATFORM_COMPAT_H
#define MDS_BRIDGE_PLATFORM_COMPAT_H

#ifdef _WIN32
    #include <windows.h>

    /* Sleep functions */
    #define sleep(x) Sleep((x) * 1000)
    #define usleep(x) Sleep((x) / 1000)

    /* clock_gettime replacement for Windows */
    #ifndef CLOCK_MONOTONIC
        #define CLOCK_MONOTONIC 0

        struct timespec {
            long tv_sec;
            long tv_nsec;
        };

        static inline int clock_gettime(int clk_id, struct timespec *ts) {
            (void)clk_id;
            ULONGLONG ms = GetTickCount64();
            ts->tv_sec = (long)(ms / 1000);
            ts->tv_nsec = (long)((ms % 1000) * 1000000);
            return 0;
        }
    #endif
#else
    #include <unistd.h>
#endif

#endif /* MDS_BRIDGE_PLATFORM_COMPAT_H */
